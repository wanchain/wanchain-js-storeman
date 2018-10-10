"use strict";
const {
  // getChain,
  getGlobalChain,
  sleep
} = require('comm/lib');

const ModelOps = require('db/modelOps');
const Logger = require('comm/logger.js');
// const erc20CrossAgent = require('agent/Erc20CrossAgent.js');
const sendMail = require('comm/sendMail');

const fs = require('fs');
const config = JSON.parse(fs.readFileSync('conf/config.json'));
const moduleConfig = require('conf/moduleConfig.js');

const retryTimes = moduleConfig.retryTimes;
const retryWaitTime = moduleConfig.retryWaitTime;
const confirmTimes = moduleConfig.confirmTimes;

const Web3 = require("web3");
const web3 = new Web3();

function getWeiFromEther(ether) {
  return web3.toWei(ether, 'ether');
}

/* action: [functionName, paras, nextState, rollState] */
var stateDict = {
  init: {
    action: 'initState',
    paras: [],
    nextState: 'waitingCross',
    rollState: 'checkApprove'
  },
  checkApprove: {
    action: 'checkAllowance',
    paras: [],
    nextState: 'waitingCross',
    rollState: 'waitingApproveLock'
  },
  waitingApproveLock: {
    action: 'sendTrans',
    paras: [['approveZero', 'approve', 'lock'], 'storemanLockEvent'],
    nextState: ['waitingCrossLockConfirming', 'waitingX'],
    rollState: ['waitingApproveLock', 'waitingIntervention']
  },
  waitingCross: {
    action: 'sendTrans',
    paras: ['lock', 'storemanLockEvent'],
    nextState: ['waitingCrossLockConfirming', 'waitingX'],
    rollState: ['waitingCross', 'waitingIntervention']
  },
  waitingCrossLockConfirming: {
    action: 'checkStoremanTransOnline',
    paras: ['storemanLockEvent', 'storemanLockTxHash'],
    nextState: 'waitingX',
    rollState: ['init', 'waitingIntervention']
  },
  waitingX: {
    action: 'checkWalletEventOnline',
    paras: ['walletRefundEvent'],
    nextState: 'receivedX',
    rollState: 'waitingX'
  },
  receivedX: {
    action: 'sendTrans',
    paras: ['refund', 'storemanRefundEvent'],
    nextState: ['waitingCrossRefundConfirming', 'refundFinished'],
    rollState: ['receivedX', 'waitingIntervention']
  },
  waitingCrossRefundConfirming: {
    action: 'checkStoremanTransOnline',
    paras: ['storemanRefundEvent', 'storemanRefundTxHash'],
    nextState: 'refundFinished',
    rollState: ['receivedX', 'waitingIntervention']
  },
  refundFinished: {
  },
  waitingRevoke: {
    action: 'sendTrans',
    paras: ['revoke', 'storemanRevokeEvent'],
    nextState: ['waitingCrossRevokeConfirming', 'revokeFinished'],
    rollState: ['waitingRevoke', 'waitingIntervention']
  },
  waitingCrossRevokeConfirming: {
    action: 'checkStoremanTransOnline',
    paras: ['storemanRevokeEvent', 'storemanRevokeTxHash'],
    nextState: 'revokeFinished',
    rollState: ['waitingRevoke', 'waitingIntervention']
  },
  revokeFinished: {
  },
  waitingIntervention: {
    action: 'takeIntervention',
    paras: [],
    nextState: 'interventionPending',
    rollState: 'waitingIntervention'
  },
  transIgnored: {
  },
  foundLosted: {
    action: 'takeIntervention',
    paras: [],
    nextState: 'transFinished',
    rollState: 'waitingIntervention'
  },
  interventionPending: {
    action: 'initState',
    paras: [],
    nextState: 'waitingCross',
    rollState: 'checkApprove'
  },
  transFinished: {
  }
};

module.exports = class stateAction {
  constructor(record, logger, db) {
    this.record = record;
    this.crossChain = record.crossChain;
    this.tokenType = record.tokenType;
    this.hashX = record.hashX;
    this.state = record.status;
    this.crossDirection = record.direction;
    this.logger = logger;
    this.db = db;
    this.modelOps = new ModelOps(logger, db);
    this.logger.debug("********************************** stateAction ********************************** hashX:", this.hashX, "status:", this.state);
  }

  updateRecord(content) {
    this.logger.debug("********************************** updateRecord ********************************** hashX:", this.hashX, "content:", content);
    this.modelOps.saveScannedEvent(this.hashX, content);
  }

  updateState(state) {
    this.logger.debug("********************************** updateState ********************************** hashX:", this.hashX, "status:", state);
    let content = {
      status: state,
    };
    this.updateRecord(content);
  }

  takeAction() {
  	let self = this;
    return new Promise(async (resolve, reject) => {
      try {
        if (!self.checkHashTimeout()) {
          let action = stateDict[self.state].action;
          if (typeof(self[action]) === "function") {
            let paras = stateDict[self.state].paras;
            paras = paras.concat([stateDict[self.state].nextState, stateDict[self.state].rollState]);
            self.logger.debug("********************************** takeAction ********************************** hashX:", action, paras)
            await self[action](...paras);
          }
          // resolve();
        }
        resolve();
      } catch (err) {
        self.logger.error("There is takeAction error", err);
        reject(err);
      }
    })

  }

  initState(nextState, rollState) {
  	if (this.record.walletLockEvent.length !== 0) {
      let status;
      if(this.record.tokenType === 'COIN') {
        status = nextState;
      } else {
        status = (this.record.direction === 0) ? nextState : rollState;
      }
      this.updateState(status);
  	}
  }

  takeIntervention(nextState, rollState) {
    fs.appendFile(config.issueCollection, this.record, (err) => {
      if(!err) {
        this.logger.error("TakeIntervention done of hashX", this.record.hashX);
        this.updateState(nextState);
      } else {
        this.logger.error("TakeIntervention failed of hashX", this.record.hashX, err);
        this.updateState(rollState);
      }
    })
  }

  takeMailIntervention(nextState, rollState) {
    let receive = config.mailReceiver;
    try {
      let mailPro = sendMail(receive, this.record.status, this.record.toString());
      mailPro.then((result) => {
        this.logger.error("send mail successfully, receive:%s subject:%s content:%s\n",
          receive,
          this.record.status,
          this.record);
        this.updateState(nextState);
      }, (err) => {
        this.logger.error("send mail failed, receive:%s subject:%s content:%s\n error: %s",
          receive,
          this.record.status,
          this.record,
          err);
        this.updateState(rollState);
      })
    } catch (err) {
      this.logger.error("send mail failed, receive:%s subject:%s content:%s\n error: %s",
        receive,
        this.record.status,
        this.record,
        err);
    }
  }

  async sendTrans(actionArray, eventName, nextState, rollState) {
    this.logger.debug(this.record);

    if (eventName !== null) {
      let event = this.record[eventName];
      if (event.length !== 0) {
        let content = {
          status: nextState[1],
          transConfirmed: 0
        }
        this.updateRecord(content);
        return;
      }
    }

    if (!Array.isArray(actionArray)) {
      actionArray = [actionArray];
    } else {
      actionArray = [...actionArray];
    }

    let result = {};

    try {
      if (this.record.transRetried !== 0) {
        await sleep(retryWaitTime);
      }
      for (var action of actionArray) {
        let newAgent = new global.agentDict[this.crossChain.toUpperCase()][this.tokenType](this.crossChain, this.tokenType, this.crossDirection, this.record, action);
        this.logger.debug("********************************** sendTrans begin ********************************** hashX:", this.hashX, "action:", action);
        await newAgent.initAgentTransInfo(action);

        newAgent.createTrans(action);
        if (config.isLeader || !(moduleConfig.mpcSignature)) {
          let content = await newAgent.sendTransSync();
          this.logger.debug("********************************** sendTrans done ********************************** hashX:", this.hashX, "action:", action);
          this.logger.debug("sendTrans result is ", content);
          Object.assign(result, content);
        } else {
          await newAgent.validateTrans();
        }
      }
      result.transRetried = 0;
      result.status = nextState[0];
    } catch (err) {
      this.logger.error("sendTransaction faild, action:", action, ", and record.hashX:", this.hashX);
      this.logger.error("err is", err);
      if (this.record.transRetried < retryTimes) {
        result.transRetried = this.record.transRetried + 1;
        result.status = rollState[0];
      } else {
        result.transRetried = 0;
        result.status = rollState[1];
      }
      this.logger.debug(result);
    }

    this.updateRecord(result);
  }

  checkHashTimeout() {
    let record = this.record;
    let state = this.state;
    this.logger.debug("********************************** checkHashTimeout ********************************** hashX:", this.hashX, record.status);

    if (state === "waitingIntervention" || state === "foundLosted") {
      return false;
    }

    if (state === "waitingRevoke" ||
      state === "waitingCrossRevokeConfirming" ||
      state === "revokeFailed") {
      if (record.walletRefundEvent.length !== 0) {
        this.updateState('foundLosted');
      } 
      return false;
    }

    try {
      let HTLCtime = Number(record.HTLCtime);
      // let suspendTime = Number(record.suspendTime);
      let timestamp = Number(record.timestamp);

      let HTLCtimeDate = new Date(HTLCtime).toString();
      // let suspendTimeDate = new Date(suspendTime).toString();
      let timestampDate = new Date(timestamp).toString();
      let nowData = new Date().toString();

      if (HTLCtime <= Date.now()) {
        this.logger.debug("********************************** checkHashTimeout ********************************** hashX", this.hashX, "timestampDate:", timestampDate, "HTLCtimeDate:", HTLCtimeDate, "nowData:", nowData);
        if (record.storemanRevokeEvent.length !== 0) {
          this.updateState('revokeFinished');
        } else if (record.storemanRefundEvent.length !== 0) {
          this.updateState('refundFinished');
        } else if (record.storemanLockEvent.length === 0) {
          this.updateState('transIgnored');
        } else if (record.walletRefundEvent.length !== 0) {
          this.updateState('foundLosted');
        } else {
          this.updateState('waitingRevoke');
        }
        return true;
      }
    } catch (err) {
      this.logger.error("checkHashTimeout:", err);
    }
    return false;
  }

  checkWaitTimeout() {}

  async checkAllowance(nextState, rollState) {
    let newAgent = new new global.agentDict[this.crossChain.toUpperCase()][this.tokenType](this.crossChain, this.tokenType, 1, this.record);
    let chain = getGlobalChain(this.crossChain);
    await chain.getTokenAllowance(newAgent.tokenAddr, config.storemanEth, newAgent.contractAddr, moduleConfig.erc20Abi)
      .then((result) => {
        if (result < Math.max(getWeiFromEther(web3.toBigNumber(moduleConfig.tokenAllowanceThreshold)), web3.toBigNumber(this.record.value))) {
          this.updateState(rollState);
        } else {
          this.updateState(nextState);
        }
      }).catch(err => {
        this.updateState('checkApprove');
      })
  }

  async checkStoremanTransOnline(eventName, transHashName, nextState, rollState) {
    let content = {};
    let transOnChain;

    if (this.record.direction === 0) {
      if (eventName === 'storemanRefundEvent') {
        transOnChain = this.crossChain;
      } else {
        transOnChain = 'wan';
      }
    } else {
      if (eventName === 'storemanRefundEvent') {
        transOnChain = 'wan';
      } else {
        transOnChain = this.crossChain;
      }
    }

    try {
      this.logger.debug("********************************** checkStoremanTransOnline checkEvent**********************************", eventName, this.hashX);

      if (eventName !== null) {
        let event = this.record[eventName];
        let transConfirmed = this.record.transConfirmed;

        if (event.length !== 0) {
          content = {
            status: nextState,
            transConfirmed: 0
          }
          this.updateRecord(content);
          return;
        }
        if (transConfirmed > confirmTimes) {
          content = {
            status: rollState[0],
            transConfirmed: 0
          }

          global[transOnChain + 'NonceRenew'] = true;

          this.updateRecord(content);
          return;
        }
      }

      if (!config.isLeader && moduleConfig.mpcSignature) {
        return;
      }

      let receipt;
      let chain = getGlobalChain(transOnChain);
      let txHash = this.record[transHashName];
      this.logger.debug("********************************** checkStoremanTransOnline checkHash**********************************", this.hashX, transHashName, txHash);
      receipt = await chain.getTransactionConfirmSync(txHash, moduleConfig.CONFIRM_BLOCK_NUM);
      if (receipt !== null) {
        if (receipt.status === '0x1') {
          content = {
            status: nextState,
            transConfirmed: 0
          }
        } else {
          content = {
            status: rollState[1],
            transConfirmed: 0
          }
        }
        this.updateRecord(content);
      }
    } catch (err) {
      this.logger.error("checkStoremanTransOnline:", err);
    }
  }

  async checkWalletEventOnline(eventName, nextState) {
    try {
      this.logger.debug("********************************** checkWalletEventOnline **********************************", eventName, this.hashX);
      let event = this.record[eventName];
      if (event.length !== 0) {
        this.updateState(nextState);
        return;
      }
    } catch (err) {
      this.logger.error("checkWalletEventOnline:", this.record.hashX, eventName, err);
    }
  }
}
"use strict";
const {
  // getChain,
  getGlobalChain,
  sleep
} = require('comm/lib');

const ModelOps = require('db/modelOps');
const Logger = require('comm/logger.js');
const sendMail = require('comm/sendMail');

const fs = require('fs');
const path = require("path");
const moduleConfig = require('conf/moduleConfig.js');
const configJson = require('conf/config.json');
const config = moduleConfig.testnet?configJson.testnet:configJson.main;

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
    paras: ['waitingCross', 'checkApprove']
  },
  checkApprove: {
    action: 'checkAllowance',
    paras: ['waitingCross', 'waitingApproveLock']
  },
  waitingApproveLock: {
    action: 'sendTrans',
    paras: [
      ['approveZero', 'approve', 'lock'], 'storemanLockEvent', ['waitingCrossLockConfirming', 'waitingX'],
      ['waitingApproveLock', 'waitingIntervention']
    ]
  },
  waitingCross: {
    action: 'sendTrans',
    paras: ['lock', 'storemanLockEvent', ['waitingCrossLockConfirming', 'waitingX'],
      ['waitingCross', 'waitingIntervention']
    ]
  },
  waitingCrossLockConfirming: {
    action: 'checkStoremanTransOnline',
    paras: ['storemanLockEvent', 'storemanLockTxHash', 'waitingX', ['init', 'waitingIntervention']]
  },
  waitingX: {
    action: 'checkWalletEventOnline',
    paras: ['walletRedeemEvent', 'receivedX', 'waitingX']
  },
  receivedX: {
    action: 'sendTrans',
    paras: ['redeem', 'storemanRedeemEvent', ['waitingCrossRedeemConfirming', 'redeemFinished'],
      ['receivedX', 'waitingIntervention']
    ]
  },
  waitingCrossRedeemConfirming: {
    action: 'checkStoremanTransOnline',
    paras: ['storemanRedeemEvent', 'storemanRedeemTxHash', 'redeemFinished', ['receivedX', 'waitingIntervention']]
  },
  redeemFinished: {},
  waitingRevoke: {
    action: 'sendTrans',
    paras: ['revoke', 'storemanRevokeEvent', ['waitingCrossRevokeConfirming', 'revokeFinished'],
      ['waitingRevoke', 'waitingIntervention']
    ]
  },
  waitingCrossRevokeConfirming: {
    action: 'checkStoremanTransOnline',
    paras: ['storemanRevokeEvent', 'storemanRevokeTxHash', 'revokeFinished', ['waitingRevoke', 'waitingIntervention']]
  },
  revokeFinished: {},
  waitingIntervention: {
    action: 'takeIntervention',
    paras: ['interventionPending', 'waitingIntervention']
  },
  transIgnored: {},
  foundLosted: {
    action: 'takeIntervention',
    paras: ['transFinished', 'waitingIntervention']
  },
  interventionPending: {
    action: 'initState',
    paras: ['waitingCross', 'checkApprove']
  },
  transFinished: {}
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
            self.logger.debug("********************************** takeAction ********************************** hashX:", this.hashX, action, paras)
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
    let mkdirsSync = function(dirname) {
      if (fs.existsSync(dirname)) {
        return true;
      } else {
        if (mkdirsSync(path.dirname(dirname))) {
          fs.mkdirSync(dirname);
          return true;
        }
      }
    }
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    let issueCollection = config.issueCollectionPath + 'issueCollection' + year + '-' + month + '-' + day + '.txt';
    let content = this.record + '\n';
    if (mkdirsSync(config.issueCollectionPath)) {
      fs.appendFile(issueCollection, content, (err) => {
        if (!err) {
          this.logger.error("TakeIntervention done of hashX", issueCollection, this.record.hashX);
          this.updateState(nextState);
        } else {
          this.logger.error("TakeIntervention failed of hashX", issueCollection, this.record.hashX, err);
          this.updateState(rollState);
        }
      })
    }
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
      if (['redeem', 'revoke'].indexOf(actionArray) === -1) {
        if (!await this.checkStoremanQuota) {
          let content = {
            status: 'transIgnored',
            transConfirmed: 0
          }
          this.updateRecord(content);
          return;
        }
      }
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
      if (record.walletRedeemEvent.length !== 0) {
        this.updateState('foundLosted');
      } 
      return false;
    }

    try {
      let HTLCtime;
      if (record.storemanLockEvent.length !== 0) {
        HTLCtime = Number(record.storemanLockEvent[0].timestamp) * 1000 + Number(record.lockedTime);
      } else {
        HTLCtime = Number(record.timestamp) + Number(record.lockedTime);
      }
      // let HTLCtime = Number(record.HTLCtime);
      let suspendTime = Number(record.suspendTime);
      let timestamp = Number(record.timestamp);

      let HTLCtimeDate = new Date(HTLCtime).toString();
      let suspendTimeDate = new Date(suspendTime).toString();
      let timestampDate = new Date(timestamp).toString();
      let nowData = new Date().toString();

      if (HTLCtime <= Date.now()) {
        this.logger.debug("********************************** checkHashTimeout ********************************** hashX", this.hashX, "timestampDate:", timestampDate, "HTLCtimeDate:", HTLCtimeDate, "nowData:", nowData);
        if (record.storemanRevokeEvent.length !== 0) {
          this.updateState('revokeFinished');
        } else if (record.storemanRedeemEvent.length !== 0) {
          this.updateState('redeemFinished');
        } else if (record.storemanLockEvent.length === 0) {
          this.updateState('transIgnored');
        } else if (record.walletRedeemEvent.length !== 0) {
          this.updateState('foundLosted');
        } else {
          this.updateState('waitingRevoke');
        }
        return true;
      }

      if (suspendTime <= Date.now()) {
        this.logger.debug("********************************** checkSecureSuspendTimeOut ********************************** hashX", this.hashX, "timestampDate:", timestampDate, "suspendTimeDate:", suspendTimeDate, "nowData:", nowData);
        if (record.storemanLockEvent.length === 0) {
          this.updateState('transIgnored');
        }
        return true;
      }
    } catch (err) {
      this.logger.error("checkHashTimeout:", err);
    }
    return false;
  }

  async checkAllowance(nextState, rollState) {
    let newAgent = new global.agentDict[this.crossChain.toUpperCase()][this.tokenType](this.crossChain, this.tokenType, 1, this.record);
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
    let transConfirmed;

    if (this.record.direction === 0) {
      if (eventName === 'storemanRedeemEvent') {
        transOnChain = this.crossChain;
      } else {
        transOnChain = 'wan';
      }
    } else {
      if (eventName === 'storemanRedeemEvent') {
        transOnChain = 'wan';
      } else {
        transOnChain = this.crossChain;
      }
    }

    try {
      this.logger.debug("********************************** checkStoremanTransOnline checkEvent**********************************", eventName, this.hashX);

      if (eventName !== null) {
        let event = this.record[eventName];
        transConfirmed = this.record.transConfirmed;

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
        content = {
          transConfirmed: transConfirmed + 1
        }
        this.updateRecord(content);
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
      } else {
          content = {
            transConfirmed: transConfirmed + 1
          }
      }
      this.updateRecord(content);
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

  async getStoremanQuota() {
    let storemanGroupAddr = moduleConfig.storemanWan;
    let storemanQuotaInfo;
    let chain = getGlobalChain(this.crossChain);

    try{
      if(this.tokenType === 'COIN') {
        storemanQuotaInfo = await chain.getStoremanQuota(this.crossChain.toUpperCase(), this.tokenType, storemanGroupAddr);
      } else {
        storemanQuotaInfo = await chain.getErc20StoremanQuota(this.crossChain.toUpperCase(), this.tokenType, this.record.tokenAddr, storemanGroupAddr);
      }
      this.logger.debug("getStoremanQuota result is", storemanQuotaInfo);

      if(this.crossDirection === 0) {
        return storemanQuotaInfo[1];
      } else {
        return storemanQuotaInfo[2];
      }
    } catch(err) {
      this.logger.error("getStoremanQuota error:", err);
      return null;
    }
  }

  async checkStoremanQuota() {
    let boundQuota = await this.getStoremanQuota();

    if(boundQuota !== null) {
      if(web3.toBigNumber(this.record.value) > web3.toBigNumber(boundQuota)) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }
}
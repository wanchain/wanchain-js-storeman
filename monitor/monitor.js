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
      ['waitingApproveLock', 'transFailedBeforeHTLC2time']
    ]
  },
  waitingCross: {
    action: 'sendTrans',
    paras: ['lock', 'storemanLockEvent', ['waitingCrossLockConfirming', 'waitingX'],
      ['waitingCross', 'transFailedBeforeHTLC2time']
    ]
  },
  waitingCrossLockConfirming: {
    action: 'checkStoremanTransOnline',
    paras: ['storemanLockEvent', 'storemanLockTxHash', 'waitingX', ['init', 'transFailedBeforeHTLC2time']]
  },
  waitingX: {
    action: 'checkWalletEventOnline',
    paras: ['walletRedeemEvent', 'receivedX', 'waitingX']
  },
  receivedX: {
    action: 'sendTrans',
    paras: ['redeem', 'storemanRedeemEvent', ['waitingCrossRedeemConfirming', 'redeemFinished'],
      ['receivedX', 'transFailedBeforeHTLC2time']
    ]
  },
  waitingCrossRedeemConfirming: {
    action: 'checkStoremanTransOnline',
    paras: ['storemanRedeemEvent', 'storemanRedeemTxHash', 'redeemFinished', ['receivedX', 'transFailedBeforeHTLC2time']]
  },
  redeemFinished: {},
  waitingRevoke: {
    action: 'sendTrans',
    paras: ['revoke', 'storemanRevokeEvent', ['waitingCrossRevokeConfirming', 'revokeFinished'],
      ['waitingRevoke', 'transFailedBeforeHTLC2time']
    ]
  },
  waitingCrossRevokeConfirming: {
    action: 'checkStoremanTransOnline',
    paras: ['storemanRevokeEvent', 'storemanRevokeTxHash', 'revokeFinished', ['waitingRevoke', 'transFailedBeforeHTLC2time']]
  },
  revokeFinished: {},
  waitingIntervention: {
  },
  transFailedBeforeHTLC2time: {
    action: 'takeIntervention',
    paras: ['waitingIntervention', 'transFailedBeforeHTLC2time']
  },
  transIgnored: {},
  fundLosted: {
    action: 'takeIntervention',
    paras: ['fundLostFinished', 'fundLosted']
  },
  interventionPending: {
    action: 'initState',
    paras: ['waitingCross', 'checkApprove']
  },
  fundLostFinished: {}
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

  async updateRecord(content) {
    this.logger.debug("********************************** updateRecord ********************************** hashX:", this.hashX, "content:", content);
    await this.modelOps.syncSave(this.hashX, content);
  }

  async updateState(state) {
    this.logger.debug("********************************** updateState ********************************** hashX:", this.hashX, "status:", state);
    let content = {
      status: state,
    };
    this.state = state;
    await this.updateRecord(content);
  }

  async updateFailReason(action, err) {
    let error = (err.hasOwnProperty("message")) ? err.message : err;
    let failReason = action + ' ' + error;
    this.logger.debug("********************************** updateFailReason ********************************** hashX:", this.hashX, "failReason:", failReason);
    let content = {
      failAction: action,
      failReason: failReason
    };
    await this.updateRecord(content);
  }

  takeAction() {
  	let self = this;
    return new Promise(async (resolve, reject) => {
      try {
        if (!await self.checkHashTimeout()) {
          if (stateDict[self.state].hasOwnProperty('action')) {
            let action = stateDict[self.state].action;
            if (typeof(self[action]) === "function") {
              let paras = stateDict[self.state].paras;
              self.logger.debug("********************************** takeAction ********************************** hashX:", this.hashX, action, paras)
              await self[action](...paras);
            }
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

  async initState(nextState, rollState) {
    console.log("ahahah", this.record.hashX);
  	if (this.record.walletLockEvent.length !== 0) {
      let status;
      if(this.record.tokenType === 'COIN') {
        status = nextState;
      } else {
        status = (this.record.direction === 0) ? nextState : rollState;
      }
      await this.updateState(status);
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
    let content = JSON.stringify(this.record) + '\n';
    if (mkdirsSync(config.issueCollectionPath)) {
      fs.appendFile(issueCollection, content, async (err) => {
        if (!err) {
          this.logger.error("TakeIntervention done of hashX", issueCollection, this.record.hashX);
          await this.updateState(nextState);
        } else {
          this.logger.error("TakeIntervention failed of hashX", issueCollection, this.record.hashX, err);
          await this.updateState(rollState);
        }
      })
    }
  }

  takeMailIntervention(nextState, rollState) {
    let receive = config.mailReceiver;
    try {
      let mailPro = sendMail(receive, this.record.status, this.record.toString());
      mailPro.then(async (result) => {
        this.logger.error("send mail successfully, receive:%s subject:%s content:%s\n",
          receive,
          this.record.status,
          this.record);
        await this.updateState(nextState);
      }, async (err) => {
        this.logger.error("send mail failed, receive:%s subject:%s content:%s\n error: %s",
          receive,
          this.record.status,
          this.record,
          err);
        await this.updateState(rollState);
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
        await this.updateRecord(content);
        return;
      }
    }

    if (!Array.isArray(actionArray)) {
      if ((['redeem', 'revoke'].indexOf(actionArray) === -1) && (this.record.direction === 0)) {
        if (!await this.checkStoremanQuota()) {
          let content = {
            status: 'transIgnored',
            transConfirmed: 0
          }
          await this.updateRecord(content);
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
      this.logger.error("sendTransaction faild err is", err);
      if (this.record.transRetried < retryTimes) {
        result.transRetried = this.record.transRetried + 1;
        result.status = rollState[0];
      } else {
        result.transRetried = 0;
        result.status = rollState[1];
        await this.updateFailReason(action, err);
      }
      this.logger.debug(result);
    }

    await this.updateRecord(result);
  }

  async checkHashTimeout() {
    let record = this.record;
    let state = this.state;
    this.logger.debug("********************************** checkHashTimeout ********************************** hashX:", this.hashX, record.status);

    if (state === "interventionPending" || state === "fundLosted" ) {
      return false;
    }

    try {
      let HTLCtime;
      if (record.storemanLockEvent.length !== 0) {
        HTLCtime = Number(record.storemanLockEvent[0].timestamp) * 1000 + Number(record.lockedTime);
      } else {
        HTLCtime = Number(record.timestamp) + Number(record.lockedTime);
      }
      let HTLC2time = Number(record.timestamp) + Number(record.lockedTime) * 2;
      let suspendTime = Number(record.suspendTime);
      let timestamp = Number(record.timestamp);

      let HTLCtimeDate = new Date(HTLCtime).toString();
      let HTLC2timeDate = new Date(HTLC2time).toString();
      let suspendTimeDate = new Date(suspendTime).toString();
      let timestampDate = new Date(timestamp).toString();
      let nowData = new Date().toString();

      // beforeHTLC2time, revoke maybe fail because of late walletRedeemEvent
      if (state === "waitingIntervention") {
        if (HTLC2time <= Date.now()) {
          if (record.walletRedeemEvent.length !== 0) {
            this.logger.debug("********************************** checkHashTimeout ********************************** hashX", this.hashX, "timestampDate:", timestampDate, "HTLC2timeDate:", HTLC2timeDate, "nowData:", nowData);
            await this.updateState('fundLosted');
          } else {
            await this.updateState("interventionPending");
            return true; // return true to take no action
          }
        } else {
          if((record.failAction === 'lock' || record.failAction === 'approve' || record.failAction === 'approveZero') && record.storemanLockEvent.length !== 0) {
            this.state = 'waitingX';
          } else if (record.failAction === 'redeem' && record.storemanRedeemEvent.length !== 0) {
            this.state = 'redeemFinished';
          } else if (record.failAction === 'revoke' && record.storemanRevokeEvent.length !== 0) {
            this.state = 'revokeFinished';
          } else if (record.failAction === 'revoke' && record.walletRedeemEvent.length !== 0) {
            this.state = 'receivedX';
          }
          let content = {
            transConfirmed: 0,
            transRetried: 0,
            status: this.state
          }
          await this.updateRecord(content);
        }
        return false;
      }

      if (state === "waitingRevoke" ||
        state === "waitingCrossRevokeConfirming") {
        if (record.walletRedeemEvent.length !== 0) {
          if (Date.now() < HTLC2time) {
            let content = {
              status: 'receivedX',
              transConfirmed: 0,
              transRetried: 0
            }
            await this.updateRecord(content);
            this.state = 'receivedX';
          } else {
            this.logger.debug("********************************** checkHashTimeout ********************************** hashX", this.hashX, "timestampDate:", timestampDate, "HTLC2timeDate:", HTLC2timeDate, "nowData:", nowData);
            await this.updateState('fundLosted');
          }
        }
        return false;
      }

      if (HTLCtime <= Date.now()) {
        this.logger.debug("********************************** checkHashTimeout ********************************** hashX", this.hashX, "timestampDate:", timestampDate, "HTLCtimeDate:", HTLCtimeDate, "nowData:", nowData);
        if (record.storemanRevokeEvent.length !== 0) {
          await this.updateState('revokeFinished');
        } else if (record.storemanRedeemEvent.length !== 0) {
          await this.updateState('redeemFinished');
        } else if (record.storemanLockEvent.length === 0) {
          await this.updateState('transIgnored');
        } else if (record.walletRedeemEvent.length !== 0) {
          // redeem may happened until HTLC2time
          if (HTLC2time <= Date.now()) {
            await this.updateState("waitingRevoke");
          }
        } else {
          await this.updateState('waitingRevoke');
        }
        return false;
      }

      if ((suspendTime <= Date.now()) && (record.storemanLockEvent.length === 0)) {
        this.logger.debug("********************************** checkSecureSuspendTimeOut ********************************** hashX", this.hashX, "timestampDate:", timestampDate, "suspendTimeDate:", suspendTimeDate, "nowData:", nowData);
        await this.updateState('transIgnored');
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
      .then(async (result) => {
        if (result < Math.max(getWeiFromEther(web3.toBigNumber(moduleConfig.tokenAllowanceThreshold)), web3.toBigNumber(this.record.value))) {
          await this.updateState(rollState);
        } else {
          await this.updateState(nextState);
        }
      }).catch(async (err) => {
        await this.updateState('checkApprove');
      })
  }

  async checkStoremanTransOnline(eventName, transHashName, nextState, rollState) {
    let content = {};
    let transOnChain;
    let transConfirmed;

    let actionMap = {
      storemanLockEvent: 'lock',
      storemanRedeemEvent: 'redeem',
      storemanRevokeEvent: 'revoke'
    }

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
          await this.updateRecord(content);
          return;
        }
        if (transConfirmed > confirmTimes) {
          content = {
            status: rollState[0],
            transConfirmed: 0
          }

          global[transOnChain + 'NonceRenew'] = true;

          await this.updateRecord(content);
          return;
        }
      }

      if (!config.isLeader && moduleConfig.mpcSignature) {
        content = {
          transConfirmed: transConfirmed + 1
        }
        await this.updateRecord(content);
        return;
      }

      let receipt;
      let chain = getGlobalChain(transOnChain);
      let txHashArray = this.record[transHashName];
      txHashArray = (Array.isArray(txHashArray)) ? [...txHashArray] : [txHashArray];

      for (var txHash of txHashArray) {
        this.logger.debug("********************************** checkStoremanTransOnline checkHash**********************************", this.hashX, transHashName, txHash);
        receipt = await chain.getTransactionConfirmSync(txHash, moduleConfig.CONFIRM_BLOCK_NUM);
        if (receipt !== null) {
          if (receipt.status === '0x1') {
            content = {
              status: nextState,
              transConfirmed: 0
            }
            break;
          } else {
            if (txHashArray.indexOf(txHash) === (txHashArray.length - 1)) {
              content = {
                status: rollState[1],
                transConfirmed: 0
              }
              let failReason = 'txHash receipt is 0x0! Cannot find ' + eventName;
              await this.updateFailReason(actionMap[eventName], failReason);
            }
          }
        } else {
          if (txHashArray.indexOf(txHash) === (txHashArray.length - 1)) {
            if (this.record.transRetried < retryTimes) {
              content = {
                transConfirmed: transConfirmed + 1
              }
            } else {
              content = {
                status: rollState[1],
                transConfirmed: 0
              }
              await this.updateFailReason(actionMap[eventName], "exceed retryTimes");
            }
          }
        }
      }
      await this.updateRecord(content);
    } catch (err) {
      this.logger.error("checkStoremanTransOnline:", err);
    }
  }

  async checkWalletEventOnline(eventName, nextState) {
    try {
      this.logger.debug("********************************** checkWalletEventOnline **********************************", eventName, this.hashX);
      let event = this.record[eventName];
      if (event.length !== 0) {
        await this.updateState(nextState);
        return;
      }
    } catch (err) {
      this.logger.error("checkWalletEventOnline:", this.record.hashX, eventName, err);
    }
  }

  async getStoremanQuota() {
    let storemanGroupAddr = config.storemanWan;
    let storemanQuotaInfo;
    let chain = getGlobalChain('wan');

    try{
      if(this.tokenType === 'COIN') {
        storemanQuotaInfo = await chain.getStoremanQuota(this.crossChain.toUpperCase(), this.tokenType, storemanGroupAddr);
      } else {
        storemanQuotaInfo = await chain.getErc20StoremanQuota(this.crossChain.toUpperCase(), this.tokenType, this.record.tokenAddr, storemanGroupAddr);
      }
      this.logger.debug("getStoremanQuota result is", storemanQuotaInfo, this.hashX);

      if(this.crossDirection === 0) {
        return storemanQuotaInfo[1];
      } else {
        return storemanQuotaInfo[2];
      }
    } catch(err) {
      this.logger.error("getStoremanQuota error:", err, this.hashX);
      return null;
    }
  }

  async checkStoremanQuota() {
    let boundQuota = await this.getStoremanQuota();
    this.logger.debug("checkStoremanQuota boundQuota is", boundQuota, this.hashX);

    if(boundQuota !== null) {
      if (web3.toBigNumber(this.record.value).cmp(web3.toBigNumber(boundQuota)) > 0) {
        this.logger.debug("checkStoremanQuota value %s is bigger than boundQuota %s", this.record.value.toString(), boundQuota.toString(), this.hashX);
        return false;
      } else {
        this.logger.debug("checkStoremanQuota value %s is smaller than boundQuota %s", this.record.value.toString(), boundQuota.toString(), this.hashX);
        return true;
      }
    } else {
      return true;
    }
  }
}
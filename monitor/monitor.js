"use strict";

const ModelOps = require('db/modelOps');
const Logger = require('comm/logger.js');
const erc20CrossAgent = require('agent/Erc20CrossAgent.js');
const sendMail = require('comm/sendMail');

const retryTime = 0;
const tokenAllowance = 1000000000;
/* action: [functionName, paras, nextState, rollState] */
var stateDict = {
  checkApprove: {
    action: 'checkAllowance',
    paras: [],
    nextState: 'approveFinished',
    rollState: 'waitingApprove'
  },
  waitingApprove: {
    action: 'sendTrans',
    paras: ['approve'],
    nextState: 'waitingCrossApproveConfirming',
    rollState: 'approveFailed'
  },
  waitingCrossApproveConfirming: {
    action: 'checkStoremanTransOnline',
    paras: [null, 'storemanApproveTxHash'],
    nextState: 'approveFinished',
    rollState: 'approveFailed'
  },
  approveFailed: {
    action: 'sendTrans',
    paras: ['approve'],
    nextState: 'waitingCrossApproveConfirming',
    rollState: 'waitingIntervention'
  },
  approveFinished: {
    action: 'sendTrans',
    paras: ['lock'],
    nextState: 'waitingCrossLockConfirming',
    rollState: 'lockHashFailed'
  },
  waitingCross: {
    action: 'sendTrans',
    paras: ['lock'],
    nextState: 'waitingCrossLockConfirming',
    rollState: 'lockHashFailed'
  },
  waitingCrossLockConfirming: {
    action: 'checkStoremanTransOnline',
    paras: ['storemanLockEvent', 'storemanLockTxHash'],
    nextState: 'waitingX',
    rollState: 'lockHashFailed'
  },
  lockHashFailed: {
    action: 'sendTrans',
    paras: ['lock'],
    nextState: 'waitingCrossLockConfirming',
    rollState: 'waitingIntervention'
  },
  waitingX: {
    action: 'checkWalletEventOnline',
    paras: ['walletRefundEvent'],
    nextState: 'receivedX',
    rollState: 'waitingX'
  },
  receivedX: {
    action: 'sendTrans',
    paras: ['refund'],
    nextState: 'waitingCrossRefundConfirming',
    rollState: 'refundFailed'
  },
  waitingCrossRefundConfirming: {
    action: 'checkStoremanTransOnline',
    paras: ['storemanRefundEvent', 'storemanRefundTxHash'],
    nextState: 'refundFinished',
    rollState: 'refundFailed'
  },
  refundFailed: {
    action: 'sendTrans',
    paras: ['refund'],
    nextState: 'waitingCrossRefundConfirming',
    rollState: 'waitingIntervention'
  },
  refundFinished: {
    action: '',
    paras: [],
    nextState: '',
    rollState: ''
  },
  walletRevoked: {
    action: '',
    paras: [],
    nextState: '',
    rollState: ''
  },
  waitingRevoke: {
    action: 'sendTrans',
    paras: ['revoke'],
    nextState: 'waitingCrossRevokeConfirming',
    rollState: 'revokeFailed'
  },
  waitingCrossRevokeConfirming: {
    action: 'checkStoremanTransOnline',
    paras: ['storemanRevokeEvent', 'storemanRevokeTxHash'],
    nextState: 'revokeFinished',
    rollState: 'revokeFailed'
  },
  revokeFailed: {
    action: 'sendTrans',
    paras: ['revoke'],
    nextState: 'waitingCrossRevokeConfirming',
    rollState: 'waitingIntervention'
  },
  revokeFinished: {
    action: '',
    paras: [],
    nextState: '',
    rollState: ''
  },
  waitingIntervention: {
    action: 'takeIntervention',
    paras: [],
    nextState: '',
    rollState: ''
  },
  transIgnored: {
    action: '',
    paras: [],
    nextState: '',
    rollState: ''
  }
};

module.exports = class stateAction {
  constructor(record, logger, db) {
    this.record = record;
    this.hashX = record.hashX;
    this.state = record.status;
    this.crossDirection = record.crossDirection;
    this.logger = logger;
    this.db = db;
    this.modelOps = new ModelOps(logger, db);
  }

  updateRecord(content) {
    this.modelOps.saveScannedEvent(this.hashX, content);
  }

  updateState(state) {
    logger.debug("********************************** updateRecord ********************************** hashX:", this.hashX, "status:", status);
    let content = {
      status: state,
    };
    this.updateRecord(content);
  }

  takeAction() {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.checkHashTimeout) {
          let action = stateDict[this.state].action;
          let paras = stateDict[this.state].paras;
          paras.concat([stateDict[this.state].nextState, stateDict[this.state].rollState]);
          await eval(`action` + "(" + `...para` + ")");
          resolve();
        }
      } catch (err) {
        this.logger.error("There is takeAction error", err);
        reject(err);
      }
    })

  }

  takeIntervention() {
    let receive;
    try {
      let mailPro = sendMail(receive, this.record.status, this.record);
      mailPro.then((result) => {
        this.logger.error("send mail successfully, receive:%s subject:%s content:%s\n",
          receive,
          this.record.status,
          this.record);
      }, (err) => {
        this.logger.error("send mail failed, receive:%s subject:%s content:%s\n error: %s",
          receive,
          this.record.status,
          this.record,
          err);
      })
    } catch (err) {
      this.logger.error("send mail failed, receive:%s subject:%s content:%s\n error: %s",
        receive,
        this.record.status,
        this.record,
        err);
    }
  }

  async sendTrans(action, nextState, rollState) {
    let newAgent = new erc20CrossAgent(global.crossToken, this.crossDirection, action, this.record, this.logger);
    console.log("********************************** sendTrans begin ********************************** hashX:", record.hashX, "action:", action);
    let result = {};
    try {
      result = await newAgent.createTrans(action);
      console.log("********************************** sendTrans done ********************************** hashX:", record.hashX, "action:", action);
      monitorLogger.debug("sendTrans result is ", result);
      result.status = nextState;
    } catch (err) {
      monitorLogger.error("sendTransaction faild, action:", action, ", and record.hashX:", record.hashX);
      monitorLogger.error("err is", err);
      result.status = rollState;
    }
    this.updateRecord(result);
  }

  checkHashTimeout() {
    let record = this.record;
    let state = this.state;
    if (state == "waitingRevoke" ||
      state == "waitingCrossRevokeConfirming" ||
      state == "revokeFailed" ||
      state == "refundFailed") {
      return false;
    }

    try {
      let HTLCtime = Number(record.HTLCtime);
      let suspendTime = Number(record.suspendTime);
      let timestamp = Number(record.timestamp);

      let HTLCtimeDate = new Date(HTLCtime).toString();
      let suspendTimeDate = new Date(suspendTime).toString();
      let timestampDate = new Date(timestamp).toString();
      let nowData = new Date().toString();

      if (suspendTime <= Date.now()) {
        console.log("********************************** checkHashTimeout ********************************** hashX", record.hashX, "timestampDate:", timestampDate, "suspendTimeDate:", suspendTimeDate, "HTLCtimeDate:", HTLCtimeDate, "nowData:", nowData);
        if (record.storemanRevokeEvent.length !== 0) {
          this.updateState('revokeFinished');
        } else if (record.storemanRefundEvent.length !== 0) {
          this.updateState('refundFinished');
        } else if (record.storemanLockEvent.length === 0) {
          this.updateState('transIgnored');
        } else {
          this.updateState('waitingRevoke');
        }
        return true;
      }
    } catch (err) {
      console.log("checkHashTimeout:", err);
    }
    return false;
  }

  checkAllowance(nextState, rollState) {
    let newAgent = new erc20CrossAgent(global.crossToken, 1);
    let chain = global.ethChain;
    chain.getTokenAllowance(newAgent.tokenAddr, global.storemanEth, newAgent.contractAddr, (err, result) => {
      if (err === null) {
        if (result < tokenAllowance) {
          updateState(rollState);
        } else {
          updateState(nextState);
        }
      } else {
        updateState('checkApprove');
      }
    })
  }

  async checkStoremanTransOnline(eventName, transHashName, nextState, rollState) {
    try {
      console.log("********************************** checkStoremanTransOnline checkEvent**********************************", eventName, this.record.hashX);
      if (eventName !== null) {
        let event = this.record[eventName];
        if (event.length !== 0) {
          updateState(nextState);
          return;
        }
      }

      let receipt;
      let transOnChain;

      if (this.record.crossDirection === 0) {
        if (eventName === 'storemanRefundEvent') {
          transOnChain = 'eth';
        } else {
          transOnChain = 'wan';
        }
      } else {
        if (action === 'storemanRefundEvent') {
          transOnChain = 'wan';
        } else {
          transOnChain = 'eth';
        }
      }

      let chain = (transOnChain === 'wan') ? global.wanChain : global.ethChain;
      let txHash = this.record[transHashName];
      console.log("********************************** checkStoremanTransOnline checkHash**********************************", this.record.hashX, transHashName, txHash);
      receipt = await chain.getTransactionConfirmSync(txHash, CONFIRM_BLOCK_NUM);
      if (receipt !== null) {
        let status = (receipt.status !== '0x1') ? rollState : nextState;
        updateState(status);
      }
    } catch (err) {
      monitorLogger.error("checkStoremanTransOnline:", err);
    }
  }

  async checkWalletEventOnline(eventName, nextState) {
    try {
      console.log("********************************** checkWalletEventOnline **********************************", eventName, this.record.hashX);
      let event = this.record[eventName];
      if (event.length !== 0) {
        updateState(nextState);
        return;
      }
    } catch (err) {
      this.logger.error("checkWalletEventOnline:", this.record.hashX, eventName, err);
    }
  }
}
"use strict";

const ModelOps = require('db/modelOps');
const Logger = require('comm/logger.js');
const erc20CrossAgent = require('agent/Erc20CrossAgent.js');
const sendMail = require('comm/sendMail');
const config = require('conf/config');

const retryTime = 0;
const CONFIRM_BLOCK_NUM = 2;
const tokenAllowance = 2; /* unit ether*/

function getWeiFromEther(ether) {
    return ether * 1000 * 1000 * 1000 * 1000 * 1000 * 1000;
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
    nextState: 'approveFinished',
    rollState: 'approveZero'
  },
  approveZero: {
    action: 'sendTrans',
    paras: ['approveZero', null],
    nextState: 'waitingApproveZeroConfirming',
    rollState: 'approveFailed'    
  },
  waitingApproveZeroConfirming: {
    action: 'checkStoremanTransOnline',
    paras: [null, 'storemanApproveTxHash'],
    nextState: 'waitingApprove',
    rollState: 'approveFailed'
  },
  waitingApprove: {
    action: 'sendTrans',
    paras: ['approve', null],
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
    // action: 'sendTrans',
    // paras: ['approve', null],
    // nextState: 'waitingCrossApproveConfirming',
    // rollState: 'waitingIntervention'
    action: 'checkAllowance',
    paras: [],
    nextState: 'approveFinished',
    rollState: 'waitingIntervention'
  },
  approveFinished: {
    action: 'sendTrans',
    paras: ['lock', 'storemanLockEvent'],
    nextState: 'waitingCrossLockConfirming',
    rollState: 'lockFailed'
  },
  waitingCross: {
    action: 'sendTrans',
    paras: ['lock', 'storemanLockEvent'],
    nextState: 'waitingCrossLockConfirming',
    rollState: 'lockFailed'
  },
  waitingCrossLockConfirming: {
    action: 'checkStoremanTransOnline',
    paras: ['storemanLockEvent', 'storemanLockTxHash'],
    nextState: 'waitingX',
    // rollState: 'lockFailed'
    rollState: 'waitingIntervention'
  },
  lockFailed: {
    action: 'sendTrans',
    paras: ['lock', 'storemanLockEvent'],
    nextState: 'waitingCrossLockConfirming',
    // rollState: 'waitingIntervention'
    rollState: 'lockFailed'
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
    nextState: 'waitingCrossRefundConfirming',
    rollState: 'refundFailed'
    // rollState: 'waitingIntervention'
  },
  waitingCrossRefundConfirming: {
    action: 'checkStoremanTransOnline',
    paras: ['storemanRefundEvent', 'storemanRefundTxHash'],
    nextState: 'refundFinished',
    // rollState: 'refundFailed'
    rollState: 'waitingIntervention'
  },
  refundFailed: {
    action: 'sendTrans',
    paras: ['refund', 'storemanRefundEvent'],
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
    paras: ['revoke', 'storemanRevokeEvent'],
    nextState: 'waitingCrossRevokeConfirming',
    rollState: 'revokeFailed'
  },
  waitingCrossRevokeConfirming: {
    action: 'checkStoremanTransOnline',
    paras: ['storemanRevokeEvent', 'storemanRevokeTxHash'],
    nextState: 'revokeFinished',
    // rollState: 'revokeFailed'
    rollState: 'waitingIntervention'
  },
  revokeFailed: {
    action: 'sendTrans',
    paras: ['revoke', 'storemanRevokeEvent'],
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
    // action: 'takeIntervention',
    // paras: [],
    // nextState: 'interventionPending',
    // rollState: 'waitingIntervention'
  },
  transIgnored: {
    action: 'takeIntervention',
    paras: [],
    nextState: 'interventionPending',
    rollState: ''
  },
  interventionPending: {
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
        let status = (this.record.direction === 0) ? nextState : rollState;
        this.updateState(status);
  	}
  }

  takeIntervention(nextState, rollState) {
    let receive = "zhanli@wanchain.org";
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

  async sendTrans(action, eventName, nextState, rollState) {
  	console.log(this.record);

	if (eventName !== null) {
		let event = this.record[eventName];
		if (event.length !== 0) {
		  this.updateState(nextState);
		  return;
		}
	}

    let newAgent = new erc20CrossAgent(global.crossToken, this.crossDirection, action, this.record, this.logger);
    console.log("********************************** sendTrans begin ********************************** hashX:", this.hashX, "action:", action);
    let result = {};
    try {
      newAgent.createTrans(action);
      if (config.isLeader) {
        result = await newAgent.sendTransSync();
        console.log("********************************** sendTrans done ********************************** hashX:", this.hashX, "action:", action);
        monitorLogger.debug("sendTrans result is ", result);
        result.status = nextState;
      } else {
        await newAgent.validateTrans();
        result.status = nextState;
      }

    } catch (err) {
      monitorLogger.error("sendTransaction faild, action:", action, ", and record.hashX:", this.hashX);
      monitorLogger.error("err is", err);
      result.status = rollState;
      console.log(result);
    }
    this.updateRecord(result);
  }

  checkHashTimeout() {
    let record = this.record;
    let state = this.state;
    this.logger.debug("********************************** checkHashTimeout ********************************** hashX:", this.hashX, record.status);

    if (state === "waitingRevoke" ||
      state === "waitingCrossRevokeConfirming" ||
      state === "revokeFailed" ) {
		if (record.walletRefundEvent.length !== 0) {
          this.updateState('waitingIntervention');
          return true;
        } else {
          return false;
        }
    }

    if (state === "waitingIntervention") {
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
        console.log("********************************** checkHashTimeout ********************************** hashX", this.hashX, "timestampDate:", timestampDate, "HTLCtimeDate:", HTLCtimeDate, "nowData:", nowData);
        if (record.storemanRevokeEvent.length !== 0) {
          this.updateState('revokeFinished');
        } else if (record.storemanRefundEvent.length !== 0) {
          this.updateState('refundFinished');
        } else if (record.storemanLockEvent.length === 0) {
          this.updateState('transIgnored');
        } else if (record.walletRefundEvent.length !== 0) {
          this.updateState('waitingIntervention');
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

  async checkAllowance(nextState, rollState) {
    let newAgent = new erc20CrossAgent(global.crossToken, 1);
    // let newAgent = new erc20CrossAgent(global.crossToken, this.crossDirection, 'approve', this.record, this.logger);
    let chain = global.ethChain;
    await chain.getTokenAllowance(newAgent.tokenAddr, global.storemanEth, newAgent.contractAddr, config.erc20Abi)
      .then((result) => {
        if (result < getWeiFromEther(tokenAllowance)) {
          this.updateState(rollState);
        } else {
          this.updateState(nextState);
        }
      }).catch(err => {
        this.updateState('checkApprove');
      })
  }


  async checkStoremanTransOnline(eventName, transHashName, nextState, rollState) {
    try {
      console.log("********************************** checkStoremanTransOnline checkEvent**********************************", eventName, this.hashX);
      if (eventName !== null) {
        let event = this.record[eventName];
        if (event.length !== 0) {
          this.updateState(nextState);
          return;
        }
      }

      if(!config.isLeader) {
        return;
      }

      let receipt;
      let transOnChain;

      if (this.record.direction === 0) {
        if (eventName === 'storemanRefundEvent') {
          transOnChain = 'eth';
        } else {
          transOnChain = 'wan';
        }
      } else {
        if (eventName === 'storemanRefundEvent') {
          transOnChain = 'wan';
        } else {
          transOnChain = 'eth';
        }
      }

      let chain = (transOnChain === 'wan') ? global.wanChain : global.ethChain;
      let txHash = this.record[transHashName];
      console.log("********************************** checkStoremanTransOnline checkHash**********************************", this.hashX, transHashName, txHash);
      receipt = await chain.getTransactionConfirmSync(txHash, CONFIRM_BLOCK_NUM);
      if (receipt !== null) {
        let status = (receipt.status !== '0x1') ? rollState : nextState;
        this.updateState(status);
      }
    } catch (err) {
      monitorLogger.error("checkStoremanTransOnline:", err);
    }
  }

  async checkWalletEventOnline(eventName, nextState) {
    try {
      console.log("********************************** checkWalletEventOnline **********************************", eventName, this.hashX);
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
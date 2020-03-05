"use strict";
const StateAction = require("monitor/stateAction.js");

/* action: [functionName, paras, nextState, rollState] */
var stateDict = {
  // ********************************************************************************************** //
  // for debt, the quit storemanGroup need to act like the wallet
  // ********************************************************************************************** //
  init: {
    action: 'checkAllowance',
    paras: ['waitingDebtLock', 'waitingDebtApproveLock']
  },
  waitingDebtApproveLock: {
    action: 'sendTrans',
    paras: [
      ['approveZero', 'approve', 'lock'], 'walletLockEvent', ['waitingDebtLockConfirming', 'readyX'],
      ['waitingDebtApproveLock', 'transFailed']
    ]
  },
  waitingDebtLock: {
    action: 'sendTrans',
    paras: ['lock', 'walletLockEvent', ['waitingDebtLockConfirming', 'readyX'],
      ['waitingDebtLock', 'transFailed']
    ]
  },
  waitingDebtLockConfirming: {
    action: 'checkTransOnline',
    paras: ['walletLockEvent', 'walletLockTxHash', 'readyX', ['init', 'transFailed']]
  },
  readyX: {
    action: 'checkEventOnline',
    paras: ['storemanLockEvent', 'releaseX']
  },
  suspending: {
  },
  releaseX: {
    action: 'sendTrans',
    paras: ['redeem', 'walletRedeemEvent', ['waitingDebtRedeemConfirming', 'redeemFinished'],
      ['releaseX', 'transFailed']
    ]
  },
  waitingDebtRedeemConfirming: {
    action: 'checkTransOnline',
    paras: ['walletRedeemEvent', 'walletRedeemTxHash', 'redeemFinished', ['releaseX', 'transFailed']]
  },
  redeemFinished: {},
  waitingDebtRevoke: {
    action: 'sendTrans',
    paras: ['revoke', 'walletRevokeEvent', ['waitingDebtRevokeConfirming', 'revokeFinished'],
      ['waitingDebtRevoke', 'transFailed']
    ]
  },
  waitingDebtRevokeConfirming: {
    action: 'checkTransOnline',
    paras: ['walletRevokeEvent', 'walletRevokeTxHash', 'revokeFinished', ['waitingDebtRevoke', 'transFailed']]
  },
  revokeFinished: {},

  // exception handling
  waitingIntervention: {
  },
  transFailed: {
    action: 'takeIntervention',
    paras: ['waitingIntervention', 'transFailed']
  },
  transIgnored: {},
  fundLosted: {
    action: 'takeIntervention',
    paras: ['fundLostFinished', 'fundLosted']
  },
  interventionPending: {
    // action: 'checkAllowance',
    // paras: ['waitingDebtLock', 'waitingDebtApproveLock']
  },
  fundLostFinished: {}
};


module.exports = class Debt extends StateAction{
  constructor(record, logger, db) {
    super(record, logger, db);
    
    this.stateDict = stateDict;

    this.logger.debug("********************************** Debt StateAction ********************************** hashX:", this.hashX, "status:", this.state);
  }

  getActionChainType(action) {
    return ((this.crossDirection === 0) ^ (action === 'redeem')) ? this.record.crossChain : 'WAN';
  }

  getTransChainType(transHashName) {
    if (this.crossDirection === 0) {
      if (transHashName === 'walletRedeemTxHash') {
        return 'WAN';
      } else {
        return this.crossChain;
      }
    } else {
      // 'Debt trans crossDirection should be 0!';
      return null;
    }
  }

  async checkHashTimeout() {
    let record = this.record;
    let state = this.state;
    this.logger.debug("********************************** checkHashTimeout ********************************** hashX:", this.hashX, record.status);

    if (this.record.walletLockEvent.length === 0) {
      return false;
    }

    if (state === "interventionPending" || state === "fundLosted" || state === "transFailed") {
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
      // let suspendTime = Number(record.suspendTime);
      let timestamp = Number(record.timestamp);

      let HTLCtimeDate = new Date(HTLCtime).toString();
      let HTLC2timeDate = new Date(HTLC2time).toString();
      // let suspendTimeDate = new Date(suspendTime).toString();
      let timestampDate = new Date(timestamp).toString();
      let nowData = new Date().toString();

      if (HTLCtime <= Date.now()) {
        this.logger.debug("********************************** checkHashTimeout ********************************** hashX", this.hashX, "timestampDate:", timestampDate, "HTLCtimeDate:", HTLCtimeDate, "nowData:", nowData);
        if (record.walletRedeemEvent.length !== 0) {
          await this.updateState('redeemFinished');
        } else {
          if (HTLC2time <= Date.now()) {
            if (state === "waitingDebtRevoke" ||
              state === "waitingDebtRevokeConfirming") {
              return false;
            }
            this.logger.debug("********************************** checkHashTimeout ********************************** hashX", this.hashX, "timestampDate:", timestampDate, "HTLC2timeDate:", HTLC2timeDate, "nowData:", nowData);
            if (record.walletRevokeEvent.length !== 0) {
              await this.updateState('revokeFinished');
            } else if (record.storemanRedeemEvent.length !== 0 && record.walletRevokeEvent.length === 0) {
              await this.updateState("fundLosted");
            } else {
              await this.updateState('waitingDebtRevoke');
            }
          } else if (state !== 'suspending') {
            await this.updateState('suspending');
          }
        }
        return false;
      }
    } catch (err) {
      this.logger.error("checkHashTimeout:", err);
    }
    return false;
  }
}

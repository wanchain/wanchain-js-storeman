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
    paras: ['storemanLockEvent', 'readyX', 'releaseX']
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

    this.logger.debug("********************************** follower ********************************** hashX:", this.hashX, "status:", this.state);
  }

}

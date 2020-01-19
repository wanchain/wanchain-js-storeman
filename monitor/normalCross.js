"use strict";
const StateAction = require("monitor/stateAction.js");

/* action: [functionName, paras, nextState, rollState] */
var stateDict = {
  // init: {
  //   action: 'initState',
  //   paras: ['waitingCross', 'checkApprove']
  // },
  // ********************************************************************************************** //
  // normal cross logic
  // ********************************************************************************************** //
  init: {
    action: 'checkAllowance',
    paras: ['waitingCross', 'waitingApproveLock']
  },
  waitingApproveLock: {
    action: 'sendTrans',
    paras: [
      ['approveZero', 'approve', 'lock'], 'storemanLockEvent', ['waitingCrossLockConfirming', 'waitingX'],
      ['waitingApproveLock', 'transFailed']
    ]
  },
  waitingCross: {
    action: 'sendTrans',
    paras: ['lock', 'storemanLockEvent', ['waitingCrossLockConfirming', 'waitingX'],
      ['waitingCross', 'transFailed']
    ]
  },
  waitingCrossLockConfirming: {
    action: 'checkTransOnline',
    paras: ['storemanLockEvent', 'storemanLockTxHash', 'waitingX', ['init', 'transFailed']]
  },
  waitingX: {
    action: 'checkEventOnline',
    paras: ['walletRedeemEvent', 'receivedX', 'waitingX']
  },
  receivedX: {
    action: 'sendTrans',
    paras: ['redeem', 'storemanRedeemEvent', ['waitingCrossRedeemConfirming', 'redeemFinished'],
      ['receivedX', 'transFailed']
    ]
  },
  waitingCrossRedeemConfirming: {
    action: 'checkTransOnline',
    paras: ['storemanRedeemEvent', 'storemanRedeemTxHash', 'redeemFinished', ['receivedX', 'transFailed']]
  },
  redeemFinished: {},
  waitingRevoke: {
    action: 'sendTrans',
    paras: ['revoke', 'storemanRevokeEvent', ['waitingCrossRevokeConfirming', 'revokeFinished'],
      ['waitingRevoke', 'transFailed']
    ]
  },
  waitingCrossRevokeConfirming: {
    action: 'checkTransOnline',
    paras: ['storemanRevokeEvent', 'storemanRevokeTxHash', 'revokeFinished', ['waitingRevoke', 'transFailed']]
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
    action: 'checkAllowance',
    paras: ['waitingCross', 'waitingApproveLock']
  },
  fundLostFinished: {}
};


module.exports = class NormalCross extends StateAction{
  constructor(record, logger, db) {
    super(record, logger, db);

    this.stateDict = stateDict;

    this.logger.debug("********************************** NormalCross ********************************** hashX:", this.hashX, "status:", this.state);
  }

  getTransChainType() {
    return ((this.crossDirection === 0) ^ (action === 'redeem')) ? 'WAN' : this.record.crossChain;
  }

}
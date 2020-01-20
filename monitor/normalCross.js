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
    paras: ['walletRedeemEvent', 'receivedX']
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

    this.logger.debug("********************************** NormalCross StateAction ********************************** hashX:", this.hashX, "status:", this.state);
  }

  getActionChainType(action) {
    return ((this.crossDirection === 0) ^ (action === 'redeem')) ? 'WAN' : this.record.crossChain;
  }

  getTransChainType(transHashName) {
    return ((this.crossDirection === 0) ^ (transHashName === 'storemanRedeemTxHash')) ? 'WAN' : this.record.crossChain;
  }

  async checkHashTimeout() {
    let record = this.record;
    let state = this.state;
    this.logger.debug("********************************** checkHashTimeout ********************************** hashX:", this.hashX, record.status);

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
      let suspendTime = Number(record.suspendTime);
      let timestamp = Number(record.timestamp);

      let HTLCtimeDate = new Date(HTLCtime).toString();
      let HTLC2timeDate = new Date(HTLC2time).toString();
      let suspendTimeDate = new Date(suspendTime).toString();
      let timestampDate = new Date(timestamp).toString();
      let nowData = new Date().toString();

      console.log("aaron debug here checkhashtimeout,", "HTLCtime:", HTLCtime, "HTLC2time:", timestamp, "nowData:", Date.now())
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
            // await this.updateState("waitingRevoke");
            await this.updateState("fundLosted");
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
}
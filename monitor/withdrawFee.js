"use strict";
const StateAction = require("monitor/stateAction.js");

/* action: [functionName, paras, nextState, rollState] */
var stateDict = {

  // ********************************************************************************************** //
  // for withdrawFee, the storemanGroup need to withdraw fee in cycles
  // ********************************************************************************************** //
  init: {
    action: 'checkFee',
    paras: ['withdrawFee', 'transIgnored']
  },
  withdrawFee: {
    action: 'sendTrans',
    paras: ['withdrawFee', 'withdrawFeeEvent', ['waitingWithdrawFeeConfirming', 'withdrawFeeFinished'],
      ['withdrawFee', 'transFailed']
    ]
  },
  waitingWithdrawFeeConfirming: {
    action: 'checkTransOnline',
    paras: ['withdrawFeeEvent', 'withdrawFeeTxHash', 'withdrawFeeFinished', ['init', 'transFailed']]
  },
  withdrawFeeFinished: {},

  // exception handling
  transFailed: {
    action: 'takeIntervention',
    paras: ['waitingIntervention', 'transFailed']
  },
  waitingIntervention: {
  },
  transIgnored: {},

  interventionPending: {
    action: 'checkFee',
    paras: ['withdrawFee', 'transIgnored']
  }
};


module.exports = class WithdrawFee extends StateAction{
  constructor(record, logger, db) {
    super(record, logger, db);
    
    this.stateDict = stateDict;

    this.logger.debug("********************************** WithdrawFee ********************************** hashX:", this.hashX, "status:", this.state);
  }

  checkHashTimeout() {
    return false;
  }

  async checkFee(nextState, rollState) {
    if(!moduleConfig.crossInfoDict[this.crossChain].CONF.schnorrMpc) {
      await this.updateState(rollState);
      return;
    }

    if (this.recode.originChain === 'EOS' && !this.tokenAddr) {
      await this.updateState(nextState);
      return;
    }

    let chain = getGlobalChain(this.recode.originChain);
    let storemanGroupAddr = global.config.crossTokens[this.crossChain].CONF.storemanPk;
    // let tokenOrigAddr = encodeAccount(this.crossChain, this.record.tokenAddr);
    
    await chain.getTokenStoremanFee(this.crossChain, this.tokenType, this.record.tokenAddr, storemanGroupAddr)
      .then(async (result) => {
        if (result === 0) {
          await this.updateState(rollState);
        } else {
          await this.updateState(nextState);
        }
      }).catch(async (err) => {
        this.logger.error("checkFee:", err);
        // await this.updateState(rollState);
      })
  }
}

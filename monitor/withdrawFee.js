"use strict";
const StateAction = require("monitor/stateAction.js");
const moduleConfig = require('conf/moduleConfig.js');
const {
  getGlobalChain,
  hexTrip0x
} = require('comm/lib');

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
    paras: ['transIgnored', 'transFailed']
  },
  waitingIntervention: {
  },
  transIgnored: {},
  interventionPending: {
    // action: 'checkFee',
    // paras: ['withdrawFee', 'transIgnored']
  }
};


module.exports = class WithdrawFee extends StateAction{
  constructor(record, logger, db) {
    super(record, logger, db);
    
    this.stateDict = stateDict;

    this.logger.debug("********************************** WithdrawFee StateAction ********************************** hashX:", this.hashX, "on chain", this.record.originChain, "status:", this.state);
  }

  getActionChainType(action) {
    return this.record.originChain;
  }

  getTransChainType(transHashName) {
    return this.record.originChain;
  }

  checkHashTimeout() {
    return false;
  }

  async checkFee(nextState, rollState) {
    this.logger.debug("********************************** WithdrawFee checkFee ********************************** hashX:", this.hashX, "on chain", this.record.originChain);
    if(!moduleConfig.crossInfoDict[this.crossChain].CONF.schnorrMpc) {
      await this.updateState(rollState);
      return;
    }

    if (this.record.originChain === 'EOS' && !this.record.tokenAddr) {
      await this.updateState(nextState);
      return;
    }

    let chain = getGlobalChain(this.record.originChain);
    let storemanGroupAddr = global.config.crossTokens[this.crossChain].CONF.storemanPk;
    // let tokenOrigAddr = encodeAccount(this.crossChain, this.record.tokenAddr);

    if (this.record.originChain === 'EOS') {
      storemanGroupAddr = hexTrip0x(storemanGroupAddr);
    }
    
    await chain.getTokenStoremanFee(this.crossChain, this.tokenType, this.record.tokenAddr, storemanGroupAddr)
      .then(async (result) => {
        this.logger.debug("********************************** WithdrawFee checkFee ********************************** hashX:", this.hashX, "on chain", this.record.originChain, "result is", result.toString(10));
        if (result.toString(10) === '0') {
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

"use strict";
const {
  encodeAccount,
  loadConfig,
  getGlobalChain,
  sleep
} = require('comm/lib');

const ModelOps = require('db/modelOps');
// const Logger = require('comm/logger.js');
const sendMail = require('comm/sendMail');

const fs = require('fs');
const path = require("path");
const moduleConfig = require('conf/moduleConfig.js');

const retryTimes = moduleConfig.retryTimes;
const retryWaitTime = moduleConfig.retryWaitTime;
const confirmTimes = moduleConfig.confirmTimes;

const Web3 = require("web3");
const web3 = new Web3();

function getWeiFromEther(ether) {
  return web3.toWei(ether, 'ether');
}

let actionMap = {
  storemanLockEvent: 'lock',
  storemanRedeemEvent: 'redeem',
  storemanRevokeEvent: 'revoke',
  walletLockEvent: 'lock',
  walletRedeemEvent: 'redeem',
  walletRevokeEvent: 'revoke',
  withdrawFeeEvent: 'withdrawFee'
}

module.exports = class StateAction {
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
    if (content.hasOwnProperty('status')) {
      this.state = content.status;
      // need to release the nonce from usedNonce to pendingNonce, for fail status
      if (this.state === 'transIgnored') {
        this.addPendingNonce('lock');
      } else if (this.state === 'fundLosted') {
        this.addPendingNonce('redeem');
      }
    }
    this.logger.info("********************************** updateRecord ********************************** hashX:", this.hashX, "content:", content);
    await this.modelOps.syncSave(this.hashX, content);
  }

  async updateState(state) {
    this.logger.info("********************************** updateState ********************************** hashX:", this.hashX, "status:", state);
    let content = {
      status: state,
    };
    // this.state = state;
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
        if (self.record.isDebt && !moduleConfig.crossInfoDict[self.crossChain].CONF.debtOptEnable) {
          resolve();
          return;
        }
        if (!await self.checkHashTimeout()) {
          if (this.stateDict[self.state].hasOwnProperty('action')) {
            let action = this.stateDict[self.state].action;
            if (typeof(self[action]) === "function") {
              let paras = this.stateDict[self.state].paras;
              self.logger.info("********************************** takeAction ********************************** hashX:", self.hashX, action, paras)
              await self[action](...paras);
            }
          }
          // resolve();
        }
        resolve();
      } catch (err) {
        self.logger.error("There is takeAction error", err, this.hashX);
        reject(err);
      }
    })
  }

  // async initState(nextState, rollState) {
  //   let status;
  //   if (this.record.walletLockEvent.length !== 0) {
  //     if(this.record.tokenType === 'COIN' || this.record.crossChain === 'EOS') {
  //       status = nextState;
  //     } else {
  //       status = (this.crossDirection === 0) ? nextState : rollState;
  //     }
  //   }
  //   await this.updateState(status);
  // }

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

    let issueCollection = global.config.issueCollectionPath + 'issueCollection' + year + '-' + month + '-' + day + '.txt';
    let content = JSON.stringify(this.record) + '\n';
    if (mkdirsSync(global.config.issueCollectionPath)) {
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
    let receive = global.config.mailReceiver;
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
    this.logger.debug("sendTrans", this.record);

    if (eventName !== null) {
      let event = this.record[eventName];
      if (event.length !== 0) {
        let content = {
          status: nextState[1],
          transConfirmed: 0
        }
        this.addPendingNonce(actionMap[eventName]);
        await this.updateRecord(content);
        return;
      }
    }

    if (!Array.isArray(actionArray)) {
      // schnorr-mpc, follow storeman agent don't need do revoke action
      if ((['redeem', 'revoke'].indexOf(actionArray) !== -1) && !global.isLeader && moduleConfig.crossInfoDict[this.crossChain].CONF.schnorrMpc && moduleConfig.mpcSignature) {
        let content = {
          status: nextState[0],
          transConfirmed: 0
        }
        await this.updateRecord(content);
        return;
      }


      if ((['redeem', 'revoke'].indexOf(actionArray) === -1) && (this.crossDirection === 0)) {
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
        let actionOnChain = this.getActionChainType(action);
        let newAgent = new global.agentDict[actionOnChain](this.crossChain, this.tokenType, this.record);
        this.logger.info("********************************** sendTrans begin ********************************** hashX:", this.hashX, "action:", action);
        await newAgent.initAgentTransInfo(action);

        await newAgent.createTrans(action);

        if (!global.isLeader && moduleConfig.mpcSignature && !moduleConfig.crossInfoDict[this.crossChain].CONF.schnorrMpc) {
          await newAgent.validateTrans();
        } else {
          if (global.isLeader) {
            let content = await newAgent.sendTransSync();
            this.logger.debug("sendTrans result is ", content);
            Object.assign(result, content);
          }
        }
        this.logger.info("********************************** sendTrans done ********************************** hashX:", this.hashX, "action:", action);

        // schnorr-mpc, follow storeman agent only need to approve withdrawFee action
        if (this.record.isFee && !global.isLeader) {
          let content = {
            status: nextState[1],
            transRetried: 0,
            transConfirmed: 0
          }
          await this.updateRecord(content);
          return;
        }
      }
      result.transRetried = 0;
      result.status = nextState[0];
    } catch (err) {
      let action = actionMap[eventName];
      this.logger.error("sendTransaction faild, action:", action, ", and record.hashX:", this.hashX, ", will retry, this record already transRetried:", this.record.transRetried, ", max retryTimes:", retryTimes);
      this.logger.error("sendTransaction faild,  err is", err, this.hashX);
      if (this.record.transRetried < retryTimes) {
        result.transRetried = this.record.transRetried + 1;
        result.status = rollState[0];
      } else {
        this.addPendingNonce(action);

        result.transRetried = 0;
        result.status = rollState[1];
        await this.updateFailReason(action, err);
      }
      this.logger.error("sendTransaction faild, action:", action, result, this.hashX);
    }

    await this.updateRecord(result);
  }

  async checkAllowance(nextState, rollState) {
    // only ERC20 outsmglock and Erc20 indebtlock need to do approve
    if(this.record.tokenType === 'COIN' || this.record.crossChain === 'EOS' || this.crossDirection === 0) {
      await this.updateState(nextState);
      return;
    } else if (this.record.walletLockEvent.length === 0) {
      return;
    }

    // let chainType;
    // if (!this.record.isDebt) {
    //   chainType = 'WAN';
    // } else {
    //   chainType = this.crossChain;
    // }
    // let newAgent = new global.agentDict[this.crossChain.toUpperCase()](this.crossChain, this.tokenType, this.record);
    let chain = getGlobalChain(this.crossChain);
    // await chain.getTokenAllowance(newAgent.tokenAddr, global.config.storemanOri, newAgent.contractAddr, moduleConfig.tokenAbi)
    await chain.getTokenAllowance(this.record.tokenAddr, global.config.crossTokens[this.crossChain].CONF.storemanOri, moduleConfig.crossInfoDict[this.crossChain][this.tokenType].originalChainHtlcAddr, moduleConfig.tokenAbi)
      .then(async (result) => {
        if (result < Math.max(getWeiFromEther(web3.toBigNumber(moduleConfig.tokenAllowanceThreshold)), web3.toBigNumber(this.record.value))) {
          await this.updateState(rollState);
        } else {
          await this.updateState(nextState);
        }
      }).catch(async (err) => {
        this.logger.error("checkAllowance:", err, this.hashX);
        // await this.updateState('checkApprove');
      })
  }

  async checkTransOnline(eventName, transHashName, nextState, rollState) {
    let content = {};
    let transOnChain;
    let transConfirmed;

    // let blockNumMap = {
    //   storemanLockTxHash: 'storemanLockTxBlockNumber',
    //   storemanRedeemTxHash: 'storemanRedeemTxBlockNumber',
    //   storemanRevokeTxHash: 'storemanRevokeTxBlockNumber',
    //   walletLockTxHash: 'walletLockTxBlockNumber',
    //   walletRedeemTxHash: 'walletRedeemTxBlockNumber',
    //   walletRevokeTxHash: 'walletRevokeTxBlockNumber'
    // }

    transOnChain = this.getTransChainType(transHashName);
    if (transOnChain === null) {
      content = {
        status: rollState[1],
        transConfirmed: 0
      }
      let failReason = "getTransChainType not found!";
      await this.updateFailReason(actionMap[eventName], failReason);
      await this.updateRecord(content);
      return;
    }

    try {
      this.logger.debug("********************************** checkTransOnline checkEvent**********************************", eventName, this.hashX);

      if (eventName !== null) {
        let event = this.record[eventName];
        transConfirmed = this.record.transConfirmed;

        if (event.length !== 0) {
          content = {
            status: nextState,
            transConfirmed: 0,
            transRetried: 0
          }
          this.clearUsedNonce(actionMap[eventName]);

          await this.updateRecord(content);
          return;
        }
        if (this.record.transRetried >= retryTimes) {
          content = {
            status: rollState[1],
            transConfirmed: 0,
            transRetried: 0
          }
          this.addPendingNonce(actionMap[eventName]);
          await this.updateFailReason(actionMap[eventName], "exceed retryTimes");
          await this.updateRecord(content);
          return;
        }
        if (transConfirmed >= confirmTimes && this.record.transRetried < retryTimes) {
          this.logger.warn("checkTransOnline confirm time exceed confirmTimes, will retry, this record already transRetried:", this.record.transRetried, ", max retryTimes:", retryTimes, eventName, this.hashX);

          content = {
            status: rollState[0],
            transConfirmed: 0,
            transRetried: this.record.transRetried + 1
          }

          let storemanAddr;
          if (transOnChain !== 'WAN') {
            storemanAddr = global.config.crossTokens[this.crossChain].CONF.storemanOri;
          } else {
            storemanAddr = global.config.crossTokens[this.crossChain].CONF.storemanWan;
          }
          if (!moduleConfig.crossInfoDict[transOnChain] || !moduleConfig.crossInfoDict[transOnChain].CONF.nonceless)
          {
            global[transOnChain.toLowerCase() + 'NonceRenew'][storemanAddr] = true;
            global.nonce[this.hashX + 'NonceRenew'] = true;
            this.logger.warn("checkTransOnline confirm time exceed confirmTimes, set NonceRenew true", eventName, this.hashX);
          }

          await this.updateRecord(content);
          return;
        }
      }

      // if (!global.isLeader && moduleConfig.mpcSignature) {
      if (!global.isLeader) {
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
        this.logger.debug("********************************** checkTransOnline checkHash**********************************", this.hashX, transHashName, txHash);
        // if (transOnChain === 'EOS' && this.record[blockNumMap[transHashName]]) {
        //   receipt = await chain.getTransactionConfirmSync(txHash, chain.confirm_block_num, this.record[blockNumMap[transHashName]][txHashArray.indexOf(txHash)]);
        // } else {
        //   receipt = await chain.getTransactionConfirmSync(txHash, chain.confirm_block_num);
        // }
        receipt = await chain.getTransactionConfirmSync(txHash, chain.confirm_block_num);
        if (receipt !== null) {
          if (receipt.status === '0x1') {
            content = {
              status: nextState,
              transConfirmed: 0,
              transRetried: 0
            }
            this.clearUsedNonce(actionMap[eventName]);
            break;
          } else {
            if (txHashArray.indexOf(txHash) === (txHashArray.length - 1)) {
              content = {
                status: rollState[1],
                transConfirmed: 0,
                transRetried: 0
              }
              this.clearUsedNonce(actionMap[eventName]);
              let failReason = 'txHash receipt is 0x0! Cannot find ' + eventName;
              await this.updateFailReason(actionMap[eventName], failReason);
            }
          }
        } else {
          if (txHashArray.indexOf(txHash) === (txHashArray.length - 1)) {
            if (this.record.transConfirmed < confirmTimes) {
              content = {
                transConfirmed: transConfirmed + 1
              }
            // } else {
            //   content = {
            //     status: rollState[1],
            //     transConfirmed: 0
            //   }
            //   await this.updateFailReason(actionMap[eventName], "exceed retryTimes");
            }
          }
        }
      }
      await this.updateRecord(content);
    } catch (err) {
      this.logger.error("checkTransOnline:", err, this.hashX);
    }
  }

  async checkEventOnline(eventName, nextState) {
    try {
      this.logger.debug("********************************** checkEventOnline **********************************", eventName, this.hashX);
      let event = this.record[eventName];
      if (event.length !== 0) {
        await this.updateState(nextState);
        return;
      }
    } catch (err) {
      this.logger.error("checkEventOnline:", this.record.hashX, eventName, err);
    }
  }

  async getStoremanQuota() {
    // let storemanGroupAddr = global.config.storemanWan;
    let storemanGroupAddr = moduleConfig.crossInfoDict[this.crossChain].CONF.schnorrMpc ? global.config.crossTokens[this.crossChain].CONF.storemanPk : global.config.crossTokens[this.crossChain].CONF.storemanWan;
    // let storemanGroupAddr = this.record.storeman;
    let storemanQuotaInfo;
    let chain = getGlobalChain('WAN');

    try{
      if(this.tokenType === 'COIN') {
        storemanQuotaInfo = await chain.getStoremanQuota(this.crossChain, this.tokenType, storemanGroupAddr);
      } else {
        storemanQuotaInfo = await chain.getTokenStoremanQuota(this.crossChain, this.tokenType, encodeAccount(this.crossChain, this.record.tokenAddr), storemanGroupAddr);
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

  // clear the used nonce when one trans success/failed
  clearUsedNonce(action) {
    let transOnChain = this.getActionChainType(action);
    if (!moduleConfig.crossInfoDict[transOnChain] || !moduleConfig.crossInfoDict[transOnChain].CONF.nonceless) {
      if (global.nonce[this.hashX + action]) {
        let nonce = global.nonce[this.hashX + action];
        let usedNonce = transOnChain.toLowerCase() + 'UsedNonce';
        let storemanAddr;
        if (transOnChain !== 'WAN') {
          storemanAddr = global.config.crossTokens[this.crossChain].CONF.storemanOri;
        } else {
          storemanAddr = global.config.crossTokens[this.crossChain].CONF.storemanWan;
        }
  
        if (global[usedNonce][storemanAddr].hasOwnProperty(nonce)
        && global[usedNonce][storemanAddr][nonce].hashX === this.hashX
        && global[usedNonce][storemanAddr][nonce].action === action) {
          delete global[usedNonce][storemanAddr][nonce];
        }

        this.logger.debug("clearUsedNonce for getNonce : reset usedNonce pool ", storemanAddr, "to clear the nonce", global.nonce[this.hashX + action], "for hashX: ", this.hashX);

        delete global.nonce[this.hashX + action];
        delete global.nonce[this.hashX + "NoncePending"];
        delete global.nonce[this.hashX + 'NonceRenew'];
      }
    }
  }

  // add the pending nonce when one trans failed times exceed the retry timess
  addPendingNonce(action) {
    let transOnChain = this.getActionChainType(action);
    if (!moduleConfig.crossInfoDict[transOnChain] || !moduleConfig.crossInfoDict[transOnChain].CONF.nonceless) {
      if (global.nonce[this.hashX + action]) {
        let storemanAddr;
        if (transOnChain !== 'WAN') {
          storemanAddr = global.config.crossTokens[this.crossChain].CONF.storemanOri;
        } else {
          storemanAddr = global.config.crossTokens[this.crossChain].CONF.storemanWan;
        }
        this.logger.warn("addPendingNonce for getNonce : reset noncePending pool ", storemanAddr, "to add the nonce", global.nonce[this.hashX + action], "for hashX: ", this.hashX);
        global[transOnChain.toLowerCase() + 'NoncePending'][storemanAddr].add(global.nonce[this.hashX + action]);

        this.logger.debug("addPendingNonce for getNonce : reset usedNonce pool ", storemanAddr, "to clear the nonce", global.nonce[this.hashX + action], "for hashX: ", this.hashX);
        delete global[transOnChain.toLowerCase() + 'UsedNonce'][storemanAddr][global.nonce[this.hashX + action]];

        delete global.nonce[this.hashX + action];
        delete global.nonce[this.hashX + "NoncePending"];
        delete global.nonce[this.hashX + 'NonceRenew'];
      }
    }
  }
}
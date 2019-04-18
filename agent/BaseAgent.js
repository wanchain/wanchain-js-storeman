"use strict"

const moduleConfig = require('conf/moduleConfig.js');
const configJson = require('conf/config.json');
const config = moduleConfig.testnet ? configJson.testnet : configJson.main;

const {
  getGlobalChain,
  sleep
} = require('comm/lib');

module.exports = class BaseAgent {
  constructor(crossChain, tokenType, crossDirection, record = null, action = null) {
    this.logger = global.monitorLogger;
    this.config = config;
    this.isLeader = config.isLeader;

    this.mpcSignature = moduleConfig.mpcSignature;
    this.secureLockIntervalRatio = moduleConfig.secureLockIntervalRatio;

    this.crossChain = crossChain;
    this.crossDirection = crossDirection; /* 0 -- token to Wtoken, 1 -- Wtoken to token */

    let crossInfoInst = moduleConfig.crossInfoDict[crossChain.toUpperCase()][tokenType];
    this.crossInfoInst = crossInfoInst;

    this.transChainType = crossChain.toLowerCase();
    this.chain = getGlobalChain(this.transChainType);
    this.storemanAddress = config.storemanOri;

    this.crossFunc = (this.crossDirection === 0) ? crossInfoInst.depositFunc : crossInfoInst.withdrawFunc;
    this.depositEvent = crossInfoInst.depositEvent;
    this.withdrawEvent = crossInfoInst.withdrawEvent;

    this.record = record;
    if (record !== null) {
      if (record.x !== '0x') {
        this.key = record.x;
      }

      this.hashKey = record.hashX;
      this.amount = record.value;
      this.crossAddress = record.crossAddress;

      this.tokenAddr = record.tokenAddr;
      this.tokenSymbol = record.tokenSymbol;
    }
  }

  getNonce() {
    return new Promise(async (resolve, reject) => {
      this.logger.debug("getNonce begin!")
      while (global.mutexNonce) {
        await sleep(3);
      }
      this.logger.debug("mutexNonce true");
      global.mutexNonce = true;
      let nonce = 0;
      let chainNonce = this.transChainType + 'LastNonce';
      let nonceRenew = this.transChainType + 'NonceRenew';
      let noncePending = this.transChainType + 'NoncePending';
      let storemanAddress = this.storemanAddress;
      console.log("aaron debug here getNonce", storemanAddress);

      try {
        if (global[nonceRenew]) {
          nonce = await this.chain.getNonceSync(storemanAddress);
          nonce = parseInt(nonce, 16);
          global[nonceRenew] = false;
        } else if (global[noncePending]) {
          nonce = await this.chain.getNonceIncludePendingSync(storemanAddress);
          nonce = parseInt(nonce, 16);
          global[noncePending] = false;
        } else {
          nonce = global[chainNonce];
        }

        this.logger.debug("mutexNonce false");
        global.mutexNonce = false;

        if (nonce >= global[chainNonce]) {
          global[chainNonce] = nonce;
          global[chainNonce]++;
        }
        resolve(nonce);
      } catch (err) {
        this.logger.error("getNonce failed", err);
        this.logger.debug("mutexNonce false");
        global.mutexNonce = false;
        reject(err);
      }
    });
  }

  async initAgentTransInfo(action) {
    if (action !== null) {
      let transInfo = await this.getTransInfo(action);
      this.trans = this.RawTrans(...transInfo);
    }
  }

  createTrans(action) { 
    if (action === 'lock') {
      this.data = this.getLockData();
      this.build = this.buildLockData;
    } else if (action === 'redeem') {
      this.data = this.getRedeemData();
      this.build = this.buildRedeemData;
    } else if (action === 'revoke') {
      this.data = this.getRevokeData();
      this.build = this.buildRevokeData;
    }

    this.logger.debug("********************************** setData **********************************", this.data, "hashX", this.hashKey);
    this.trans.setData(this.data);
    this.trans.setValue(0);
  }

  sendTransSync() { 
    return new Promise((resolve, reject) => {
      this.sendTrans((err, result) => {
        if (!err && result !== null) {
          resolve(result);
        } else {
          global[this.transChainType + 'NoncePending'] = true;
          reject(err);
        }
      });
    });
  }

  validateTrans() {
    this.logger.debug("********************************** validateTrans ********************************** hashX", this.hashKey);
    return new Promise(async (resolve, reject) => {
      try {
        let chainId = await this.chain.getNetworkId();
        let mpc = new MPC(this.trans.txParams, this.chain.chainType, chainId, this.hashKey);

        mpc.addValidMpcTx();
        resolve();
      } catch (err) {
        this.logger.error("********************************** validateTrans failed ********************************** hashX", this.hashKey, err);
        reject(err);
      }
    });
  }

  buildLockData(hashKey, result) { 
    this.logger.debug("********************************** insertLockData trans **********************************", hashKey);

    let content = {
      storemanLockTxHash: (Array.isArray(this.record.storemanLockTxHash)) ? [...this.record.storemanLockTxHash] : [this.record.storemanLockTxHash]
    }
    content.storemanLockTxHash.push(result.toLowerCase());
    return content;
  }

  buildRedeemData(hashKey, result) {
    this.logger.debug("********************************** insertRedeemData trans **********************************", hashKey);

    let content = {
      storemanRedeemTxHash: (Array.isArray(this.record.storemanRedeemTxHash)) ? [...this.record.storemanRedeemTxHash] : [this.record.storemanRedeemTxHash]
    }
    content.storemanRedeemTxHash.push(result.toLowerCase());
    return content;
  }

  buildRevokeData(hashKey, result) {
    this.logger.debug("********************************** insertRevokeData trans **********************************", hashKey);

    let content = {
      storemanRevokeTxHash: (Array.isArray(this.record.storemanRevokeTxHash)) ? [...this.record.storemanRevokeTxHash] : [this.record.storemanRevokeTxHash]
    }
    content.storemanRevokeTxHash.push(result.toLowerCase());
    return content;
  }

  getDecodeEventDbData(chainType, crossChain, tokenType, decodeEvent, event, lockedTime) {
    let content = {};
    let args = decodeEvent.args;
    let eventName = decodeEvent.event;

    if (!args.xHash) {
      return null;
    }

    let hashX = args.xHash;
    let storeman;

    console.log("aaron debug event", eventName,chainType, this.crossInfoInst.withdrawAction, this.crossInfoInst.depositAction);
    try {
      if (!((eventName === this.depositEvent[2] && chainType !== 'wan') ||
        (eventName === this.withdrawEvent[2] && chainType === 'wan'))) {
        storeman = this.getDecodeEventStoremanGroup(decodeEvent);

        if([config.storemanOri, config.storemanWan].indexOf(storeman) === -1) {
          return null;
        }
      }
      if ((eventName === this.depositEvent[0] && chainType !== 'wan') ||
        (eventName === this.withdrawEvent[0] && chainType === 'wan')) {
        this.logger.debug("********************************** 1: found new wallet lock transaction ********************************** hashX", hashX);
        let tokenAddr = this.getDecodeEventTokenAddr(decodeEvent);
        content = {
          hashX: hashX,
          direction: (chainType !== 'wan') ? 0 : 1,
          crossChain: crossChain.toLowerCase(),
          tokenType: tokenType,
          tokenAddr: tokenAddr,
          tokenSymbol: config.crossTokens[crossChain][tokenAddr].tokenSymbol,
          originChain: chainType,
          from: (chainType !== 'wan') ? args.user : args.wanAddr,
          crossAddress: (chainType !== 'wan') ? args.wanAddr : args.ethAddr,
          toHtlcAddr: this.getDecodeEventToHtlcAddr(decodeEvent),
          storeman: storeman,
          value: this.getDecodeEventValue(decodeEvent),
          blockNumber: decodeEvent.blockNumber,
          timestamp: decodeEvent.timestamp * 1000,
          lockedTime: lockedTime * 1000,
          suspendTime: (1000 * (lockedTime - lockedTime / moduleConfig.secureLockIntervalRatio) + Number(decodeEvent.timestamp) * 1000).toString(),
          HTLCtime: (1000 * 2 * lockedTime + Number(decodeEvent.timestamp) * 1000).toString(),
          walletLockEvent: event
        };
      } else if ((eventName === this.depositEvent[0] && chainType === 'wan') ||
        (eventName === this.withdrawEvent[0] && chainType !== 'wan')) {
        this.logger.debug("********************************** 2: found storeman lock transaction ********************************** hashX", hashX);
        content = {
          storemanLockEvent: event
        };
      } else if ((eventName === this.depositEvent[1] && chainType === 'wan') ||
        (eventName === this.withdrawEvent[1] && chainType !== 'wan')) {
        this.logger.debug("********************************** 3: found wallet redeem transaction ********************************** hashX", hashX);
        content = {
          x: args.x,
          walletRedeemEvent: event
        };
      } else if ((eventName === this.depositEvent[1] && chainType !== 'wan') ||
        (eventName === this.withdrawEvent[1] && chainType === 'wan')) {
        this.logger.debug("********************************** 4: found storeman redeem transaction ********************************** hashX", hashX);
        content = {
          storemanRedeemEvent: event
        };
      } else if ((eventName === this.depositEvent[2] && chainType !== 'wan') ||
        (eventName === this.withdrawEvent[2] && chainType === 'wan')) {
        this.logger.debug("********************************** 5: found wallet revoke transaction ********************************** hashX", hashX);
        content = {
          walletRevokeEvent: event,
        };
      } else if ((eventName === this.depositEvent[2] && chainType === 'wan') ||
        (eventName === this.withdrawEvent[2] && chainType !== 'wan')) {
        this.logger.debug("********************************** 6: found storeman revoke transaction ********************************** hashX", hashX);
        content = {
          storemanRevokeEvent: event
        };
      }
      return [hashX, content];
    } catch (err) {
      this.logger.error("some wrong happened during getDecodeEventDbData", chainType, crossChain, tokenType, decodeEvent, err);
      return null;
    }    
  }
}
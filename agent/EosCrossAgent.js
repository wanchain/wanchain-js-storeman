"use strict"
const {
    loadConfig,
    getGlobalChain,
    generateKey,
    sha256,
    sleep
} = require('comm/lib');
const {
  getGlobalChain,
  encodeAccount,
  decodeAccount,
  sleep
  //   getChain
} = require('comm/lib');

let Contract = require("contract/Contract.js");
let eosRawTrans = require("trans/EosRawTrans.js");
let wanRawTrans = require("trans/WanRawTrans.js");
let Eos = require("eosjs");

let MPC = require("mpc/mpc.js");

const moduleConfig = require('conf/moduleConfig.js');
const configJson = require('conf/config.json');
const config = global.testnet?configJson.testnet:configJson.main;

const Web3 = require("web3");
const web3 = new Web3();

function eosToFloat(str) 
{ 
  const floatRegex = /[^\d.-]/g
  return parseFloat(str.replace(floatRegex, '')); 
}

function floatToEos(amount, symbol){
  
  let DecimalPad = Eos.modules.format.DecimalPad;
  let precision = 4;
  return `${DecimalPad(amount, precision)} ${symbol}`
}

module.exports = class EosCrossAgent {
  constructor(crossChain, tokenType, crossDirection, record = null, action = null) {
    this.logger = global.monitorLogger;
    this.isLeader = config.isLeader;

    this.crossChain = crossChain;
    this.crossDirection = crossDirection; /* 0 -- token to Wtoken, 1 -- Wtoken to token */
    let crossInfoInst = moduleConfig.crossInfoDict[crossChain.toUpperCase()][tokenType];
    this.crossInfoInst = crossInfoInst;
    this.transChainType = this.getTransChainType(crossDirection, action); /* wan -- trans on wanchain HTLC contract, or, trans on originchain HTLC contract */
    this.chain = getGlobalChain(this.transChainType);

    let abi = (this.transChainType !== 'wan') ? crossInfoInst.originalChainHtlcAbi : crossInfoInst.wanchainHtlcAbi;
    this.contractAddr = (this.transChainType !== 'wan') ? crossInfoInst.originalChainHtlcAddr : crossInfoInst.wanchainHtlcAddr;
    this.contract = new Contract(abi, this.contractAddr);

    this.crossFunc = (this.crossDirection === 0) ? crossInfoInst.depositFunc : crossInfoInst.withdrawFunc;
    this.crossAction = (this.crossDirection === 0) ? crossInfoInst.depositAction : crossInfoInst.withdrawAction;

    this.record = record;
    if (record !== null) {
      if (record.x !== '0x') {
        this.key = record.x;
      }

      this.hashKey = record.hashX;
      // this.amount = web3.toBigNumber(record.value);
      this.amount = record.value;
      this.crossAddress = record.crossAddress;

      this.tokenAddr = record.tokenAddr;
      this.tokenSymbol = record.tokenSymbol;
    }
  }

  getTransChainType(crossDirection, action) {
    if (crossDirection === 0) {
      if (action === 'redeem') {
        return this.crossChain;
      } else {
        return 'wan';
      }
    } else {
      if (action === 'redeem') {
        return 'wan';
      } else {
        return this.crossChain
      }
    }
  }

  async initAgentTransInfo(action) {
    if (action !== null) {
      let transInfo = await this.getTransInfo(action);
      if (this.transChainType === 'wan') {
        this.trans = new wanRawTrans(...transInfo);
      } else {
        this.trans = new eosRawTrans(...transInfo);
      }
    }
  }

  getLockedTime() {
    return new Promise((resolve, reject) => {
      try {
        let getLockedTime = this.chain.getSolVar(this.contract.abi, this.contractAddr, 'lockedTime');

        getLockedTime((err, result) => {
          if (!err) {
            this.logger.debug("getLockedTime successfully");
            resolve(Number(result));
          } else {
            this.logger.error("getLockedTime error:", err);
            reject(err);
          }
        });
      } catch (err) {
        this.logger.error("getLockedTime error:", err);
        reject(err);
      }
    })
  }

  getWeiFromGwei(gwei) {
    return web3.toWei(gwei, 'gwei');
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
      let storemanAddress;
      if (this.transChainType.toLowerCase() === 'wan') {
        storemanAddress = config.storemanWan;
      } else {
        this.logger.debug("mutexNonce false");
        global.mutexNonce = false;
        return;
      }
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

  getTransInfo(action) {
    let from;
    let to;
    let amount;
    let gas;
    let gasPrice;
    let nonce;

    return new Promise(async (resolve, reject) => {
      try {
        if (action === 'redeem') {
          from = (this.crossDirection === 0) ? config.storemanOri : config.storemanWan;
        } else {
          from = (this.crossDirection === 0) ? config.storemanWan : config.storemanOri;
        }

        to = this.contractAddr;

        amount = (this.transChainType === 'wan') ? web3.toBigNumber(eosToFloat(this.amount)) : this.amount;

        if (this.transChainType === 'wan') {
          gas = config.wanGasLimit;
          gasPrice = this.getWeiFromGwei(web3.toBigNumber(config.wanGasPrice));
          nonce = await this.getNonce();
          this.logger.info("transInfo is: crossDirection- %s, transChainType- %s,\n from- %s, to- %s, gas- %s, gasPrice- %s, nonce- %s, amount- %s, \n hashX- %s", this.crossDirection, this.transChainType, from, to, gas, gasPrice, nonce, amount, this.hashKey);
          resolve([from, to, gas, gasPrice, nonce, amount]);
        } else {
          this.logger.info("transInfo is: crossDirection- %s, transChainType- %s,\n from- %s, to- %s, amount- %s, \n hashX- %s", this.crossDirection, this.transChainType, from, to, amount, this.hashKey);
          resolve([from, to, amount]);
        }        
      } catch (err) {
        this.logger.error("getTransInfo failed", err);
        reject(err);
      }
    });  
   }

  getLockData() { 
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[0], "hashX", this.hashKey);
    this.logger.debug('getLockData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'crossAddress-', this.crossAddress, 'Amount-', this.amount);
    if (this.transChainType !== 'wan') {
      let actions = [{
        account: 'htlceos',
        name: this.crossAction[0],
        authorization: [{
          actor: 'htlceos',
          permission: 'active',
        }],
        data: {
          // tokenOrigAddr: 'htlceos',
          // xHash: this.hashKey,
          // user: this.crossAddress,
          // value: this.amount
          storemanGroup: decodeAccount(config.storemanOri),
          xHash: this.hashKey.split('0x')[1],
          user: decodeAccount(this.crossAddress),
          value: this.amount
        }
      }];
      return actions;
    } else {
      return this.contract.constructData(this.crossFunc[0], encodeAccount(this.tokenAddr), this.hashKey, this.crossAddress, web3.toBigNumber(eosToFloat(this.amount)));
    }
  }

  getRedeemData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[1], "hashX", this.hashKey);
    this.logger.debug('getRedeemData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'key-', this.key);
    if (this.transChainType !== 'wan') {
      let actions = [{
        account: 'htlceos',
        name: this.crossAction[1],
        authorization: [{
          actor: 'htlceos',
          permission: 'active',
        }],
        data: {
          storemanGroup: decodeAccount(config.storemanOri),
          xHash: this.hashKey.split('0x')[1],
          user: this.record.from,
          x: this.key.split('0x')[1]
        }
      }];
      return actions; 
    } else {
      return this.contract.constructData(this.crossFunc[1], this.tokenAddr, this.key);
    }
   }

  getRevokeData() { 
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[2], "hashX", this.hashKey);
    this.logger.debug('getRevokeData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey);
    if (this.transChainType !== 'wan') {
      let actions = [{
        account: 'htlceos',
        name: this.crossAction[2],
        authorization: [{
          actor: 'htlceos',
          permission: 'active',
        }],
        data: {
          storemanGroup: decodeAccount(config.storemanOri),
          xHash: this.hashKey.split('0x')[1]
        }
      }];
      return actions; 
    } else {
      return this.contract.constructData(this.crossFunc[2], encodeAccount(this.tokenAddr), this.hashKey);
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

  async sendTrans(callback) {
    this.logger.debug("********************************** sendTransaction ********************************** hashX", this.hashKey);
    let self = this;
    try {
      if (this.transChainType !== 'wan') {
        this.chain.eos.transaction({
          actions: this.trans.actions
        }, {
          // broadcast: true, 
          // sign: true,
          blocksBehind: 3,
          expireSeconds: 30,
        }, (err, result) => {
          if (!err) {
            self.logger.debug("sendRawTransaction result: hashX, result: ", self.hashKey, result);
            self.logger.debug("********************************** sendTransaction success ********************************** hashX", self.hashKey);
            let content = self.build(self.hashKey, result.transaction_id);
            callback(err, content);
          } else {
            self.logger.error("********************************** sendTransaction failed ********************************** hashX", self.hashKey);
            callback(err, result);
          }
        });
      } else {
        let rawTx;
        if(moduleConfig.mpcSignature) {
          let chainId = await this.chain.getNetworkId();
          let mpc = new MPC(this.trans.txParams, this.chain.chainType, chainId, this.hashKey);
          rawTx = await mpc.signViaMpc();
          this.logger.debug("********************************** sendTransaction signViaMpc ********************************** hashX", this.hashKey, rawTx);
        } else {
          // let password = process.env.KEYSTORE_PWD;
          let password = 'wanglutech';
          this.trans.txParams.gasPrice = '0x' + this.trans.txParams.gasPrice.toString(16);
          this.trans.txParams.gasLimit = '0x' + this.trans.txParams.gasLimit.toString(16);
          rawTx = this.trans.signFromKeystore(password);
        }
  
        this.logger.debug(this.trans);
  
        this.chain.sendRawTransaction(rawTx, (err, result) => {
          if (!err) {
            self.logger.debug("sendRawTransaction result: hashX, result: ", self.hashKey, result);
            self.logger.debug("********************************** sendTransaction success ********************************** hashX", self.hashKey);
            let content = self.build(self.hashKey, result);
            callback(err, content);
          } else {
            self.logger.error("********************************** sendTransaction failed ********************************** hashX", self.hashKey);
            callback(err, result);
          }
        });
      }

    } catch (err) {
      this.logger.error("********************************** sendTransaction failed ********************************** hashX", this.hashKey, err);
      callback(err, null);
    }
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

  getDecodeEventTokenAddr(decodeEvent, chainType) {
    return (chainType === 'wan') ? decodeAccount(decodeEvent.args.tokenOrigAddr) : decodeEvent.args.tokenOrigAddr;
  }

  getDecodeEventStoremanGroup(decodeEvent) {
    return decodeEvent.args.storemanGroup;
  }

  getDecodeEventDbData(chainType, crossChain, tokenType, decodeEvent, event, lockedTime) {
    let content = {};
    let args = decodeEvent.args;
    let eventName = decodeEvent.event;

    if (!args.xHash) {
      return null;
    }

    if (chainType !== 'wan') {
      console.log(chainType);
    }

    let hashX = args.xHash;
    let storeman;

    try {
      if (!((eventName === this.crossInfoInst.depositAction[2] && chainType !== 'wan') ||
        (eventName === this.crossInfoInst.withdrawEvent[2] && chainType === 'wan'))) {
        storeman = this.getDecodeEventStoremanGroup(decodeEvent);
        if (chainType !== 'wan') {
          // storeman = encodeAccount(storeman);
          storeman = '0x0c00010373746f72656d616e0000000000000000';
        }
        if([config.storemanOri, config.storemanWan].indexOf(storeman) === -1) {
          return null;
        }
      }
      if ((eventName === this.crossInfoInst.depositAction[0] && chainType !== 'wan') ||
        (eventName === this.crossInfoInst.withdrawEvent[0] && chainType === 'wan')) {
        this.logger.debug("********************************** 1: found new wallet lock transaction ********************************** hashX", hashX);
        let tokenAddr = this.getDecodeEventTokenAddr(decodeEvent, chainType);
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
          toHtlcAddr: (chainType !== 'wan') ? args.toHtlcAddr : decodeEvent.address,
          storeman: storeman,
          value: (chainType !== 'wan') ? args.value : floatToEos(args.value, config.crossTokens[crossChain][tokenAddr].tokenSymbol),
          blockNumber: decodeEvent.blockNumber,
          timestamp: decodeEvent.timestamp * 1000,
          lockedTime: lockedTime * 1000,
          suspendTime: (1000 * (lockedTime - lockedTime / moduleConfig.secureLockIntervalRatio) + Number(decodeEvent.timestamp) * 1000).toString(),
          HTLCtime: (1000 * 2 * lockedTime + Number(decodeEvent.timestamp) * 1000).toString(),
          walletLockEvent: event
        };
      } else if ((eventName === this.crossInfoInst.depositEvent[0] && chainType === 'wan') ||
        (eventName === this.crossInfoInst.withdrawAction[0] && chainType !== 'wan')) {
        this.logger.debug("********************************** 2: found storeman lock transaction ********************************** hashX", hashX);
        content = {
          storemanLockEvent: event
        };
      } else if ((eventName === this.crossInfoInst.depositEvent[1] && chainType === 'wan') ||
        (eventName === this.crossInfoInst.withdrawAction[1] && chainType !== 'wan')) {
        this.logger.debug("********************************** 3: found wallet redeem transaction ********************************** hashX", hashX);
        content = {
          x: args.x,
          walletRedeemEvent: event
        };
      } else if ((eventName === this.crossInfoInst.depositAction[1] && chainType !== 'wan') ||
        (eventName === this.crossInfoInst.withdrawEvent[1] && chainType === 'wan')) {
        this.logger.debug("********************************** 4: found storeman redeem transaction ********************************** hashX", hashX);
        content = {
          storemanRedeemEvent: event
        };
      } else if ((eventName === this.crossInfoInst.depositAction[2] && chainType !== 'wan') ||
        (eventName === this.crossInfoInst.withdrawEvent[2] && chainType === 'wan')) {
        this.logger.debug("********************************** 5: found wallet revoke transaction ********************************** hashX", hashX);
        content = {
          walletRevokeEvent: event,
        };
      } else if ((eventName === this.crossInfoInst.depositEvent[2] && chainType === 'wan') ||
        (eventName === this.crossInfoInst.withdrawAction[2] && chainType !== 'wan')) {
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
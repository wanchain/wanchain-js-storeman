"use strict"
const {
  getGlobalChain,
//   getChain
} = require('comm/lib');

let Contract = require("contract/Contract.js");
let ethRawTrans = require("trans/EthRawTrans.js");
let wanRawTrans = require("trans/WanRawTrans.js");

let MPC = require("mpc/mpc.js");
const ModelOps = require('db/modelOps');

const moduleConfig = require('conf/moduleConfig.js');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('conf/config.json'));

const Web3 = require("web3");
const web3 = new Web3();

module.exports = class Erc20CrossAgent {
  constructor(crossChain, tokenType, crossDirection, record = null, action = null, logger = null) {
    this.logger = logger;
    this.isLeader = config.isLeader;

    this.crossChain = crossChain;
    this.crossDirection = crossDirection; /* 0 -- token to Wtoken, 1 -- Wtoken to token */
    let crossInfoInst = moduleConfig.crossInfoDict[crossChain.toUpperCase()][tokenType];
    this.transChainType = this.getTransChainType(crossDirection, action); /* wan -- trans on wanchain HTLC contract, or, trans on originchain HTLC contract */

    let abi = (this.transChainType !== 'wan') ? crossInfoInst.originalChainHtlcAbi : crossInfoInst.wanchainHtlcAbi;
    this.contractAddr = (this.transChainType !== 'wan') ? crossInfoInst.originalChainHtlcAddr : crossInfoInst.wanchainHtlcAddr;
    this.contract = new Contract(abi, this.contractAddr);

    this.crossFunc = (this.crossDirection === 0) ? crossInfoInst.depositFunc : crossInfoInst.withdrawFunc;
    this.crossEvent = (this.crossDirection === 0) ? crossInfoInst.depositEvent : crossInfoInst.withdrawEvent;
    this.approveFunc = 'approve';

    this.lockEvent = this.contract.getEventSignature(this.crossEvent[0]);
    this.refundEvent = this.contract.getEventSignature(this.crossEvent[1]);
    this.revokeEvent = this.contract.getEventSignature(this.crossEvent[2]);

    this.depositLockFunc = this.contract.getEventSignature(crossInfoInst.depositFunc[0]);
    this.depositRefundFunc = this.contract.getEventSignature(crossInfoInst.depositFunc[1]);
    this.depositRevokeFunc = this.contract.getEventSignature(crossInfoInst.depositFunc[2]);
    this.withdrawLockFunc = this.contract.getEventSignature(crossInfoInst.withdrawFunc[0]);
    this.withdrawRefundFunc = this.contract.getEventSignature(crossInfoInst.withdrawFunc[1]);
    this.withdrawRevokeFunc = this.contract.getEventSignature(crossInfoInst.withdrawFunc[2]);

    this.depositLockEvent = this.contract.getEventSignature(crossInfoInst.depositEvent[0]);
    this.depositRefundEvent = this.contract.getEventSignature(crossInfoInst.depositEvent[1]);
    this.depositRevokeEvent = this.contract.getEventSignature(crossInfoInst.depositEvent[2]);
    this.withdrawLockEvent = this.contract.getEventSignature(crossInfoInst.withdrawEvent[0]);
    this.withdrawRefundEvent = this.contract.getEventSignature(crossInfoInst.withdrawEvent[1]);
    this.withdrawRevokeEvent = this.contract.getEventSignature(crossInfoInst.withdrawEvent[2]);

    if (record !== null) {
      if (record.x !== '0x') {
        this.key = record.x;
      }

      this.hashKey = record.hashX;
      this.amount = web3.toBigNumber(record.value);
      this.crossAddress = record.crossAddress;

      this.tokenAddr = record.tokenAddr;
      this.tokenSymbol = record.tokenSymbol;
      let erc20Abi = moduleConfig.erc20Abi;
      this.tokenContract = new Contract(erc20Abi, this.tokenAddr);
    }

  }

  setKey(key) {
    this.key = key;
  }
  setHashKey(hashKey) {
    this.hashKey = hashKey;
  }

  getTransChainType(crossDirection, action) {

    if (this.crossDirection === 0) {
      if (action === 'refund') {
        return this.crossChain;
      } else {
        return 'wan';
      }
    } else {
      if (action === 'refund') {
        return 'wan';
      } else {
        return this.crossChain
      }
    }
  }

  async initAgentTransInfo(action) {
    if (action !== null) {
      this.chain = getGlobalChain(this.transChainType);
      let transInfo = await this.getTransInfo(action);
      if (this.transChainType === 'wan') {
        this.trans = new wanRawTrans(...transInfo);
      } else {
        this.trans = new ethRawTrans(...transInfo);
      }
    }
  } 

  getWeiFromEther(ether) {
    return web3.toWei(ether, 'ether');
  }

  getWeiFromGwei(gwei) {
    return web3.toWei(gwei, 'gwei');
  }

  getNonce() {
    return new Promise(async (resolve, reject) => {
      let nonce = 0;
      let chainNonce = this.transChainType + 'LastNonce';
      let nonceRenew = this.transChainType + 'NonceRenew';
      let storemanAddress;
      if (this.transChainType.toLowerCase() === 'wan') {
        storemanAddress = config.storemanWan;
      } else if (this.transChainType.toLowerCase() === 'eth') {
        storemanAddress = config.storemanEth;
      } else {
        return;
      }
      try {
        if (global[nonceRenew]) {
          nonce = await this.chain.getNonceSync(storemanAddress);
          global[chainNonce] = parseInt(nonce, 16);
          global[nonceRenew] = false;
        } else if (global[chainNonce] === 0) {
          nonce = await this.chain.getNonceIncludePendingSync(storemanAddress);
          global[chainNonce] = parseInt(nonce, 16);
        } 
        resolve(global[chainNonce]++);
      } catch (err) {
        this.logger.error("getNonce failed", err);
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
        if (action === 'approve' || action === 'approveZero') {
          from = config.storemanEth;
        } else if (action === 'refund') {
          from = (this.crossDirection === 0) ? config.storemanEth : config.storemanWan;
        } else {
          from = (this.crossDirection === 0) ? config.storemanWan : config.storemanEth;
        }

        to = (action === 'approve' || action === 'approveZero') ? this.tokenAddr : this.contractAddr;

        if (action === 'approve') {
          this.amount = Math.max(this.amount, this.getWeiFromEther(web3.toBigNumber(moduleConfig.approveTokenAllowance)));
        } else if (action === 'approveZero') {
          this.amount = 0;
        }
        amount = this.amount;

        if (this.transChainType === 'wan') {
          gas = config.wanGasLimit;
          gasPrice = this.getWeiFromGwei(web3.toBigNumber(config.wanGasPrice));
        } else {
          gas = config.ethGasLimit;
          gasPrice = await this.chain.getGasPriceSync();
          let gasAddDelta = gasPrice.plus(this.getWeiFromGwei(web3.toBigNumber(config.gasPriceDelta)));
          let maxEthGasPrice = this.getWeiFromGwei(web3.toBigNumber(config.maxEthGasPrice));
          gasPrice = Math.min(maxEthGasPrice, gasAddDelta);
        }

        nonce = await this.getNonce();
        this.logger.info("transInfo is: crossDirection- %s, transChainType- %s,\n from- %s, to- %s, gas- %s, gasPrice- %s, nonce- %s, amount- %s, \n hashX- %s", this.crossDirection, this.transChainType, from, to, gas, gasPrice, nonce, amount, this.hashKey);
        resolve([from, to, gas, gasPrice, nonce, amount]);
      } catch (err) {
        this.logger.error("getTransInfo failed", err);
        reject(err);
      }
    });
  }
  getApproveData() {
    this.logger.debug("********************************** funcInterface **********************************", this.approveFunc);
    return this.tokenContract.constructData(this.approveFunc, this.contractAddr, this.amount);
  }

  getLockData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[0], "hashX", this.hashKey);
    this.logger.debug('getLockData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'crossAddress-', this.crossAddress, 'Amount-', this.amount);
    return this.contract.constructData(this.crossFunc[0], this.tokenAddr, this.hashKey, this.crossAddress, this.amount);
  }
  getRefundData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[1], "hashX", this.hashKey);
    this.logger.debug('getRefundData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'key-', this.key);
    return this.contract.constructData(this.crossFunc[1], this.tokenAddr, this.key);
  }
  getRevokeData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[2], "hashX", this.hashKey);
    this.logger.debug('getRevokeData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey);
    return this.contract.constructData(this.crossFunc[2], this.tokenAddr, this.hashKey);
  }

  getLockEventTopic() {
    return [this.lockEvent, null, null, this.hashKey];
  }

  getRefundEventTopic() {
    return [this.refundEvent, null, null, this.hashKey];
  }

  getRevokeEventTopic() {
    return [this.revokeEvent, null, this.hashKey];
  }

  createTrans(action) {
    if (action === 'approve' || action === 'approveZero') {
      this.data = this.getApproveData();
      this.build = this.buildApproveData;
    } else if (action === 'lock') {
      this.data = this.getLockData();
      this.build = this.buildLockData;
    } else if (action === 'refund') {
      this.data = this.getRefundData();
      this.build = this.buildRefundData;
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
          // if (err.hasOwnProperty("message") &&
          //   (err.message === 'nonce too low' || err.message === 'replacement transaction underpriced')) {}
          global[this.transChainType + 'LastNonce'] = 0;
          reject(err);
        }
      });
    });
  }

  async sendTrans(callback) {
    this.logger.debug("********************************** sendTransaction ********************************** hashX", this.hashKey);

    try {
      let chainId = await this.chain.getNetworkId();
      let mpc = new MPC(this.trans.txParams, this.chain.chainType, chainId);
      let rawTx = await mpc.signViaMpc();
      this.logger.debug("********************************** sendTransaction signViaMpc ********************************** hashX", this.hashKey, rawTx);
      this.logger.debug(this.trans);
      // let rawTx = this.trans.serialize(signature);

      let self = this;
      this.chain.sendRawTransaction(rawTx, (err, result) => {
        if (!err) {
          self.logger.debug("sendRawTransaction result: ", result);
          this.logger.debug("********************************** sendTransaction success ********************************** hashX", self.hashKey);
          let content = self.build(self.hashKey, result);
          callback(err, content);
        } else {
          this.logger.error("********************************** sendTransaction failed ********************************** hashX", self.hashKey);
          callback(err, result);
        }
      });
    } catch (err) {
      this.logger.error("********************************** sendTransaction ********************************** hashX", this.hashKey, err);
      callback(err, null);
    }
  }

  validateTrans() {
    this.logger.debug("********************************** validateTrans ********************************** hashX", this.hashKey);
    return new Promise(async (resolve, reject) => {
      try {
        let chainId = await this.chain.getNetworkId();
        let mpc = new MPC(this.trans.txParams, this.chain.chainType, chainId);

        mpc.addValidMpcTxRaw();
        resolve();
      } catch (err) {
        this.logger.error("********************************** validateTrans failed ********************************** hashX", this.hashKey, err);
        reject(err);
      }
    });
  }

  buildApproveData(hashKey, result) {
    this.logger.debug("********************************** insertApproveData trans **********************************", hashKey);

    let content = {
      storemanApproveTxHash: result.toLowerCase()
    }
    return content;
  }

  buildLockData(hashKey, result) {
    this.logger.debug("********************************** insertLockData trans **********************************", hashKey);

    let content = {
      storemanLockTxHash: result.toLowerCase()
    }
    return content;
  }

  buildRefundData(hashKey, result) {
    this.logger.debug("********************************** insertRefundData trans **********************************", hashKey);

    let content = {
      storemanRefundTxHash: result.toLowerCase()
    }
    return content;
  }

  buildRevokeData(hashKey, result) {
    this.logger.debug("********************************** insertRevokeData trans **********************************", hashKey);

    let content = {
      storemanRevokeTxHash: result.toLowerCase()
    }
    return content;
  }
}

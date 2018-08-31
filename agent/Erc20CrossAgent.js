"use strict"

let Contract = require("contract/Contract.js");
let ethRawTrans = require("trans/EthRawTrans.js");
let wanRawTrans = require("trans/WanRawTrans.js");
const ModelOps = require('db/modelOps');
const config = require('conf/config.js');


module.exports = class Erc20CrossAgent {
  constructor(crossToken, crossDirection, action = null, record = null, logger = null) {
    let token = config.crossTokenDict[crossToken];
    this.tokenAddr = token.tokenAddr;
    let crossInfoInst = config.crossInfoDict[config.crossTypeDict[token.tokenType]];
    this.transChainType = this.getTransChainType(crossDirection, action); /* wan -- trans on wanchain HTLC contract, or, trans on originchain HTLC contract */

    let abi = (transChainType !== 'wan') ? crossInfoInst.originalChainHtlcAbi : crossInfoInst.wanchainHtlcAbi;
    let contractAddr = (transChainType !== 'wan') ? crossInfoInst.originalChainHtlcAddr : crossInfoInst.wanchainHtlcAddr;
    let erc20Abi = config.erc20Abi;

    this.contract = new Contract(abi, contractAddr);
    this.tokenContract = new Contract(erc20Abi, this.tokenAddr);

    this.crossDirection = crossDirection; /* 0 -- token to Wtoken, 1 -- Wtoken to token */
    this.crossFunc = (this.crossDirection === 0) ? crossInfoInst.depositFunc : crossInfoInst.withdrawFunc;
    this.crossEvent = (this.crossDirection === 0) ? crossInfoInst.depositEvent : crossInfoInst.withdrawEvent;
    this.approveFunc = 'approve';
    this.key = record.x;
    this.hashKey = record.hashX;
    this.amount = record.value;
    this.crossAddress = record.crossAddress;

    let transInfo = this.getTransInfo(action);
    if (transChainType === 'wan') {
      this.trans = new wanRawTrans(...transInfo);
    } else {
      this.trans = new ethRawTrans(...transInfo);
    }

    this.lockEvent = contract.getEventSignature(this.crossEvent[0]);
    this.refundEvent = contract.getEventSignature(this.crossEvent[1]);
    this.revokeEvent = contract.getEventSignature(this.crossEvent[2]);

    // this.depositLockEvent = contract.getEventSignature(crossInfoInst.depositEvent[0]);
    // this.depositRefundEvent = contract.getEventSignature(crossInfoInst.depositEvent[1]);
    // this.depositRevokeEvent = contract.getEventSignature(crossInfoInst.depositEvent[2]);
    // this.withdrawLockEvent = contract.getEventSignature(crossInfoInst.withdrawEvent[0]);
    // this.withdrawRefundEvent = contract.getEventSignature(crossInfoInst.withdrawEvent[1]);
    // this.withdrawRevokeEvent = contract.getEventSignature(crossInfoInst.withdrawEvent[2]);

    this.logger = logger;
  }

  setKey(key) {
    this.key = key;
  }
  setHashKey(hashKey) {
    this.hashKey = hashKey;
  }

  getTransChainType(crossDirection, action) {
    if (this.record.crossDirection === 0) {
      if (action === 'refund') {
        return 'eth';
      } else {
        return 'wan';
      }
    } else {
      if (action === 'refund') {
        return 'wan';
      } else {
        return 'eth';
      }
    }
  }

  getWeiFromEther(ether) {
    return ether * 1000 * 1000 * 1000 * 1000 * 1000 * 1000;
  }

  getWeiFromGwei(ether) {
    return ether * 1000 * 1000 * 1000;
  }

  getNonce() {
    if (this.transChainType === 'wan') {
      if (global.lastWanNonce === 0) {
        global.lastWanNonce = parseInt(global.wanNonce, 16);
      } else {
        global.lastWanNonce++;
      }
      return global.lastWanNonce;
    } else {
      if (global.lastEthNonce === 0) {
        global.lastEthNonce = parseInt(global.ethNonce, 16);
      } else {
        global.lastEthNonce++;
      }
      return global.lastEthNonce;
    }
  }

  getTransInfo(action) {
    let from;
    let to;
    let amount;
    let gas;
    let gasPrice;
    let nonce;

    if (action === 'approve') {
      from = global.storemanEth;
    } else if (action === 'refund') {
      from = (crossDirection === 0) ? global.storemanEth : global.storemanWan;
    } else {
      from = (crossDirection === 0) ? global.storemanWan : global.storemanEth;
    }

    to = (action === 'approve') ? this.tokenAddr : this.contractAddr;
    amount = this.amount;

    if (this.transChainType === 'wan') {
      gas = global.wanGasLimit;
      gasPrice = getWeiFromGwei(global.wanGasPrice);
    } else {
      gas = global.ethGasLimit;
      gasPrice = global.ethGasPrice;
    }

    nonce = this.getNonce();
    console.log("transInfo is", from, to, gas, gasPrice, nonce, amount, 'hashX:', this.hashKey);
    return [from, to, gas, gasPrice, nonce, amount];
  }

  getApproveData() {
    console.log("********************************** funcInterface **********************************", this.approveFunc);
    return this.tokenContract.constructData(this.approveFunc, this.contractAddr, this.amount);
  }

  getLockData() {
    console.log("********************************** funcInterface **********************************", this.crossFunc[0], "hashX", this.hashKey);
    //this.logger.debug('getLockData: chainType-', this.chainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey,'crossAddress-', this.crossAddress,'Amount-', this.amount);
    return this.tokenContract.constructData(this.crossFunc[0], this.tokenAddr, this.hashKey, this.crossAddress, this.amount);
  }
  getRefundData() {
    console.log("********************************** funcInterface **********************************", this.crossFunc[1], "hashX", this.hashKey);
    //this.logger.debug('getRefundData: chainType-', this.chainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'key-', this.key);
    return this.tokenContract.constructData(this.crossFunc[1], this.tokenAddr, this.key);
  }
  getRevokeData() {
    console.log("********************************** funcInterface **********************************", this.crossFunc[2], "hashX", this.hashKey);
    //this.logger.debug('getRevokeData: chainType-', this.chainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey);
    return this.tokenContract.constructData(this.crossFunc[2], this.tokenAddr, this.hashKey);
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

  async createTrans(action) {
    let self = this;
    let data;
    let build;

    return new Promise((resolve, reject) => {
      if (action === 'approve') {
        data = self.getApproveData();
        build = self.buildApproveData;
      } else if (action === 'lock') {
        data = self.getLockData();
        build = self.buildLockData;
      } else if (action === 'refund') {
        data = self.getRefundData();
        build = self.buildRefundData;
      } else if (action === 'revoke') {
        data = self.getRevokeData();
        build = self.buildRevokeData;
      }

      sendTrans(global.password, data, build, (err, result) => {
        if (!err && result !== null) {
          resolve(result);
        } else {
          reject(err);
        }
      })

    })
  }

  sendTrans(password, data, build, callback) {
    console.log("********************************** sendTransaction ********************************** hashX", trans.Contract.hashKey);
    this.trans.setData(data);

    let rawTx = this.trans.signFromKeystore(password);
    let self = this;
    self.chain.sendRawTransaction(rawTx, (err, result) => {
      if (!err) {
        self.logger.debug("sendRawTransaction result: ", result);
        console.log("********************************** sendTransaction success ********************************** hashX", trans.Contract.hashKey);
        let content = self.build(result);
        callback(err, content); 
      } else {
        console.log("********************************** sendTransaction failed ********************************** hashX", trans.Contract.hashKey);
        callback(err, result);
      }
    });
  }

  buildApproveData(result) {
    console.log("********************************** insertApproveData trans **********************************", trans.Contract.hashKey);

    let content = {
      // status: 'waitingCrossApproveConfirming',
      storemanApproveTxHash: result.toLowerCase()
    }
    // this.logger.debug("insertApproveData storemanApproveTxHash: ", result);
    // this.modelOps.saveScannedEvent(this.hashKey, content);
    return content;
  }

  buildLockData(result) {
    console.log("********************************** insertLockData trans **********************************", trans.Contract.hashKey);

    let content = {
      // status: 'waitingCrossLockConfirming',
      storemanLockTxHash: result.toLowerCase()
    }
    // this.logger.debug("insertLockData storemanLockTxHash: ", result);
    // this.modelOps.saveScannedEvent(this.hashKey, content);
    return content;
  }

  buildRefundData(result) {
    console.log("********************************** insertRefundData trans **********************************", trans.Contract.hashKey);

    let content = {
      // status: 'waitingCrossRefundConfirming',
      storemanRefundTxHash: result.toLowerCase()
    }
    // this.logger.debug("insertRefundData storemanRefundTxHash: ", result);
    // this.modelOps.saveScannedEvent(this.hashKey, content);
    return content;
  }

  buildRevokeData(result) {
    console.log("********************************** insertRevokeData trans **********************************", trans.Contract.hashKey);

    let content = {
      // status: 'waitingCrossRevokeConfirming',
      storemanRevokeTxHash: result.toLowerCase()
    }
    // this.logger.debug("insertRevokeData storemanRevokeTxHash: ", result);
    // this.modelOps.saveScannedEvent(this.hashKey, content);
    return content;
  }
}
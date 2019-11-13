"use strict"
// const {
//   getGlobalChain,
//   sleep
// //   getChain
// } = require('comm/lib');
const baseAgent = require("agent/BaseAgent.js");
let ethRawTrans = require("trans/EthRawTrans.js");

const Web3 = require("web3");
const web3 = new Web3();

module.exports = class EthAgent extends baseAgent{
  constructor(crossChain, tokenType, record = null) {
    super(crossChain, tokenType, record);
    this.RawTrans = ethRawTrans;

    this.record = record;
    if (record !== null) {
      this.amount = web3.toBigNumber(record.value);
    }

  }

  getWeiFromEther(ether) {
    return web3.toWei(ether, 'ether');
  }

  getWeiFromGwei(gwei) {
    return web3.toWei(gwei, 'gwei');
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
        from = this.storemanAddress;
        to = (action === 'approve' || action === 'approveZero') ? this.tokenAddr : this.contractAddr;

        if (action === 'approve') {
          this.amount = Math.max(this.amount, this.getWeiFromEther(web3.toBigNumber(this.crossConf.approveTokenAllowance)));
        } else if (action === 'approveZero') {
          this.amount = 0;
        }

        amount = this.amount;

        gas = this.crossConf.gasLimit;
        gasPrice = await this.chain.getGasPriceSync();
        let gasAddDelta = gasPrice.plus(this.getWeiFromGwei(web3.toBigNumber(this.crossConf.gasPriceDelta)));
        let maxGasPrice = this.getWeiFromGwei(web3.toBigNumber(this.crossConf.maxGasPrice));
        gasPrice = Math.min(maxGasPrice, gasAddDelta);

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
    if (this.tokenType === 'COIN') {
      return this.contract.constructData(this.crossFunc[0], this.hashKey, this.crossAddress);
    } else {
      return this.contract.constructData(this.crossFunc[0], this.tokenAddr, this.hashKey, this.crossAddress, this.amount);
    }
  }
  getRedeemData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[1], "hashX", this.hashKey);
    this.logger.debug('getRedeemData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'key-', this.key);
    if (this.tokenType === 'COIN') {
      return this.contract.constructData(this.crossFunc[1], this.key);
    } else {
      return this.contract.constructData(this.crossFunc[1], this.tokenAddr, this.key);
    }
  }
  getRevokeData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[2], "hashX", this.hashKey);
    this.logger.debug('getRevokeData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey);
    if (this.tokenType === 'COIN') {
      return this.contract.constructData(this.crossFunc[2], this.hashKey);
    } else {
      return this.contract.constructData(this.crossFunc[2], this.tokenAddr, this.hashKey);
    }
  }

  buildApproveZeroData(hashKey, result) {
    this.logger.debug("********************************** insertApproveZeroData trans **********************************", hashKey);

    let content = {
      storemanApproveZeroTxHash: (Array.isArray(this.record.storemanApproveZeroTxHash)) ? [...this.record.storemanApproveZeroTxHash] : [this.record.storemanApproveZeroTxHash]
    }
    content.storemanApproveZeroTxHash.push(result.toLowerCase());
    return content;
  }

  buildApproveData(hashKey, result) {
    this.logger.debug("********************************** insertApproveData trans **********************************", hashKey);

    let content = {
      storemanApproveTxHash: (Array.isArray(this.record.storemanApproveTxHash)) ? [...this.record.storemanApproveTxHash] : [this.record.storemanApproveTxHash]
    }
    content.storemanApproveTxHash.push(result.toLowerCase());
    return content;
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

  getDecodeEventTokenAddr(decodeEvent) {
    if (this.tokenType === 'COIN') {
      return '0x';
    } else {
      return decodeEvent.args.tokenOrigAddr;
    }
  }

  getDecodeEventStoremanGroup(decodeEvent) {
    if (this.tokenType === 'COIN') {
      return decodeEvent.args.storeman;
    } else {
      return decodeEvent.args.storemanGroup;
    }
  }

  getDecodeEventValue(decodeEvent) {
    return decodeEvent.args.value.toString(10);
  }

  getDecodeEventToHtlcAddr(decodeEvent) {
    return decodeEvent.address;
  }
}
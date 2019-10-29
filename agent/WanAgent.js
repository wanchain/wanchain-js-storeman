"use strict"
const baseAgent = require("agent/BaseAgent.js");

const Web3 = require("web3");
const web3 = new Web3();

let Contract = require("contract/Contract.js");
let RawTrans = require("trans/WanRawTrans.js");

const {
  encodeAccount,
  decodeAccount,
  eosToFloat,
  floatToEos
} = require('comm/lib');

module.exports = class WanAgent extends baseAgent{
  constructor(crossChain, tokenType, record = null) {
    super(crossChain, tokenType, record);

    this.RawTrans = RawTrans;
    this.storemanAddress = this.config.storemanWan;

    console.log("aaron debug here, WAN agent", crossChain, this.storemanAddress);
  }

  getChainType() {
    return 'WAN';
  }

  getContractInfo() {
    let abi = this.crossInfoInst.wanchainHtlcAbi;
    this.contractAddr = this.crossInfoInst.wanchainHtlcAddr;
    this.contract = new Contract(abi, this.contractAddr);
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

        let tempAmount = (this.crossChain === 'EOS') ? eosToFloat(this.amount) : this.amount;
        amount = web3.toBigNumber(tempAmount);

        gas = this.config.wanGasLimit;
        gasPrice = this.getWeiFromGwei(web3.toBigNumber(this.config.wanGasPrice));
        nonce = await this.getNonce();
        this.logger.info("transInfo is: crossDirection- %s, transChainType- %s,\n from- %s, to- %s, gas- %s, gasPrice- %s, nonce- %s, amount- %s, \n hashX- %s", this.crossDirection, this.transChainType, from, to, gas, gasPrice, nonce, amount, this.hashKey);
        resolve([from, to, gas, gasPrice, nonce, amount]);
      } catch (err) {
        this.logger.error("getTransInfo failed", err);
        reject(err);
      }
    });
  }

  getLockData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[0], "hashX", this.hashKey);
    this.logger.debug('getLockData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'crossAddress-', this.crossAddress, 'Amount-', this.amount);
    this.internalSignViaMpc([encodeAccount(this.crossChain, this.tokenAddr), this.hashKey, this.crossAddress, web3.toBigNumber(eosToFloat(this.amount))],[]);
    return this.contract.constructData(this.crossFunc[0], encodeAccount(this.crossChain, this.tokenAddr), this.hashKey, this.crossAddress, web3.toBigNumber(eosToFloat(this.amount)));
  }

  getRedeemData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[1], "hashX", this.hashKey);
    this.logger.debug('getRedeemData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'key-', this.key);
    this.internalSignViaMpc([this.tokenAddr, this.key],[]);
    return this.contract.constructData(this.crossFunc[1], this.tokenAddr, this.key);
  }

  getRevokeData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[2], "hashX", this.hashKey);
    this.logger.debug('getRevokeData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey);
    this.internalSignViaMpc([encodeAccount(this.crossChain, this.tokenAddr), this.hashKey],[]);
    return this.contract.constructData(this.crossFunc[2], encodeAccount(this.crossChain, this.tokenAddr), this.hashKey);
  }

  getDecodeEventTokenAddr(decodeEvent) {
    // return decodeAccount(this.crossChain, decodeEvent.args.tokenOrigAccount);
    if (this.tokenType === 'COIN') {
      return '0x';
    } else {
      return decodeAccount(this.crossChain, decodeEvent.args.tokenOrigAccount);
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
    if (this.crossChain === 'EOS') {
      return floatToEos(decodeEvent.args.value, this.config.crossTokens[this.crossChain].TOKEN[this.getDecodeEventTokenAddr(decodeEvent)].tokenSymbol);
    } else {
      return decodeEvent.args.value.toString(10);
    }
  }

  getDecodeEventToHtlcAddr(decodeEvent) {
    return decodeEvent.address;
  }

  encode(signData, typesArray) {
    this.logger.debug("********************************** encode signData **********************************", signData, "hashX:", this.hashX);

    return web3.eth.abi.encodeParameters(typesArray, signData);
  }
}
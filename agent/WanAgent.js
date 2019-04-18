"use strict"
const baseAgent = require("agent/BaseAgent.js");

const Web3 = require("web3");
const web3 = new Web3();

let Contract = require("contract/Contract.js");
let RawTrans = require("trans/WanRawTrans.js");

const {
  getGlobalChain,
  encodeEosAccount,
  decodeEosAccount,
  eosToFloat,
  floatToEos
} = require('comm/lib');

module.exports = class WanAgent extends baseAgent{
  constructor(crossChain, tokenType, crossDirection = 0, record = null, action = null) {
    super(crossChain, tokenType, crossDirection, record, action);

    this.RawTrans = RawTrans;
    this.transChainType = 'wan';
    this.chain = getGlobalChain(this.transChainType);
    this.storemanAddress = this.config.storemanWan;

    console.log("aaron debug here, wan agent", this.storemanAddress);
   
    this.getNonce();

    let abi = (this.transChainType !== 'wan') ? this.crossInfoInst.originalChainHtlcAbi : this.crossInfoInst.wanchainHtlcAbi;
    this.contractAddr = (this.transChainType !== 'wan') ? this.crossInfoInst.originalChainHtlcAddr : this.crossInfoInst.wanchainHtlcAddr;
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
        if (action === 'redeem') {
          from = (this.crossDirection === 0) ? this.config.storemanOri : this.config.storemanWan;
        } else {
          from = (this.crossDirection === 0) ? this.config.storemanWan : this.config.storemanOri;
        }

        to = this.contractAddr;

        let tempAmount = (this.crossChain.toLowerCase() === 'eos') ? eosToFloat(this.amount) : this.amount;
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

  async sendTrans(callback) {
    this.logger.debug("********************************** sendTransaction ********************************** hashX", this.hashKey);
    let self = this;
    try {
      let rawTx;
      if (moduleConfig.mpcSignature) {
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

    } catch (err) {
      this.logger.error("********************************** sendTransaction failed ********************************** hashX", this.hashKey, err);
      callback(err, null);
    }
  }

  getLockData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[0], "hashX", this.hashKey);
    this.logger.debug('getLockData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'crossAddress-', this.crossAddress, 'Amount-', this.amount);
    return this.contract.constructData(this.crossFunc[0], encodeEosAccount(this.tokenAddr), this.hashKey, this.crossAddress, web3.toBigNumber(eosToFloat(this.amount)));
  }

  getRedeemData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[1], "hashX", this.hashKey);
    this.logger.debug('getRedeemData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'key-', this.key);
    return this.contract.constructData(this.crossFunc[1], this.tokenAddr, this.key);
  }

  getRevokeData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[2], "hashX", this.hashKey);
    this.logger.debug('getRevokeData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey);
    return this.contract.constructData(this.crossFunc[2], encodeEosAccount(this.tokenAddr), this.hashKey);
  }

  getDecodeEventTokenAddr(decodeEvent) {
    return decodeEosAccount(decodeEvent.args.tokenOrigAddr);
  }

  getDecodeEventStoremanGroup(decodeEvent) {
    return decodeEvent.args.storemanGroup;
  }

  getDecodeEventValue(decodeEvent) {
    return floatToEos(decodeEvent.args.value, this.config.crossTokens[this.crossChain][this.getDecodeEventTokenAddr(decodeEvent)].tokenSymbol)
  }

  getDecodeEventToHtlcAddr(decodeEvent) {
    return decodeEvent.address;
  }
}
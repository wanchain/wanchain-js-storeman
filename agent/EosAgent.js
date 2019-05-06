"use strict"
const baseAgent = require("agent/BaseAgent.js");

let Eos = require("eosjs");
let RawTrans = require("trans/EosRawTrans.js");

const moduleConfig = require('conf/moduleConfig.js');
const {
  encodeAccount,
  decodeAccount
} = require('comm/lib');

module.exports = class EosAgent extends baseAgent{
  constructor(crossChain, tokenType, crossDirection = 0, record = null, action = null) {
    super(crossChain, tokenType, crossDirection, record, action);

    this.RawTrans = RawTrans;

    console.log("aaron debug hereh, eos agent", this.storemanAddress);
    this.crossFunc = (this.crossDirection === 0) ? this.crossInfoInst.depositAction : this.crossInfoInst.withdrawAction;
    this.depositEvent = this.crossInfoInst.depositAction;
    this.withdrawEvent = this.crossInfoInst.withdrawAction;
  }

  getTransInfo(action) {
    let from;
    let to;
    let amount;

    return new Promise(async (resolve, reject) => {
      try {
        if (action === 'redeem') {
          from = (this.crossDirection === 0) ? this.config.storemanOri : this.config.storemanWan;
        } else {
          from = (this.crossDirection === 0) ? this.config.storemanWan : this.config.storemanOri;
        }

        to = this.contractAddr;

        amount = this.amount;

        this.logger.info("transInfo is: crossDirection- %s, transChainType- %s,\n from- %s, to- %s, amount- %s, \n hashX- %s", this.crossDirection, this.transChainType, from, to, amount, this.hashKey);
        resolve([from, to, amount]);
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
        if(moduleConfig.mpcSignature) {
          let chainId = await this.chain.getNetworkId();
          let mpc = new MPC(this.trans.txParams, this.chain.chainType, chainId, this.hashKey);
          rawTx = await mpc.signViaMpc();
          this.logger.debug("********************************** sendTransaction signViaMpc ********************************** hashX", this.hashKey, rawTx);
        } else {
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
          return;
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

    let actions = [{
      account: 'htlceos',
      name: this.crossFunc[0],
      authorization: [{
        actor: 'htlceos',
        permission: 'active',
      }],
      data: {
        // tokenOrigAddr: 'htlceos',
        // xHash: this.hashKey,
        // user: this.crossAddress,
        // value: this.amount
        storemanGroup: decodeAccount(this.crossChain, this.config.storemanOri),
        xHash: this.hashKey.split('0x')[1],
        user: decodeAccount(this.crossChain, this.crossAddress),
        value: this.amount
      }
    }];
    return actions;
  }

  getRedeemData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[1], "hashX", this.hashKey);
    this.logger.debug('getRedeemData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'key-', this.key);

    let actions = [{
      account: 'htlceos',
      name: this.crossFunc[1],
      authorization: [{
        actor: 'htlceos',
        permission: 'active',
      }],
      data: {
        storemanGroup: decodeAccount(this.crossChain, this.config.storemanOri),
        xHash: this.hashKey.split('0x')[1],
        user: this.record.from,
        x: this.key.split('0x')[1]
      }
    }];
    return actions;

  }

  getRevokeData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[2], "hashX", this.hashKey);
    this.logger.debug('getRevokeData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey);

    let actions = [{
      account: 'htlceos',
      name: this.crossFunc[2],
      authorization: [{
        actor: 'htlceos',
        permission: 'active',
      }],
      data: {
        storemanGroup: decodeAccount(this.crossChain, this.config.storemanOri),
        xHash: this.hashKey.split('0x')[1]
      }
    }];
    return actions;
  }

  getDecodeEventTokenAddr(decodeEvent) {
    return decodeEvent.args.tokenOrigAccount;
  }

  getDecodeEventStoremanGroup(decodeEvent) {
    // return decodeEvent.args.storemanGroup;
    // storeman = encodeAccount(this.crossChain, storeman);
    return '0x01000373746f72656d616e';
  }

  getDecodeEventValue(decodeEvent) {
    return decodeEvent.args.value;
  }

  getDecodeEventToHtlcAddr(decodeEvent) {
    return decodeEvent.args.toHtlcAddr;
  }
}
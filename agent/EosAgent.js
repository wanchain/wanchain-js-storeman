"use strict"
const baseAgent = require("agent/BaseAgent.js");

// let Eos = require("eosjs");
let RawTrans = require("trans/EosRawTrans.js");

const {
  encodeAccount,
  hexTrip0x,
  decodeAccount,
  eosToFloat,
  floatToEos
} = require('comm/lib');

module.exports = class EosAgent extends baseAgent{
  constructor(crossChain, tokenType, record = null) {
    super(crossChain, tokenType, record);

    this.RawTrans = RawTrans;

    console.log("aaron debug here, eos agent", this.storemanAddress);
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
        from = this.storemanAddress;

        to = this.contractAddr;

        this.amount = floatToEos(this.amount, this.tokenSymbol);

        amount = this.amount;

        this.logger.info("transInfo is: crossDirection- %s, transChainType- %s,\n from- %s, to- %s, amount- %s, \n hashX- %s", this.crossDirection, this.transChainType, from, to, amount, this.hashKey);
        resolve([from, to, amount]);
      } catch (err) {
        this.logger.error("getTransInfo failed", err);
        reject(err);
      }
    });
  }

  signTrans() {
    let self = this;
    return new Promise(async (resolve, reject) => {
      try {
        let rawTx;
        // let password = process.env.KEYSTORE_PWD;

        if (1) {
          let privateKey= ['5JtXWF9PmP7pSRX6wJfxHkaHLqAjRvwXWqTBsNtNorfr2bpjiQ9'];
          rawTx = await this.trans.signTransDebug(privateKey, self.chain);
        } else {
        let wallet = 'aaron';
        let password = 'PW5Jv45rNbTgfb7ui7ew4Rv81hsQwhuaQpfEtCzGy2YWG6arUk5xy';

        rawTx = await self.trans.signTransFromKeosd(wallet, password, self.chain);
        }
        resolve(rawTx);
      } catch (err) {
        self.logger.error("********************************** signTrans failed ********************************** hashX", self.hashKey);
        reject(err);
      }
    });
  }

  // outlock(eosio::name storeman, eosio::name user, eosio::asset quantity, std::string xHash, std::string wanAddr, std::string pk, std::string R, std::string s)
  async getLockData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[0], "hashX", this.hashKey);
    this.logger.debug('getLockData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'crossAddress-', this.crossAddress, 'Amount-', this.amount);

    let signData = [hexTrip0x(this.pk), this.storemanAddress, this.amount, hexTrip0x(this.hashKey), this.crossAddress, this.pk];
    let internalSignature = await this.internalSignViaMpc(signData);
    let actions = [{
      account: this.contractAddr,
      name: this.crossFunc[0],
      authorization: [{
        actor: this.storemanAddress,
        permission: 'active',
      }],
      data: {
        // tokenOrigAccount: 'htlceos',
        // xHash: this.hashKey,
        // user: this.crossAddress,
        // value: this.amount
        // storemanGroup: decodeAccount(this.crossChain, this.storemanAddress),
        // storeman: hexTrip0x(this.pk),
        storeman: this.storemanAddress,
        user: this.crossAddress,
        // value: this.amount,
        quantity: this.amount,
        xHash: hexTrip0x(this.hashKey),
        wanAddr: this.crossAddress,
        pk: this.pk,
        r: internalSignature.R,
        s: internalSignature.S
      }
    }];
    return actions;
  }

  // inredeem(eosio::name storeman, std::string x, std::string r, std::string s)
  async getRedeemData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[1], "hashX", this.hashKey);
    this.logger.debug('getRedeemData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'key-', this.key);


    if (this.hashKey === '0xe24b6e28e5e8835f03be187197aa68e8dd59c83a9c1b8e5d804e2eea2b926ec7') {
      this.key = '0xf9e3c53945a4287beec09b55636418c78aafa2df91873414f8224c84acf09d6f';
    } else if (this.hashKey === '0x44ad684bde62eafab28c205ed889ef6dceaa4273f0d8e4b6394b8ef3c18f3060') {
      this.key = '0x204b84afd243c144ae2e828b9bf2f1f24153511785daabcbb779eb45f5a16ba9';
    } else if (this.hashKey === '0xeafd6521494402abfed88e888107e3870f6c42a9bd5c79c550d23ed14630e7c2') {
      this.key = '0x00dff2025305035d12b17e2f0836b690e79be6bf82f78713c50365b7d06c7f82';
    } else if (this.hashKey === '0x80933de75748db7820458215190f252f3f2f5ad06edf919fd37c188565eb9a2d') {
      this.key = '0x57ca9b55867833332843389c8fc557076803ab430c69c1e79ab489c55c75c235';
    } else if (this.hashKey === '0x5ce9ff5a7e5a5d3a2e7172ecd81e13750e6573105d9cdf8fd32e4fdf86e47211') {
      this.key = '0xfdbf6dc5c99651f8c494f0a08d2e4c2cd298f868d3c293d775d8acc9c01bcccf';
    }

    let signData = [hexTrip0x(this.storemanAddress), hexTrip0x(this.key)];
    let internalSignature = await this.internalSignViaMpc(signData);

    if (this.isLeader) {
      let actions = [{
        account: this.contractAddr,
        name: this.crossFunc[1],
        authorization: [{
          actor: this.storemanAddress,
          permission: 'active',
        }],
        data: {
          // storemanGroup: decodeAccount(this.crossChain, this.storemanAddress),
          // storeman: hexTrip0x(this.pk),
          storeman: this.storemanAddress,
          x: hexTrip0x(this.key),
          r: hexTrip0x(internalSignature.R),
          s: hexTrip0x(internalSignature.S)
        }
      }];
      return actions;
    }
  }

  // outrevoke(eosio::name storeman, std::string xHash, std::string r, std::string s)
  async getRevokeData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[2], "hashX", this.hashKey);
    this.logger.debug('getRevokeData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey);

    let signData = [hexTrip0x(this.storemanAddress), hexTrip0x(this.hashKey)];
    let internalSignature = await this.internalSignViaMpc(signData);
    let actions = [{
      account: this.contractAddr,
      name: this.crossFunc[2],
      authorization: [{
        actor: this.storemanAddress,
        permission: 'active',
      }],
      data: {
        // storeman: hexTrip0x(this.pk),
        storeman: this.storemanAddress,
        xHash: hexTrip0x(this.hashKey),
        r: internalSignature.R,
        s: internalSignature.S
      }
    }];
    return actions;
  }

  getDecodeEventTokenAddr(decodeEvent) {
    return decodeEvent.args.tokenOrigAccount;
  }

  getDecodeEventStoremanGroup(decodeEvent) {
    return decodeEvent.args.storemanGroup;
    // storeman = encodeAccount(this.crossChain, storeman);
    // return '0x01000373746f72656d616e';
  }

  getDecodeEventValue(decodeEvent) {
    // return decodeEvent.args.value;
    return eosToFloat(decodeEvent.args.value, this.config.crossTokens[this.crossChain].TOKEN[this.getDecodeEventTokenAddr(decodeEvent)].tokenSymbol);
  }

  getDecodeEventToHtlcAddr(decodeEvent) {
    return decodeEvent.args.toHtlcAddr;
  }

  encode(signData, typesArray) {
    let data = '';
    if (Array.isArray(signData)) {
      for (var index in signData) {
        data += signData[index];
        if (index + 1 < signData.length) {
          data += ':';
        }
      }
    } else {
      data = signData;
    }
    this.logger.debug("********************************** encode signData **********************************", signData, "hashX:", this.hashKey);
    return new Buffer(data).toString('base64');
  }
}
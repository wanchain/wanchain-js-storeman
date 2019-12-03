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

    if (record !== null) {
      this.amount = web3.toBigNumber(record.value);
    }

    this.RawTrans = RawTrans;
    this.storemanAddress = this.crossConf.storemanWan;

    console.log("aaron debug here, WAN agent", crossChain, this.storemanAddress);
  }

  getChainType() {
    return 'WAN'.toLowerCase();
  }

  getContractInfo() {
    let abi = this.crossInfoInst.wanchainHtlcAbi;
    this.contractAddr = this.crossInfoInst.wanchainHtlcAddr;
    this.contract = new Contract(abi, this.contractAddr);
  }

  getLockedTime() {
    return 3600;
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

        // let tempAmount = (this.crossChain === 'EOS') ? eosToFloat(this.amount) : this.amount;
        amount = web3.toBigNumber(this.amount);

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

  // ETH: eth2wethLock(bytes32 xHash, address wanAddr, uint value)
  // ERC20: inboundLock(address tokenOrigAddr, bytes32 xHash, address wanAddr, uint value) 
  // Schnorr: inSmgLock(bytes tokenOrigAccount, bytes32 xHash, address wanAddr, uint value, bytes storemanGroupPK, bytes r, bytes32 s)
  async getLockData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[0], "hashX", this.hashKey);
    this.logger.debug('getLockData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'crossAddress-', this.crossAddress, 'Amount-', this.amount);

    // web3.toBigNumber(eosToFloat(this.amount))
    if (this.schnorrMpc) {
      let signData = [encodeAccount(this.crossChain, this.tokenAddr), this.hashKey, this.crossAddress, this.amount, this.storemanPk];
      let typesArray = ['bytes', 'bytes32', 'address', 'uint', 'bytes'];
      let internalSignature = await this.internalSignViaMpc(signData, typesArray);
      let params = signData.concat(internalSignature.R, internalSignature.S);
      if (this.isLeader) {
        return this.contract.constructData(this.crossFunc[0], ...params);
      }
    } else if (this.tokenType === 'COIN') {
      return this.contract.constructData(this.crossFunc[0], this.hashKey, this.crossAddress, this.amount);
    } else {
      return this.contract.constructData(this.crossFunc[0], this.tokenAddr, this.hashKey, this.crossAddress, this.amount);
    }
  }

  // ETH: weth2ethRefund(bytes32 x) 
  // ERC20: outboundRedeem(address tokenOrigAddr, bytes32 x) 
  // Schnorr: outSmgRedeem(bytes tokenOrigAccount, bytes32 x, bytes r, bytes32 s)
  async getRedeemData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[1], "hashX", this.hashKey);
    this.logger.debug('getRedeemData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'key-', this.key);

    if (this.schnorrMpc) {
      let signData = [encodeAccount(this.crossChain, this.tokenAddr), this.key];
      let typesArray = ['bytes', 'bytes32'];
      let internalSignature = await this.internalSignViaMpc(signData, typesArray);
      let params = signData.concat(internalSignature.R, internalSignature.S);
      if (this.isLeader) {
        return this.contract.constructData(this.crossFunc[1], ...params);
      }
    } else if (this.tokenType === 'COIN') {
      return this.contract.constructData(this.crossFunc[1], this.key);
    } else {
      return this.contract.constructData(this.crossFunc[1], this.tokenAddr, this.key);
    }
  }

  // ETH: eth2wethRevoke(bytes32 xHash) 
  // ERC20: inboundRevoke(address tokenOrigAddr, bytes32 xHash) 
  // Schnorr: inSmgRevoke(bytes tokenOrigAccount, bytes32 xHash) 
  async getRevokeData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[2], "hashX", this.hashKey);
    this.logger.debug('getRevokeData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey);

    if (this.schnorrMpc) {
      let signData = [encodeAccount(this.crossChain, this.tokenAddr), this.hashKey];
      // let typesArray = ['bytes', 'bytes32'];
      // let internalSignature = await this.internalSignViaMpc(signData, typesArray);
      if (this.isLeader) {
        // return this.contract.constructData(this.crossFunc[0], signData.concat(internalSignature.R, internalSignature.S));
        return this.contract.constructData(this.crossFunc[2], ...signData);
      }
    } else if (this.tokenType === 'COIN') {
      return this.contract.constructData(this.crossFunc[2], this.hashKey);
    } else {
      return this.contract.constructData(this.crossFunc[2], this.tokenAddr, this.hashKey);
    }
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
    if (this.schnorrMpc) {
      return decodeEvent.args.storemanGroupPK;
    } else if (this.tokenType === 'COIN') {
      return decodeEvent.args.storeman;
    } else {
      return decodeEvent.args.storemanGroup;
    }
  }

  getDecodeEventValue(decodeEvent) {
    return decodeEvent.args.value.toString(10);

    // if (this.crossChain === 'EOS') {
    //   return floatToEos(decodeEvent.args.value, this.config.crossTokens[this.crossChain].TOKEN[this.getDecodeEventTokenAddr(decodeEvent)].tokenSymbol);
    // } else {
    //   return decodeEvent.args.value.toString(10);
    // }
  }

  getDecodeEventToHtlcAddr(decodeEvent) {
    return decodeEvent.address;
  }

  getDecodeCrossAddress(decodeEvent) {
    if (this.schnorrMpc) {
      return decodeAccount(this.crossChain, decodeEvent.args.userOrigAccount);
    } else {
      return decodeEvent.args.ethAddr;
    }
  }

  encode(signData, typesArray) {
    this.logger.debug("********************************** encode signData **********************************", signData, "hashX:", this.hashKey);

    let coder = require("web3/lib/solidity/coder");
    let encodeResult = coder.encodeParams(typesArray, signData);
    if (encodeResult.indexOf('0x') === 0) {
      return encodeResult;
    } else {
      return '0x' + encodeResult;
    }
    // return coder.encodeParams(typesArray, signData);
  }
}
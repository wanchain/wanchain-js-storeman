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
  floatToEos,
  hexTrip0x,
  hexAdd0x
} = require('comm/lib');

module.exports = class WanAgent extends baseAgent{
  constructor(crossChain, tokenType, record = null) {
    super(crossChain, tokenType, record);

    if (record !== null) {
      this.amount = web3.toBigNumber(record.value);
    }

    this.RawTrans = RawTrans;
    this.storemanAddress = this.crossConf.storemanWan;
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
    return new Promise((resolve, reject) => {
      try {
        let getLockedTime;
        if (this.schnorrMpc) {
          getLockedTime = this.chain.getSolInferface(this.contract.abi, this.contractAddr, 'getEconomics');
        } else {
          getLockedTime = this.chain.getSolVar(this.contract.abi, this.contractAddr, 'lockedTime');
        }

        getLockedTime((err, result) => {
          if (!err) {
            this.logger.debug("getLockedTime successfully");
            let lockedTime;
            if (this.schnorrMpc) {
              lockedTime = result[3];
            } else {
              lockedTime = result;
            }
            resolve(Number(lockedTime));
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
  // verify(tokenOrigAccount, xHash, wanAddr, value)
  // inDebtLock(bytes tokenOrigAccount, bytes32 xHash, bytes srcStoremanPK, uint value, bytes dstStoremanPK, bytes r, bytes32 s)
  // verify(tokenOrigAccount, xHash, srcStoremanPK, value)
  async getLockData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[0], "hashX", this.hashKey);
    this.logger.debug('getLockData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'crossAddress-', this.crossAddress, 'Amount-', this.amount);

    // web3.toBigNumber(eosToFloat(this.amount))
    if (this.schnorrMpc) {
      let signData = [encodeAccount(this.crossChain, this.tokenAddr), this.hashKey, this.crossAddress, this.amount];
      let typesArray = ['bytes', 'bytes32', 'address', 'uint'];
      if (this.record.isDebt) {
        typesArray = ['bytes', 'bytes32', 'bytes', 'uint'];
      }
      let internalSignature = await this.internalSignViaMpc(signData, typesArray);
      let params = signData.concat(this.storemanPk, internalSignature.R, internalSignature.S);
      if (this.isLeader) {
        return this.contract.constructData(this.crossFunc[0], ...params);
      } else {
        return null;
      }
    } else if (this.tokenType === 'COIN') {
      return this.contract.constructData(this.crossFunc[0], this.hashKey, this.crossAddress, this.amount);
    } else {
      return this.contract.constructData(this.crossFunc[0], this.tokenAddr, this.hashKey, this.crossAddress, this.amount);
    }
  }

  // ETH: weth2ethRefund(bytes32 x) 
  // ERC20: outboundRedeem(address tokenOrigAddr, bytes32 x) 
  // Schnorr: outSmgRedeem(bytes32 x)
  async getRedeemData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[1], "hashX", this.hashKey);
    this.logger.debug('getRedeemData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'key-', this.key);

    if (this.schnorrMpc) {
      let signData = [this.key];
      // let typesArray = ['bytes32'];
      // let internalSignature = await this.internalSignViaMpc(signData, typesArray);
      // let params = signData.concat(internalSignature.R, internalSignature.S);
      if (this.isLeader) {
        // return this.contract.constructData(this.crossFunc[1], ...params);
        return this.contract.constructData(this.crossFunc[1], ...signData);
      } else {
        return null;
      }
    } else if (this.tokenType === 'COIN') {
      return this.contract.constructData(this.crossFunc[1], this.key);
    } else {
      return this.contract.constructData(this.crossFunc[1], this.tokenAddr, this.key);
    }
  }

  // ETH: eth2wethRevoke(bytes32 xHash) 
  // ERC20: inboundRevoke(address tokenOrigAddr, bytes32 xHash) 
  // Schnorr: inSmgRevoke(bytes32 xHash)
  async getRevokeData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[2], "hashX", this.hashKey);
    this.logger.debug('getRevokeData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey);

    if (this.schnorrMpc) {
      let signData = [this.hashKey];
      // let typesArray = ['bytes32'];
      // let internalSignature = await this.internalSignViaMpc(signData, typesArray);
      if (this.isLeader) {
        // return this.contract.constructData(this.crossFunc[0], signData.concat(internalSignature.R, internalSignature.S));
        return this.contract.constructData(this.crossFunc[2], ...signData);
      } else {
        return null;
      }
    } else if (this.tokenType === 'COIN') {
      return this.contract.constructData(this.crossFunc[2], this.hashKey);
    } else {
      return this.contract.constructData(this.crossFunc[2], this.tokenAddr, this.hashKey);
    }
  }

  // // debt opt
  // // debtOptEnable is needed in moduleConfig
  // // ETH: eth2wethLock(bytes32 xHash, address wanAddr, uint value)   ==> common cross logic
  // // ERC20: inboundLock(address tokenOrigAddr, bytes32 xHash, address wanAddr, uint value)    ==> common cross logic
  // // Schnorr: inDebtLock(bytes tokenOrigAccount, bytes32 xHash, bytes srcStoremanPK, uint value, bytes dstStoremanPK, bytes r, bytes32 s)
  // async getDebtLockData() {
  //   if (this.debtOptEnable) {
  //     this.logger.debug("********************************** funcInterface **********************************", this.debtFunc[0], "hashX", this.hashKey);
  //     this.logger.debug('getDebtLockData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'crossAddress-', this.crossAddress, 'Amount-', this.amount);
  
  //     if (this.schnorrMpc) {
  //       let signData = [encodeAccount(this.crossChain, this.tokenAddr), this.hashKey, this.crossAddress, this.amount];
  //       let typesArray = ['bytes', 'bytes32', 'bytes', 'uint'];
  //       let internalSignature = await this.internalSignViaMpc(signData, typesArray);
  //       let params = signData.concat(this.storemanPk, internalSignature.R, internalSignature.S);
  //       if (this.isLeader) {
  //         return this.contract.constructData(this.debtFunc[0], ...params);
  //       } else {
  //         return null;
  //       }
  //     // } else if (this.tokenType === 'COIN') {
  //     //   return this.contract.constructData(this.crossFunc[0], this.hashKey, this.crossAddress, this.amount);
  //     // } else {
  //     //   return this.contract.constructData(this.crossFunc[0], this.tokenAddr, this.hashKey, this.crossAddress, this.amount);
  //     }
  //   } else {
  //     this.logger.warn("********************************** funcInterface ********************************** getDebtLockData", "hashX", this.hashKey, "debtOptEnable is ", this.debtOptEnable);
  //     this.logger.warn('getDebtLockData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'crossAddress-', this.crossAddress, 'Amount-', this.amount);
  
  //     return null;
  //   }
  // }

  // // ETH: weth2ethRefund(bytes32 x)    ==> common cross logic
  // // ERC20: outboundRedeem(address tokenOrigAddr, bytes32 x)    ==> common cross logic
  // // Schnorr: inDebtRedeem(bytes32 x, bytes r, bytes32 s)
  // async getDebtRedeemData() {
  //   if (this.debtOptEnable) {
  //     this.logger.debug("********************************** funcInterface **********************************", this.debtFunc[1], "hashX", this.hashKey);
  //     this.logger.debug('getDebtRedeemData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'key-', this.key);
  
  //     if (this.schnorrMpc) {
  //       let signData = [this.key];
  //       let typesArray = ['bytes32'];
  //       let internalSignature = await this.internalSignViaMpc(signData, typesArray);
  //       let params = signData.concat(internalSignature.R, internalSignature.S);
  //       if (this.isLeader) {
  //         return this.contract.constructData(this.debtFunc[1], ...params);
  //         // return this.contract.constructData(this.debtFunc[1], ...signData);
  //       } else {
  //         return null;
  //       }
  //     // } else if (this.tokenType === 'COIN') {
  //     //   return this.contract.constructData(this.crossFunc[1], this.key);
  //     // } else {
  //     //   return this.contract.constructData(this.crossFunc[1], this.tokenAddr, this.key);
  //     }
  //   } else {
  //     this.logger.warn("********************************** funcInterface ********************************** getDebtRedeemData", "hashX", this.hashKey, "debtOptEnable is ", this.debtOptEnable);
  //     this.logger.warn('getDebtRedeemData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'key-', this.key);

  //     return null;
  //   }
  // }

  // // ETH: eth2wethRevoke(bytes32 xHash)    ==> common cross logic
  // // ERC20: inboundRevoke(address tokenOrigAddr, bytes32 xHash)    ==> common cross logic
  // // Schnorr: inDebtRevoke(bytes32 xHash)
  // async getDebtRevokeData() {
  //   if (this.debtOptEnable) {
  //     this.logger.debug("********************************** funcInterface **********************************", this.debtFunc[2], "hashX", this.hashKey);
  //     this.logger.debug('getDebtRevokeData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey);
  
  //     if (this.schnorrMpc) {
  //       let signData = [this.hashKey];
  //       // let typesArray = ['bytes32'];
  //       // let internalSignature = await this.internalSignViaMpc(signData, typesArray);
  //       if (this.isLeader) {
  //         // return this.contract.constructData(this.debtFunc[0], signData.concat(internalSignature.R, internalSignature.S));
  //         return this.contract.constructData(this.debtFunc[2], ...signData);
  //       } else {
  //         return null;
  //       }
  //     // } else if (this.tokenType === 'COIN') {
  //     //   return this.contract.constructData(this.crossFunc[2], this.hashKey);
  //     // } else {
  //     //   return this.contract.constructData(this.crossFunc[2], this.tokenAddr, this.hashKey);
  //     }
  //   } else {
  //     this.logger.warn("********************************** funcInterface ********************************** getDebtRevokeData", "hashX", this.hashKey, "debtOptEnable is ", this.debtOptEnable);
  //     this.logger.warn('getDebtRevokeData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey);

  //     return null;
  //   }
  // }

  // withdraw opt
  // debtOptEnable is needed in moduleConfig
  // ETH: 
  // ERC20: 
  // Schnorr: smgWithdrawFee(bytes storemanGroupPK, uint timeStamp, address receiver, bytes r, bytes32 s)
  // verify(&timeStampView, &receiverView)
  async getWithdrawFeeData() {
    if (this.debtOptEnable) {
      this.logger.debug("********************************** funcInterface **********************************", this.withdrawFeeFunc, "hashX", this.hashKey);
      this.logger.debug('getWithdrawFeeData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'crossAddress-', this.crossAddress, 'Amount-', this.amount);
  
      if (this.schnorrMpc) {
        let signData = [this.record.withdrawFeeTime, this.crossAddress];
        let typesArray = ['uint', 'address'];
        let internalSignature = await this.internalSignViaMpc(signData, typesArray);
        let params = [this.storemanPk].concat(signData, internalSignature.R, internalSignature.S);
        if (this.isLeader) {
          return this.contract.constructData(this.withdrawFeeFunc, ...params);
        } else {
          return null;
        }
      // } else if (this.tokenType === 'COIN') {
      //   return this.contract.constructData(this.crossFunc[0], this.hashKey, this.crossAddress, this.amount);
      // } else {
      //   return this.contract.constructData(this.crossFunc[0], this.tokenAddr, this.hashKey, this.crossAddress, this.amount);
      }
    } else {
      this.logger.warn("********************************** funcInterface ********************************** getWithdrawFeeData", "hashX", this.hashKey, "debtOptEnable is ", this.debtOptEnable);
      this.logger.warn('getWithdrawFeeData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'crossAddress-', this.crossAddress, 'Amount-', this.amount);
  
      return null;
    }
  }

  getDecodeEventTokenAddr(decodeEvent) {
    if (this.tokenType === 'COIN') {
      return '0x';
    } else {
      let tokenOrigParam;
      if (decodeEvent.args.hasOwnProperty('tokenOrigAccount')) {
        tokenOrigParam = 'tokenOrigAccount';
      } else if (decodeEvent.args.hasOwnProperty('tokenOrigAddr')) {
        tokenOrigParam = 'tokenOrigAddr';
      }
      return decodeAccount(this.crossChain, decodeEvent.args[tokenOrigParam]);
    }
  }

  getDecodeEventStoremanGroup(decodeEvent) {
    if (this.schnorrMpc) {
      if (decodeEvent.event === this.debtEvent[0]) {
        return decodeEvent.args.dstStoremanPK;
      } else {
        return decodeEvent.args.storemanGroupPK;
      }
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
    // let encodeResult = coder.encodeParams(typesArray, signData);
    // if (encodeResult.indexOf('0x') === 0) {
    //   return encodeResult;
    // } else {
    //   return '0x' + encodeResult;
    // }
    return hexAdd0x(coder.encodeParams(typesArray, signData));
  }

  decode(signData, typesArray) {
    this.logger.debug("********************************** decode signData **********************************", signData, "hashX:", this.hashKey);

    let coder = require("web3/lib/solidity/coder");
    return coder.decodeParams(typesArray, hexTrip0x(signData));
  }

  // only follower with decodeSignatureData to create debtlock
  decodeSignatureData(signData) {
    // signData extern should be "cross:debt:EOS:tokenType:EOS"  /"cross:withdraw:EOS:tokenType:EOS"  /"cross:withdraw:EOS:tokenType:WAN"  / "cross:normal:EOS:tokenType:EOS" /"cross:normal:EOS:tokenType:WAN"
    let content = null;
    let extern = signData.Extern.split(':');
    let hashX = extern[5];
    this.hashKey = hashX;
    let data = this.decode(signData.data, ['uint', 'address']);
    if (extern[1] === this.withdrawFeeFunc && global.argv.wanReceiver) {
      // Schnorr: smgWithdrawFee(bytes storemanGroupPK, uint timeStamp, address receiver, bytes r, bytes32 s)
      // verify(&timeStampView, &receiverView)
      let timestamp = data[0];
      let receiver;
      // receiver = data[1];
      receiver = global.argv.wanReceiver;
      let tokenAddr = Object.keys(global.config["crossTokens"][this.crossChain].TOKEN)[0]; // Wan only have the 'wan' fee, so random set the tokenAddr to pass the db filter

      content = this.createWithdrawFeeData(this.transChainType.toUpperCase(), this.crossChain, this.tokenType, tokenAddr, receiver, timestamp, hashX);
    }
    return content;
  }
}
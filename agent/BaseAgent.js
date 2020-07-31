"use strict"

const {
  loadConfig,
  getGlobalChain,
  generateKey,
  sha256,
  sleep
} = require('comm/lib');

const moduleConfig = require('conf/moduleConfig.js');
// const config = loadConfig();

let Contract = require("contract/Contract.js");

let MPC = require("mpc/mpc.js");
let SchnorrMPC = require("mpc/schnorrMpc.js");
let schnorrTool = require('utils/schnorr/tools.js');
module.exports = class BaseAgent {
  constructor(crossChain, tokenType, record = null) {
    this.logger = global.monitorLogger;
    this.config = global.config;
    this.crossChain = crossChain;
    this.tokenType = tokenType;
    this.crossConf = this.config.crossTokens[crossChain].CONF;
    this.crossTokens = this.config.crossTokens[crossChain].TOKEN;
    // this.isLeader = this.config.isLeader;
    this.isLeader = global.isLeader ? true : false

    this.schnorrMpc = moduleConfig.crossInfoDict[crossChain].CONF.schnorrMpc;
    if (this.schnorrMpc) {
      this.storemanPk = this.crossConf.storemanPk;
    }
    this.mpcSignature = moduleConfig.mpcSignature;
    this.secureLockIntervalRatio = moduleConfig.secureLockIntervalRatio;

    let crossInfoInst = moduleConfig.crossInfoDict[crossChain][tokenType];
    this.crossInfoInst = crossInfoInst;
    this.getContractInfo();

    this.transChainType = this.getChainType();
    this.transChainNonceless = moduleConfig.crossInfoDict[this.transChainType.toUpperCase()] ? moduleConfig.crossInfoDict[this.transChainType.toUpperCase()].CONF.nonceless : false;
    this.chain = getGlobalChain(this.transChainType);
    this.storemanAddress = this.crossConf.storemanOri;

    this.depositEvent = crossInfoInst.depositEvent;
    this.withdrawEvent = crossInfoInst.withdrawEvent;

    if (this.mpcSignature) {
      this.mpcSignData = {};
    }

    this.record = record;
    this.isDebt = false; // init
    this.isDebtor = false;
    this.isFee = false;
    if (record !== null) {
      this.hashKey = record.hashX;
      if (record.x !== '0x') {
        this.key = record.x;
      }

      // this.crossDirection = crossDirection; /* 0 -- token to Wtoken, 1 -- Wtoken to token */
      this.crossDirection = this.record.direction;
      this.crossFunc = (this.crossDirection === 0) ? crossInfoInst.depositFunc : crossInfoInst.withdrawFunc;

      this.hashKey = record.hashX;
      this.amount = record.value;
      this.crossAddress = record.crossAddress;

      this.tokenAddr = record.tokenAddr;
      this.tokenSymbol = record.tokenSymbol;
      this.decimals = record.decimals;

      let tokenAbi = moduleConfig.tokenAbi;
      this.tokenContract = new Contract(tokenAbi, this.tokenAddr);
    }

    this.debtOptEnable = moduleConfig.crossInfoDict[crossChain].CONF.debtOptEnable;

    this.debtFunc = crossInfoInst.debtFunc;
    this.debtEvent = crossInfoInst.debtEvent;

    if (this.debtOptEnable && (record !== null) && record.isDebt) {
      this.isDebt = record.isDebt;
      this.crossFunc = this.debtFunc;
      if ([this.crossConf.storemanOri, this.crossConf.storemanPk, this.crossConf.storemanWan].indexOf(record.storeman) !== -1) {
        this.isDebtor = true;
      }
    }

    this.withdrawFeeFunc = crossInfoInst.withdrawFeeFunc;
    this.withdrawFeeEvent = crossInfoInst.withdrawFeeEvent;

    if (this.debtOptEnable && (record !== null) && record.isFee) {
      this.isFee = record.isFee;
    }
  }

  setModelOps(modelOps) {
    this.modelOps = modelOps;
  }

  setKey(key) {
    this.key = key;
  }
  setHashKey(hashKey) {
    this.hashKey = hashKey;
  }

  getChainPassword() {
    return global.secret[this.transChainType.toUpperCase() + '_PWD'];
  }

  getChainType() {
    return this.crossChain.toLowerCase();
  }

  encodeValue(value, decimals) {
    return value;
  }

  getContractInfo() {
    let abi = this.crossInfoInst.originalChainHtlcAbi;
    this.contractAddr = this.crossInfoInst.originalChainHtlcAddr;
    if (this.contractAddr) {
      this.contract = new Contract(abi, this.contractAddr);
    } else {
      this.contract = null;
    }
  }

  getNonce(action) {
    if (!this.isLeader) {
      return 0;
    }
    return new Promise(async (resolve, reject) => {
      let nonce = 0;
      let nonceOnChain = 0;
      let chainNonce = this.transChainType + 'LastNonce';
      let nonceRenew = this.transChainType + 'NonceRenew';
      let noncePending = this.transChainType + 'NoncePending';
      let usedNonce = this.transChainType + 'UsedNonce';
      let storemanAddress = this.storemanAddress;
      this.logger.debug("getNonce begin!", storemanAddress)

      try {
        let chainMutex = this.transChainType + 'Mutex';
        while (global[chainMutex][storemanAddress]) {
          await sleep(3);
        }
        this.logger.debug(chainMutex, storemanAddress, "mutexNonce true");
        this.logger.debug(storemanAddress, 'getNonce:', chainNonce, global[chainNonce][storemanAddress],
          nonceRenew, global[nonceRenew][storemanAddress], noncePending, global[noncePending][storemanAddress],
          usedNonce, Object.keys(global[usedNonce][storemanAddress]),
          "transNonceRenew", global.nonce[this.hashKey + 'NonceRenew'], "transNoncePending", global.nonce[this.hashKey + 'NoncePending'],
          "at hashX: ", this.hashKey, "while current nonce is", global.nonce[this.hashKey + action], 'for action', action);
        global[chainMutex][storemanAddress] = true;

        // when a trans failed time exceed the retry times, the nonce will be released
        let pendingNonce = Array.from(global[noncePending][storemanAddress]).sort();
        if (!global.nonce[this.hashKey + action]) {
          if (pendingNonce.length > 0) {
            nonce = pendingNonce[0];
          } else if (global[nonceRenew][storemanAddress]) {
            nonceOnChain = await this.chain.getNonceSync(storemanAddress);
            nonce = parseInt(nonceOnChain, 16);

            global[nonceRenew][storemanAddress] = false;
            // this will happened when agent restart, some trans start statemachine with state confirming, and failed ant then retry, 
            // nonceRenew will be set true, new trans will get the hole nonce unless this nonce was already taken by others
            if (global[usedNonce][storemanAddress].hasOwnProperty(nonce) &&
              global.nonce[global[usedNonce][storemanAddress][nonce].hashX + global[usedNonce][storemanAddress][nonce].action] === nonce) {
              nonce = global[chainNonce][storemanAddress];
              this.logger.warn("getNonce reset NonceRenew false at new trans with hashX: ", this.hashKey, "while renew nonce is", nonce);
            } else {
              this.logger.warn("getNonce reset NonceRenew false at new trans with hashX: ", this.hashKey,
              "to replace the old hashX: ", global[usedNonce][storemanAddress][nonce].hashX, "while the used nonce is", nonce);
            }
            delete global.nonce[this.hashKey + 'NonceRenew'];
          } else {
            nonce = global[chainNonce][storemanAddress];
          }
        } else {
          if (global.nonce[this.hashKey + 'NonceRenew'] && global[nonceRenew][storemanAddress]) {
            nonceOnChain = await this.chain.getNonceSync(storemanAddress);
            nonce = parseInt(nonceOnChain, 16);
            global[nonceRenew][storemanAddress] = false;
            if (global[usedNonce][storemanAddress].hasOwnProperty(nonce) &&
            global.nonce[global[usedNonce][storemanAddress][nonce].hashX + global[usedNonce][storemanAddress][nonce].action] === nonce) {
              nonce = global.nonce[this.hashKey + action];
            }
            this.logger.warn("getNonce reset NonceRenew false at hashX: ", this.hashKey, "oldNonce is ", global.nonce[this.hashKey + action], "while renew nonce is", nonce);
            delete global.nonce[this.hashKey + 'NonceRenew'];
          } else if (global.nonce[this.hashKey + 'NoncePending']) {
            // the trans may failed because mpc failed/ underprice/ lower nonce
            nonceOnChain = await this.chain.getNonceIncludePendingSync(storemanAddress);
            nonce = parseInt(nonceOnChain, 16);
            // to avoid lower nonce issue, if it's lower nonce, update nonce
            nonce = Math.max(nonce, global.nonce[this.hashKey + action]);
            if (global[usedNonce][storemanAddress].hasOwnProperty(nonce) &&
            global.nonce[global[usedNonce][storemanAddress][nonce].hashX + global[usedNonce][storemanAddress][nonce].action] === nonce) {
              nonce = global.nonce[this.hashKey + action];
            }
            // if (nonce !== global.nonce[this.hashKey + action]) {
              this.logger.warn("getNonce reset NoncePending false at hashX: ", this.hashKey, "oldNonce is ", global.nonce[this.hashKey + action], "while renew nonce is", nonce);
            // }
            delete global.nonce[this.hashKey + 'NoncePending'];
          } else {
            // this will happen, a new trans begin when some trans try to renew, the new trans will use the hole-nonce
            if (pendingNonce.length > 0) {
              nonce = pendingNonce[0];
              nonce = Math.min(nonce, global.nonce[this.hashKey + action]);
            } else {
              nonce = global.nonce[this.hashKey + action];
            }
          }
        }

        if (nonceOnChain && Object.keys(global[usedNonce][storemanAddress]).length !== 0) {
          for (let key of Object.keys(global[usedNonce][storemanAddress])) {
            if (key < parseInt(nonceOnChain, 16)) {
              delete global[usedNonce][storemanAddress][key];
            }
          }
        }

        // reset gasprice to 110% to cover the queue trans, to avoid underprice issue
        if (global[usedNonce][storemanAddress].hasOwnProperty(nonce)
        && global[usedNonce][storemanAddress][nonce].hashX !== this.hashKey) {
          let gasPrice = parseInt(this.trans.txParams.gasPrice, 16);
          let gasAddDelta = this.chain.client.toBigNumber(global[usedNonce][storemanAddress][nonce].gasPrice).mul(110).div(100);
          gasPrice = Math.max(gasPrice, gasAddDelta);

          this.logger.warn("getNonce reset gasprice for usedNonce", nonce, "at hashX: ", this.hashKey,
          "to replace the old hashX: ", global[usedNonce][storemanAddress][nonce].hashX,
          "oldGasPrice is ", parseInt(this.trans.txParams.gasPrice, 16),
          "while renew gasPrice is", gasPrice);
          this.trans.setGasPrice(gasPrice);
        }

        global.nonce[this.hashKey + action] = nonce;
        this.logger.debug("getNonce success at hashX: ", this.hashKey, "while nonce is", nonce, 'for action', action);
        // usedNonce is used to avoid underprice issue
        global[usedNonce][storemanAddress][nonce] = {
          'hashX': this.hashKey,
          'action': action,
          'gasPrice': this.trans.txParams.gasPrice
        }

        // released nonce need to be delete after it's been used
        if (global[noncePending][storemanAddress].has(nonce)) {
          this.logger.warn("getNonce reset noncePending pool ", storemanAddress, "to release the nonce", nonce, "to hashX: ", this.hashKey);
          global[noncePending][storemanAddress].delete(nonce);
        }
        if (nonce >= global[chainNonce][storemanAddress]) {
          global[chainNonce][storemanAddress] = nonce;
          global[chainNonce][storemanAddress]++;
        }

        this.logger.debug(chainMutex, storemanAddress, "mutexNonce false");
        global[chainMutex][storemanAddress] = false;
        resolve(nonce);
      } catch (err) {
        this.logger.error("getNonce failed", storemanAddress, err);
        this.logger.debug(chainMutex, storemanAddress, "mutexNonce false");
        global[chainMutex][storemanAddress] = false;
        reject(err);
      }
    });
  }

  async initAgentTransInfo(action) {
    if (action !== null) {
      let transInfo = await this.getTransInfo(action);
      this.trans = new this.RawTrans(...transInfo);
    }
  }

  async createTrans(action) {
    let nonceFlag = false;
    return new Promise(async (resolve, reject) => {
      try {
        if (action === 'approveZero') {
          this.data = await this.getApproveData();
          this.build = this.buildApproveZeroData;
        } else if (action === 'approve') {
          this.data = await this.getApproveData();
          this.build = this.buildApproveData;
        } else if (action === 'lock') {
          this.data = await this.getLockData();
          this.build = this.buildLockData;
        } else if (action === 'redeem') {
          this.data = await this.getRedeemData();
          this.build = this.buildRedeemData;
        } else if (action === 'revoke') {
          this.data = await this.getRevokeData();
          this.build = this.buildRevokeData;
        } else if (action === 'withdrawFee') {
          this.data = await this.getWithdrawFeeData();
          this.build = this.buildWithdrawFeeData;
        }

        if (!this.transChainNonceless) {
          let nonce = await this.getNonce(action);
          nonceFlag = true;
          this.trans.setNonce(nonce);
          this.logger.info("********************************** setNonce **********************************", nonce, "hashX", this.hashKey);
        }
        this.logger.info("********************************** setData **********************************", JSON.stringify(this.data, null, 4), "hashX", this.hashKey);
        this.trans.setData(this.data);
        if (this.tokenType === 'COIN' && this.crossDirection === 1 && action === 'lock'){
          this.logger.info("********************************** setValue **********************************", this.amount.toString(16), "hashX", this.hashKey);
          this.trans.setValue(this.amount.toString(16));
        } else {
          this.logger.info("********************************** setValue **********************************", 0, "hashX", this.hashKey);
          this.trans.setValue(0);
        }
        resolve();
      } catch (err) {
        if (!this.transChainNonceless && nonceFlag) {
          global.nonce[this.hashKey + 'NoncePending'] = true;
          this.logger.warn("createTrans failed, set NoncePending true", this.hashKey, err);
        }
        reject("createTrans: " + err);
      }
    })
  }

  sendTransSync() { 
    return new Promise((resolve, reject) => {
      this.sendTrans((err, result) => {
        if (!err && result !== null) {
          resolve(result);
        } else {
          if (!this.transChainNonceless) {
            global.nonce[this.hashKey + 'NoncePending'] = true;
            this.logger.warn("sendTransSync failed, set NoncePending true", this.hashKey, err);
          }
          reject(err);
        }
      });
    });
  }

  async sendTrans(callback) {
    this.logger.info("********************************** sendTransaction ********************************** hashX", this.hashKey);
    let self = this;
    try {
      let rawTx;
      if (this.isLeader) {
        let chainId = await this.chain.getNetworkId();
        if(this.mpcSignature && !this.schnorrMpc) {
          let mpc = new MPC();
          mpc.setHashX(this.hashKey);
          mpc.setTx(this.trans.txParams, this.chain.chainType, chainId);

          rawTx = await mpc.signViaMpc();
          this.logger.info("********************************** sendTransaction signViaMpc ********************************** hashX", this.hashKey, rawTx);
        } else {
          this.logger.info("********************************** sendTransaction get signature ********************************** hashX", this.hashKey, this.trans);
          rawTx = await this.signTrans();
          this.logger.info("********************************** sendTransaction get signature successfully ********************************** hashX", this.hashKey, rawTx);
        }

        let result = await this.chain.sendRawTransactionSync(rawTx);
        self.logger.info("sendRawTransactionSync result: hashX, result: ", self.hashKey, result);
        self.logger.info("********************************** sendTransaction success ********************************** hashX", self.hashKey);
        let content = self.build(self.hashKey, result);
        callback(null, content);

        // this.chain.sendRawTransaction(rawTx, (err, result) => {
        //   if (!err) {
        //     self.logger.debug("sendRawTransaction result: hashX, result: ", self.hashKey, result);
        //     self.logger.debug("********************************** sendTransaction success ********************************** hashX", self.hashKey);
        //     let content = self.build(self.hashKey, result);
        //     callback(err, content);
        //   } else {
        //     self.logger.error("********************************** sendTransaction failed ********************************** hashX", self.hashKey, err);
        //     callback(err, result);
        //   }
        // });
      }
    } catch (err) {
      this.logger.error("********************************** sendTransaction failed ********************************** hashX", this.hashKey, err);
      callback(err, null);
    }
  }

  validateTrans() {
    this.logger.info("********************************** validateTrans ********************************** hashX", this.hashKey);
    return new Promise(async (resolve, reject) => {
      try {
        let chainId = await this.chain.getNetworkId();
        let mpc = new MPC();
        mpc.setHashX(this.hashKey);
        mpc.setTx(this.trans.txParams, this.chain.chainType, chainId);

        await mpc.addValidMpcTx();
        resolve();
      } catch (err) {
        this.logger.error("********************************** validateTrans failed ********************************** hashX", this.hashKey, err);
        reject(err);
      }
    });
  }

  internalSignViaMpc(signData, typesArray) {
    return new Promise(async (resolve, reject) => {
      if (this.mpcSignature && this.schnorrMpc) {
        try {
          this.logger.info("********************************** internalSignViaMpc ********************************** hashX", this.hashKey, signData, typesArray);
          this.mpcSignData = this.encode(signData, typesArray);
          let internalSignature;
          if (this.isLeader) {
            internalSignature = await this.getInternalSign(this.mpcSignData);
            // this.mpcSignData = this.mpcSignData.push(internalSignature.R, internalSignature.s);
          } else {
            if ((this.isDebt && this.record.storeman !== this.storemanPk) || this.isFee) {
              internalSignature = await this.approveInternalSign(this.mpcSignData);
            } else {
              internalSignature = await this.validateInternalSign(this.mpcSignData);
            }
          }
          resolve(internalSignature);
        } catch (err) {
          reject(err);
        }
      } else {
        resolve(signData);
      }
    })
  }

  getInternalSign(mpcSignData) {
    return new Promise(async (resolve, reject) => {
      try {
        this.logger.info("********************************** getInternalSign Via Mpc ********************************** hashX", this.hashKey, mpcSignData);
        // let mpc = new SchnorrMPC(mpcSignData, this.storemanPk, this.hashKey);
        let mpc = new SchnorrMPC();
        mpc.setHashX(this.hashKey);
        let extern;
        if (this.isDebt) {
          extern = "cross:" + this.debtFunc[0] + ":" + this.crossChain + ":" + this.tokenType + ":" + this.transChainType.toUpperCase() + ":" + this.hashKey;
        } else if (this.isFee) {
          extern = "cross:" + this.withdrawFeeFunc + ":" + this.crossChain + ":" + this.tokenType + ":" + this.transChainType.toUpperCase() + ":" + this.hashKey;
        } else {
          extern = "cross:normal:" + this.crossChain + ":" + this.tokenType + ":" + this.transChainType.toUpperCase() + ":" + this.hashKey;
        }
        mpc.setSignData(this.storemanPk, mpcSignData, extern);

        // internalSignature is a object, {R:, S:}
        let internalSignature
        if ((this.isDebt && this.record.storeman !== this.storemanPk) || this.isFee) {
          internalSignature = await mpc.signDataByApprove();
        } else {
          internalSignature = await mpc.signViaMpc();
        }
        this.logger.info("********************************** getInternalSign Via Mpc Success********************************** hashX", this.hashKey, internalSignature);
        resolve(internalSignature);
      } catch (err) {
        this.logger.error("********************************** getInternalSign Via Mpc failed ********************************** hashX", this.hashKey, err);
        reject(err);
      }
    });
  }

  validateInternalSign(mpcSignData) {
    return new Promise(async (resolve, reject) => {
      try {
        this.logger.info("********************************** validateInternalSign Via Mpc ********************************** hashX", this.hashKey, mpcSignData);
        // let mpc = new SchnorrMPC(mpcSignData, this.storemanPk, this.hashKey);
        let mpc = new SchnorrMPC();
        mpc.setHashX(this.hashKey);
        let extern;
        if (this.isDebt) {
          extern = "cross:" + this.debtFunc[0] + ":" + this.crossChain + ":" + this.tokenType + ":" + this.transChainType.toUpperCase() + ":" + this.hashKey;
        } else if (this.isFee) {
          extern = "cross:" + this.withdrawFeeFunc + ":" + this.crossChain + ":" + this.tokenType + ":" + this.transChainType.toUpperCase() + ":" + this.hashKey;
        } else {
          extern = "cross:normal:" + this.crossChain + ":" + this.tokenType + ":" + this.transChainType.toUpperCase() + ":" + this.hashKey;
        }
        mpc.setSignData(this.storemanPk, mpcSignData, extern);

        let internalSignature = await mpc.addValidDataViaMpc();
        this.logger.info("********************************** validateInternalSign Via Mpc Success********************************** hashX", this.hashKey, internalSignature);
        resolve({
          R: null,
          s: null
        });
      } catch (err) {
        if (err.hasOwnProperty("message") && (err.message === "has in approved db")) {
          this.logger.error("********************************** validateInternalSign Via Mpc failed ********************************** hashX", this.hashKey, err);
          resolve({
            R: null,
            s: null
          });
        } else {
          this.logger.error("********************************** validateInternalSign Via Mpc failed ********************************** hashX", this.hashKey, err);
          reject(err);
        }
      }
    });
  }

  approveInternalSign(mpcSignData) {
    return new Promise(async (resolve, reject) => {
      try {
        this.logger.info("********************************** approveInternalSign Via Mpc ********************************** hashX", this.hashKey, mpcSignData);
        let mpc = new SchnorrMPC();
        mpc.setHashX(this.hashKey);
        let extern;
        if (this.isDebt) {
          extern = "cross:" + this.debtFunc[0] + ":" + this.crossChain + ":" + this.tokenType + ":" + this.transChainType.toUpperCase() + ":" + this.hashKey;
        } else if (this.isFee) {
          extern = "cross:" + this.withdrawFeeFunc + ":" + this.crossChain + ":" + this.tokenType + ":" + this.transChainType.toUpperCase() + ":" + this.hashKey;
        } else {
          extern = "cross:normal:" + this.crossChain + ":" + this.tokenType + ":" + this.transChainType.toUpperCase() + ":" + this.hashKey;
        }
        mpc.setSignData(this.storemanPk, mpcSignData, extern);

        let internalSignature = await mpc.approveData();
        this.logger.info("********************************** approveInternalSign Via Mpc Success********************************** hashX", this.hashKey, internalSignature);
        resolve({
          R: null,
          s: null
        });
      } catch (err) {
        this.logger.error("********************************** approveInternalSign Via Mpc failed ********************************** hashX", this.hashKey, err);
        reject(err);
      }
    });
  }

  verifyInternalSign(signData, typesArray, internalSignature) {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.mpcSignature && this.schnorrMpc && this.isLeader) {
          this.logger.info("********************************** verifyInternalSign ********************************** hashX", this.hashKey, signData, typesArray);
          this.mpcSignData = this.encode(signData, typesArray);

          let signCheck = await schnorrTool.verifySig(internalSignature.R, internalSignature.S, this.mpcSignData, this.storemanPk);
          if (!signCheck) {
            this.logger.error("********************************** verifyInternalSign failed ********************************** hashX", this.hashKey, ", internalSignature:", internalSignature, ", mpcSignData:", this.mpcSignData);
            reject('verifySig fail');
          } else {
            this.logger.info("********************************** verifyInternalSign Success********************************** hashX", this.hashKey, ", internalSignature:", internalSignature, ", mpcSignData:", this.mpcSignData);
            resolve(signCheck);
          }
        } else {
          resolve();
        }
      } catch (err) {
        this.logger.error("********************************** verifyInternalSign failed ********************************** hashX", this.hashKey, err);
        reject(err);
      }
    });
  }

  signTrans() {
    return new Promise((resolve, reject) => {
      try {
        let password = this.getChainPassword();
        let rawTx = this.trans.signFromKeystore(password);
        resolve(rawTx);
      } catch (err) {
        this.logger.error("********************************** signTrans failed ********************************** hashX", this.hashKey);
        reject(err);
      }
    });
  }

  createDebtData(chainType, crossChain, tokenType, tokenAddr, debtor, debt, hashKey) {
    let x = "";
    let hashX;
    if (!hashKey) {
      x = generateKey();
      hashX = sha256(x);
    } else {
      // debtredeem donot need schnorr, only leader own the x
      hashX = hashKey;
    }

    this.logger.debug("********************************** createDebtData ********************************** hashX", hashX, 
    "at chain ", chainType, " about crossChain ", crossChain, " about tokenType ", tokenType, " tokenAddr ", tokenAddr, " with debtor is ", debtor, " and debt ", debt);

    let content = {
      x: x,
      hashX: hashX,
      direction: 0,
      crossChain: crossChain,
      tokenType: tokenType,
      tokenAddr: tokenAddr,
      tokenSymbol: this.crossTokens[tokenAddr].tokenSymbol,
      decimals: this.crossTokens[tokenAddr].decimals,
      originChain: chainType,
      from: this.storemanAddress,
      crossAddress: this.storemanPk,
      storeman: debtor,
      toHtlcAddr: this.contractAddr,
      value: this.encodeValue(debt, this.crossTokens[tokenAddr].decimals),
      isDebt: true
    };

    return [hashX, content];
  }

  createWithdrawFeeData(chainType, crossChain, tokenType, tokenAddr, receiver, timestamp, hashKey) {
    let x = "";
    let hashX;
    if (!hashKey) {
      x = generateKey();
      hashX = sha256(x);
    } else {
      // Withdraw donot need x confirm, only leader own the x
      hashX = hashKey;
    }

    this.logger.debug("********************************** createWithdrawFeeData ********************************** hashX", hashX, 
    "at chain ", chainType, " about crossChain ", crossChain, " about tokenType ", tokenType, " tokenAddr ", tokenAddr, " with receiver is ", receiver, " and timestamp ", timestamp);

    let content = {
      x: x,
      hashX: hashX,
      crossChain: crossChain,
      tokenType: tokenType,
      tokenAddr: tokenAddr,
      originChain: chainType,
      crossAddress: receiver,
      withdrawFeeTime: timestamp,
      storeman: this.storemanPk,
      toHtlcAddr: this.contractAddr,
      isFee: true
    };

    if (tokenAddr) {
      content.tokenSymbol = this.crossTokens[tokenAddr].tokenSymbol;
      content.decimals = this.crossTokens[tokenAddr].decimals;
    }

    return [hashX, content];
  }

  getApproveData() {
    this.logger.debug("********************************** funcInterface **********************************", this.approveFunc);
    return this.tokenContract.constructData(this.approveFunc, this.contractAddr, this.amount);
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
    let txHashName = (this.isDebt && !this.isDebtor) ? "walletLockTxHash" : "storemanLockTxHash";
    this.logger.debug("********************************** insertLockData trans **********************************", txHashName, hashKey);

    let content = {};
    content[txHashName] = (Array.isArray(this.record[txHashName])) ? [...this.record[txHashName]] : [this.record[txHashName]]

    content[txHashName].push(result.toLowerCase());
    return content;
  }

  buildRedeemData(hashKey, result) {
    let txHashName = (this.isDebt && !this.isDebtor) ? "walletRedeemTxHash" : "storemanRedeemTxHash";
    this.logger.debug("********************************** insertRedeemData trans **********************************", txHashName, hashKey);

    let content = {};
    content[txHashName] = (Array.isArray(this.record[txHashName])) ? [...this.record[txHashName]] : [this.record[txHashName]]

    content[txHashName].push(result.toLowerCase());
    return content;
  }

  buildRevokeData(hashKey, result) {
    let txHashName = (this.isDebt && !this.isDebtor) ? "walletRevokeTxHash" : "storemanRevokeTxHash";
    this.logger.debug("********************************** insertRevokeData trans **********************************", txHashName, hashKey);

    let content = {};
    content[txHashName] = (Array.isArray(this.record[txHashName])) ? [...this.record[txHashName]] : [this.record[txHashName]]

    content[txHashName].push(result.toLowerCase());
    return content;
  }

  buildWithdrawFeeData(hashKey, result) {
    let txHashName = "withdrawFeeTxHash";
    this.logger.debug("********************************** insertWithdrawFeeData trans **********************************", txHashName, hashKey);

    let content = {};
    content[txHashName] = (Array.isArray(this.record[txHashName])) ? [...this.record[txHashName]] : [this.record[txHashName]]

    content[txHashName].push(result.toLowerCase());
    return content;
  }

  getDecodeCrossAddress(decodeEvent) {
    return decodeEvent.args.wanAddr;
  }

  getDecodeCrossHashX(args) {
    if (!args.xHash && args.x) {
      args.xHash = sha256(args.x);
      return args;
    } else {
      return args;
    }
  }

  async getDecodeEventDbData(chainType, crossChain, tokenType, decodeEvent, event, lockedTime) {
    let content = {};
    let args = this.getDecodeCrossHashX(decodeEvent.args);
    let eventName = decodeEvent.event;

    if (global.argv.leader && eventName === this.withdrawFeeEvent) {
      this.logger.debug("********************************** 7: found storeman withdrawFee transaction ********************************** on Chain:", chainType, " isDebt:", this.isDebt);
      content = {
        withdrawFeeEvent: event
      };
      return [event.transactionHash, content];
    }

    if (!args.xHash) {
      this.logger.debug("********************************** getDecodeEventDbData ********************************** hashX not included", " on Chain:", chainType, " isDebt:", this.isDebt, "transactionHash is", decodeEvent.transactionHash);
      return null;
    }

    let hashX = args.xHash;
    let storeman;

    let option = {
      hashX : hashX
    };
    let recordInDb = await this.modelOps.getEventHistory(option);

    try {
      //Event: wallet revoke(in/out), [ schnorr: wallet redeem(out), storeman redeem(in/out), storeman revoke(in) ]don't have storeman
      if (!((eventName === this.depositEvent[2] && chainType !== 'WAN') ||
        (eventName === this.withdrawEvent[2] && chainType === 'WAN') ||
        (eventName === this.withdrawEvent[1] && this.schnorrMpc) ||
        (eventName === this.withdrawEvent[2] && this.schnorrMpc) ||
        (eventName === this.depositEvent[1] && chainType !== 'WAN' && this.schnorrMpc) ||
        (eventName === this.debtEvent[1] && chainType !== 'WAN' && this.schnorrMpc) ||
        (eventName === this.debtEvent[2] && chainType !== 'WAN' && this.schnorrMpc))) {
        storeman = this.getDecodeEventStoremanGroup(decodeEvent);

        if([this.crossConf.storemanOri, this.crossConf.storemanPk, this.crossConf.storemanWan].indexOf(storeman) === -1 && !global.argv.doDebt) {
          this.logger.debug("********************************** getDecodeEventDbData ********************************** storeman not included, hashX", hashX, " on Chain:", chainType, " isDebt:", this.isDebt, "transactionHash is", decodeEvent.transactionHash);
          return null;
        }
      }
      if ((eventName === this.depositEvent[0] && chainType !== 'WAN') ||
        (eventName === this.withdrawEvent[0] && chainType === 'WAN') ||
        (eventName === this.debtEvent[0] && chainType !== 'WAN')) {
        let tokenAddr = this.getDecodeEventTokenAddr(decodeEvent);
        if (!this.crossTokens.hasOwnProperty(tokenAddr)) {
          this.logger.debug("********************************** getDecodeEventDbData ********************************** tokenAddr not included, hashX", hashX, " on Chain:", chainType, " isDebt:", this.isDebt, "transactionHash is", decodeEvent.transactionHash);
          return null;
        };
        content = {
          hashX: hashX,
          direction: (chainType !== 'WAN') ? 0 : 1,
          crossChain: crossChain,
          tokenType: tokenType,
          tokenAddr: tokenAddr,
          tokenSymbol: this.crossTokens[tokenAddr].tokenSymbol,
          decimals: this.crossTokens[tokenAddr].decimals,
          originChain: chainType,
          from: this.getDecodeFromAddress(decodeEvent),
          crossAddress: this.getDecodeCrossAddress(decodeEvent),
          toHtlcAddr: this.getDecodeEventToHtlcAddr(decodeEvent),
          storeman: storeman,
          value: this.getDecodeEventValue(decodeEvent),
          blockNumber: decodeEvent.blockNumber,
          timestamp: decodeEvent.timestamp * 1000,
          lockedTime: lockedTime * 1000,
          suspendTime: (1000 * (lockedTime - lockedTime / moduleConfig.secureLockIntervalRatio) + Number(decodeEvent.timestamp) * 1000).toString(),
          HTLCtime: (1000 * 2 * lockedTime + Number(decodeEvent.timestamp) * 1000).toString(),
          walletLockEvent: event
        };
        if (eventName === this.debtEvent[0]) {
          content.isDebt = true;
          this.isDebt = true;
        }
        if (recordInDb.length === 0 || recordInDb[0].walletLockEvent.length === 0) {
          this.logger.debug("********************************** 1: found new wallet lock transaction ********************************** hashX", hashX, " on Chain:", chainType, " isDebt:", this.isDebt);
        }
      } else if ((eventName === this.depositEvent[0] && chainType === 'WAN') ||
        (eventName === this.withdrawEvent[0] && chainType !== 'WAN') ||
        (eventName === this.debtEvent[0] && chainType === 'WAN')) {
          if (recordInDb.length === 0 || recordInDb[0].storemanLockEvent.length === 0) {
            this.logger.debug("********************************** 2: found storeman lock transaction ********************************** hashX", hashX, " on Chain:", chainType, " isDebt:", this.isDebt);
          }
        content = {
          storemanLockEvent: event
        };
      } else if ((eventName === this.depositEvent[1] && chainType === 'WAN') ||
        (eventName === this.withdrawEvent[1] && chainType !== 'WAN') ||
        (eventName === this.debtEvent[1] && chainType === 'WAN')) {
          if (recordInDb.length === 0 || recordInDb[0].walletRedeemEvent.length === 0) {
            this.logger.debug("********************************** 3: found wallet redeem transaction ********************************** hashX", hashX, " on Chain:", chainType, " isDebt:", this.isDebt);
          }
        content = {
          x: args.x,
          walletRedeemEvent: event
        };
      } else if ((eventName === this.depositEvent[1] && chainType !== 'WAN') ||
        (eventName === this.withdrawEvent[1] && chainType === 'WAN') ||
        (eventName === this.debtEvent[1] && chainType !== 'WAN')) {
          if (recordInDb.length === 0 || recordInDb[0].storemanRedeemEvent.length === 0) {
            this.logger.debug("********************************** 4: found storeman redeem transaction ********************************** hashX", hashX, " on Chain:", chainType, " isDebt:", this.isDebt);
          }
        content = {
          storemanRedeemEvent: event
        };
      } else if ((eventName === this.depositEvent[2] && chainType !== 'WAN') ||
        (eventName === this.withdrawEvent[2] && chainType === 'WAN') ||
        (eventName === this.debtEvent[2] && chainType !== 'WAN')) {
          if (recordInDb.length === 0 || recordInDb[0].walletRevokeEvent.length === 0) {
            this.logger.debug("********************************** 5: found wallet revoke transaction ********************************** hashX", hashX, " on Chain:", chainType, " isDebt:", this.isDebt);
          }
        content = {
          walletRevokeEvent: event,
        };
      } else if ((eventName === this.depositEvent[2] && chainType === 'WAN') ||
        (eventName === this.withdrawEvent[2] && chainType !== 'WAN') ||
        (eventName === this.debtEvent[2] && chainType === 'WAN')) {
          if (recordInDb.length === 0 || recordInDb[0].storemanRevokeEvent.length === 0) {
            this.logger.debug("********************************** 6: found storeman revoke transaction ********************************** hashX", hashX, " on Chain:", chainType, " isDebt:", this.isDebt);
          }
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
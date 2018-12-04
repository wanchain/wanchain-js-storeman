"use strict"
const {
  getGlobalChain,
  sleep
} = require('comm/lib');

let Contract = require("contract/Contract.js");

const EthCrossAgent = require("agent/EthCrossAgent.js");

const moduleConfig = require('conf/moduleConfig.js');
const configJson = require('conf/config.json');
const config = moduleConfig.testnet?configJson.testnet:configJson.main;

const Web3 = require("web3");
const web3 = new Web3();

module.exports = class Erc20CrossAgent extends EthCrossAgent {
  constructor(crossChain, tokenType, crossDirection, record = null, action = null, logger = null) {
    super(crossChain, tokenType, crossDirection, record, action, logger);
    this.approveFunc = 'approve';

    if (record !== null) {
      let erc20Abi = moduleConfig.erc20Abi;
      this.tokenContract = new Contract(erc20Abi, this.tokenAddr);
    }
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
        } else if (action === 'redeem') {
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
  getRedeemData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[1], "hashX", this.hashKey);
    this.logger.debug('getRedeemData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey, 'key-', this.key);
    return this.contract.constructData(this.crossFunc[1], this.tokenAddr, this.key);
  }
  getRevokeData() {
    this.logger.debug("********************************** funcInterface **********************************", this.crossFunc[2], "hashX", this.hashKey);
    this.logger.debug('getRevokeData: transChainType-', this.transChainType, 'crossDirection-', this.crossDirection, 'tokenAddr-', this.tokenAddr, 'hashKey-', this.hashKey);
    return this.contract.constructData(this.crossFunc[2], this.tokenAddr, this.hashKey);
  }

  createTrans(action) {
    if (action === 'approveZero') {
      this.data = this.getApproveData();
      this.build = this.buildApproveZeroData;
    } else if (action === 'approve') {
      this.data = this.getApproveData();
      this.build = this.buildApproveData;
    } else if (action === 'lock') {
      this.data = this.getLockData();
      this.build = this.buildLockData;
    } else if (action === 'redeem') {
      this.data = this.getRedeemData();
      this.build = this.buildRedeemData;
    } else if (action === 'revoke') {
      this.data = this.getRevokeData();
      this.build = this.buildRevokeData;
    }

    this.logger.debug("********************************** setData **********************************", this.data, "hashX", this.hashKey);
    this.trans.setData(this.data);
    this.trans.setValue(0);
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

  getDecodeEventTokenAddr(decodeEvent) {
    return decodeEvent.args.tokenOrigAddr;
  }

  getDecodeEventStoremanGroup(decodeEvent) {
    return decodeEvent.args.storemanGroup;
  }
}

"use strict"

const Web3 = require("web3");
const web3Mpc = require("mpc/web3Mpc.js");
var net = require('net');
const moduleConfig = require('conf/moduleConfig.js');
const configJson = require('conf/config.json');
const config = moduleConfig.testnet?configJson.testnet:configJson.main;

const {
  getGlobalChain,
//   getChain
} = require('comm/lib');

module.exports = class mpc {
  constructor(trans, chainType, chainId, hashX) {
    this.sendTxArgs = {
      From: trans.from,
      To: trans.to,
      Gas: '0x' + trans.gasLimit.toString(16),
      GasPrice: '0x' + trans.gasPrice.toString(16),
      Nonce: '0x' + trans.nonce.toString(16),
      Value: '0x' + trans.value.toString(16),
      Data: trans.data,
      ChainType: chainType,
      ChainID: '0x' + chainId.toString(16)
    };
    this.hashX = hashX;
    global.monitorLogger.debug(this.sendTxArgs);
    this.mpcWeb3 = new Web3();
    if (config.mpcUrl.indexOf("http://") !== -1) {
      this.mpcWeb3.setProvider(new Web3.providers.HttpProvider(config.mpcUrl));
    } else {
      this.mpcWeb3.setProvider(new Web3.providers.IpcProvider(config.mpcUrl, net));
    }
    web3Mpc.extend(this.mpcWeb3);
  }

  signViaMpc() {
    return new Promise((resolve, reject) => {
      try {
        this.mpcWeb3.storeman.signMpcTransaction(this.sendTxArgs, (err, result) => {
          if (!err) {
            global.monitorLogger.debug("********************************** mpc signViaMpc successfully **********************************", result, "hashX:", this.hashX);
            resolve(result);

          } else {
            global.monitorLogger.error("********************************** mpc signViaMpc failed **********************************", err, "hashX:", this.hashX);
            reject(err);
          }
        })
      } catch (err) {
        global.monitorLogger.error("********************************** mpc signViaMpc failed **********************************", err, "hashX:", this.hashX);
        reject(err);
      }
    });
  }

  addValidMpcTx() {
    return new Promise((resolve, reject) => {
      try {
        global.monitorLogger.debug(this.mpcWeb3.storeman);
        this.mpcWeb3.storeman.addValidMpcTx(this.sendTxArgs, (err, result) => {
          if (!err) {
            global.monitorLogger.debug("********************************** mpc addValidMpcTx successfully **********************************", result, "hashX:", this.hashX);
            resolve(result);
          } else {
            global.monitorLogger.error("********************************** mpc addValidMpcTx failed **********************************", err, "hashX:", this.hashX);
            reject(err);
          }
        })
      } catch (err) {
        global.monitorLogger.error("********************************** mpc addValidMpcTx failed **********************************", err, "hashX:", this.hashX);
        reject(err);
      }
    });
  }
}

"use strict"

const Web3 = require("web3");
const web3Mpc = require("mpc/web3Mpc.js");
var net = require('net');

// const {
//   loadConfig
// } = require('comm/lib');

module.exports = class mpc {
  constructor() {
    // let config = global.config;
    // this.mpcWeb3 = new Web3();
    // if (config.mpcUrl.indexOf("http://") !== -1) {
    //   this.mpcWeb3.setProvider(new Web3.providers.HttpProvider(config.mpcUrl));
    // } else {
    //   this.mpcWeb3.setProvider(new Web3.providers.IpcProvider(config.mpcUrl, net));
    // }
    this.mpcWeb3 = this.getClient(global.mpcUrl);
    web3Mpc.extend(this.mpcWeb3);
  }

  getClient(nodeUrl) {
    let client;
    if (nodeUrl.indexOf("http://") !== -1) {
      client = new Web3()
      client.setProvider(new Web3.providers.HttpProvider(nodeUrl));
    } else {
      if (global.ipcClient && global.ipcClient.isConnected()) {
        console.log("use existed client");
        client = global.ipcClient;
      } else {
        console.log("create new client");
        client = new Web3()
        client.setProvider(new Web3.providers.IpcProvider(nodeUrl, net));
        global.ipcClient = client;
      }
    }
    return client;
  }

  setTx(trans, chainType, chainId) {
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

    global.monitorLogger.debug(this.sendTxArgs);
  }

  setHashX(hashX) {
    this.hashX = hashX;
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

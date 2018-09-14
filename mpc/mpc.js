"use strict"

const Web3 = require("web3");
const web3Mpc = require("mpc/web3Mpc.js");
var net = require('net');
const config = require('conf/config');

module.exports = class mpc {
  constructor(trans, chainType, chainId, signType = 'hash') {
    this.sendTxArgs = {
      From: trans.from,
      To: trans.to,
      Gas: trans.gasLimit,
      GasPrice: trans.gasPrice,
      Nonce: trans.nonce,
      Value: trans.value,
      Data: trans.data,
      ChainType: chainType,
      ChainID: chainId,
      SignType: signType
    }

    web3Mpc.extend(Web3);
    if (config.mpcUrl.indexOf("http://") > 0) {
      this.mpcWeb3 = new Web3(new Web3.providers.HttpProvider(config.mpcUrl));
    } else {
      this.mpcWeb3 = new Web3(new Web3.providers.IpcProvider(config.mpcUrl, net));
    }
  }

  signViaMpc() {
    return new Promise((resolve, reject) => {
      try {
        this.mpcWeb3.storeman.signMpcTransaction(this.sendTxArgs, (err, result) => {
          if (!err) {
            console.log("********************************** mpc signViaMpc successfully **********************************", result);
            resolve(result);

          } else {
            console.log("********************************** mpc signViaMpc failed **********************************", err);
            reject(err);
          }
        })
      } catch (err) {
        console.log("********************************** mpc signViaMpc failed **********************************", err);
        reject(err);
      }
    });
  }

  addValidMpcTxRaw() {
    return new Promise((resolve, reject) => {
      try {
        this.mpcWeb3.storeman.addValidMpcTxRaw(this.sendTxArgs, (err, result) => {
          if (!err) {
            console.log("********************************** mpc addValidMpcTxRawaddValidMpcTxRawaddValidMpcTxRaw successfully **********************************", result);
            resolve(result);
          } else {
            console.log("********************************** mpc addValidMpcTxRawaddValidMpcTxRaw failed **********************************", err);
            reject(err);
          }
        })
      } catch (err) {
        console.log("********************************** mpc addValidMpcTxRaw failed **********************************", err);
        reject(err);
      }
    });
  }
}
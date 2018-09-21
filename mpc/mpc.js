"use strict"

const Web3 = require("web3");
const web3Mpc = require("mpc/web3Mpc.js");
var net = require('net');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('conf/config.json'));

module.exports = class mpc {
  constructor(trans, chainType, chainId) {
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
    }
console.log(this.sendTxArgs);
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
        console.log(this.mpcWeb3.storeman);
        this.mpcWeb3.storeman.addValidMpcTxRaw(this.sendTxArgs, (err, result) => {
          if (!err) {
            console.log("********************************** mpc addValidMpcTxRaw successfully **********************************", result);
            resolve(result);
          } else {
            console.log("********************************** mpc addValidMpcTxRaw failed **********************************", err);
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

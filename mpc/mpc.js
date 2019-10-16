"use strict"

const Web3 = require("web3");
const web3Mpc = require("mpc/web3Mpc.js");
var net = require('net');

const {
  loadConfig
} = require('comm/lib');

module.exports = class mpc {
  constructor(data, pk, hashX) {
    this.pk = pk;
    this.hashX = hashX;
    // this.data = this.encode(mpcSignData);
    this.signData = {
      pk: this.pk,
      data: data
    }
    global.monitorLogger.debug("********************************** mpc signData **********************************", this.signData, "hashX:", this.hashX);

    this.mpcWeb3 = new Web3();

    let config = loadConfig();
    if (config.mpcUrl.indexOf("http://") !== -1) {
      this.mpcWeb3.setProvider(new Web3.providers.HttpProvider(config.mpcUrl));
    } else {
      this.mpcWeb3.setProvider(new Web3.providers.IpcProvider(config.mpcUrl, net));
    }
    web3Mpc.extend(this.mpcWeb3);
  }

  // encode(mpcSignData) {
  //   let data = '';
  //   if (Array.isArray(mpcSignData)) {
  //     for (var index in mpcSignData) {
  //       data += mpcSignData[index];
  //       if (index + 1 < mpcSignData.length) {
  //         data += ':';
  //       }
  //     }
  //   } else {
  //     data = mpcSignData;
  //   }
  //   global.monitorLogger.debug("********************************** mpc decodeData **********************************", data, "hashX:", this.hashX);
  //   return new Buffer(data).toString('base64');
  // }

  signViaMpc() {
    return new Promise((resolve, reject) => {
      try {
        this.mpcWeb3.storeman.signData(this.signData, (err, result) => {
          if (!err) {
            global.monitorLogger.debug("********************************** mpc signData successfully **********************************", result, "hashX:", this.hashX);
            resolve(result);
          } else {
            global.monitorLogger.error("********************************** mpc signData failed **********************************", err, "hashX:", this.hashX);
            reject(err);
          }
        })
      } catch (err) {
        global.monitorLogger.error("********************************** mpc signData failed **********************************", err, "hashX:", this.hashX);
        reject(err);
      }
    });
  }

  addValidDataViaMpc() {
    return new Promise((resolve, reject) => {
      try {
        this.mpcWeb3.storeman.addValidData(this.signData, (err, result) => {
          if (!err) {
            global.monitorLogger.debug("********************************** mpc addValidData successfully **********************************", result, "hashX:", this.hashX);
            resolve(result);
          } else {
            global.monitorLogger.error("********************************** mpc addValidData failed **********************************", err, "hashX:", this.hashX);
            reject(err);
          }
        })
      } catch (err) {
        global.monitorLogger.error("********************************** mpc addValidData failed **********************************", err, "hashX:", this.hashX);
        reject(err);
      }
    });
  }
}

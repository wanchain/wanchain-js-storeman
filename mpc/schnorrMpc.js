"use strict"

const Web3 = require("web3");
const web3Mpc = require("mpc/web3Mpc.js");
var net = require('net');

// const {
//   loadConfig
// } = require('comm/lib');

module.exports = class mpc {
  constructor() {
    // this.mpcWeb3 = new Web3();
    // if (global.mpcUrl.indexOf("http://") !== -1) {
    //   this.mpcWeb3.setProvider(new Web3.providers.HttpProvider(global.mpcUrl));
    // } else {
    //   this.mpcWeb3.setProvider(new Web3.providers.IpcProvider(global.mpcUrl, net));
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
      if (global.ipcSchnorrClient && global.ipcSchnorrClient.isConnected()) {
        console.log("use existed client");
        client = global.ipcSchnorrClient;
      } else {
        console.log("create new client");
        client = new Web3()
        client.setProvider(new Web3.providers.IpcProvider(nodeUrl, net));
        global.ipcSchnorrClient = client;
      }
    }
    return client;
  }

  setHashX(hashX) {
    this.hashX = hashX;
  }

  setSignData(pk, data, extern) {
    this.pk = pk;
    this.signData = {
      pk: pk,
      data: data
    }
    if (extern) {
      this.signData.extern = extern;
    }
    global.monitorLogger.debug("********************************** mpc signData **********************************", this.signData, "hashX:", this.hashX);
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
              if(result.ResultType == 0){
                  global.monitorLogger.debug("********************************** mpc signData successfully **********************************", result, "hashX:", this.hashX);
                  resolve(result);
                  //todo write incentive data to metric contract
              }else{
                  //todo write slash proof
              }
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

  signDataByApprove() {
    return new Promise((resolve, reject) => {
      try {
        this.mpcWeb3.storeman.signDataByApprove(this.signData, (err, result) => {
          if (!err) {
            global.monitorLogger.debug("********************************** mpc signDataByApprove successfully **********************************", result, "hashX:", this.hashX);
            resolve(result);
          } else {
            global.monitorLogger.error("********************************** mpc signDataByApprove failed **********************************", err, "hashX:", this.hashX);
            reject(err);
          }
        })
      } catch (err) {
        global.monitorLogger.error("********************************** mpc signDataByApprove failed **********************************", err, "hashX:", this.hashX);
        reject(err);
      }
    });
  }

  getDataForApprove() {
    return new Promise((resolve, reject) => {
      try {
        this.mpcWeb3.storeman.getDataForApprove((err, result) => {
          if (!err) {
            global.monitorLogger.debug("********************************** mpc getDataForApprove successfully **********************************");
            resolve(result);
          } else {
            global.monitorLogger.error("********************************** mpc getDataForApprove failed **********************************", err);
            reject(err);
          }
        })
      } catch (err) {
        global.monitorLogger.error("********************************** mpc getDataForApprove failed **********************************", err);
        reject(err);
      }
    });
  }

  approveData() {
    return new Promise((resolve, reject) => {
      try {
        this.mpcWeb3.storeman.approveData([this.signData], (err, result) => {
          if (!err) {
            global.monitorLogger.debug("********************************** mpc approveData successfully **********************************", result, "hashX:", this.hashX);
            resolve(result);
          } else {
            global.monitorLogger.error("********************************** mpc approveData failed **********************************", err, "hashX:", this.hashX);
            reject(err);
          }
        })
      } catch (err) {
        global.monitorLogger.error("********************************** mpc approveData failed **********************************", err, "hashX:", this.hashX);
        reject(err);
      }
    });
  }
}

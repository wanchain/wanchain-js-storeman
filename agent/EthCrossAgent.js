"use strict"

let Contract = require("contract/Contract.js");
let ethRawTrans = require("trans/EthRawTrans.js");
let wanRawTrans = require("trans/WanRawTrans.js");
const ModelOps = require('db/modelOps');

module.exports = class EthCrossAgent {
	contstructor() {

	}

	getLockData(Amount){}
	getRefundData(){}
	getRevokeData(){}

	getLockEventTopic(){}
	getRefundEventTopic(){}
	getRevokeEventTopic(){}

	sendLockTrans(){}
	sendRefundTrans(){}
	sendRevokeTrans(){}

  buildLockData(hashKey, result) {
    console.log("********************************** insertLockData trans **********************************", hashKey);

    let content = {
      storemanLockTxHash: result.toLowerCase()
    }
    return content;
  }

  buildRefundData(hashKey, result) {
    console.log("********************************** insertRefundData trans **********************************", hashKey);

    let content = {
      storemanRefundTxHash: result.toLowerCase()
    }
    return content;
  }

  buildRevokeData(hashKey, result) {
    console.log("********************************** insertRevokeData trans **********************************", hashKey);

    let content = {
      storemanRevokeTxHash: result.toLowerCase()
    }
    return content;
  }
}
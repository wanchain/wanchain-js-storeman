"use strict"
const baseAgent = require("agent/BaseAgent.js");

let RawTrans = require("trans/BtcRawTrans.js");

const moduleConfig = require('conf/moduleConfig.js');

module.exports = class BtcAgent extends baseAgent {
  constructor(crossChain, tokenType, crossDirection = 0, record = null, action = null) {
    super(crossChain, tokenType, crossDirection, record, action);

    this.RawTrans = RawTrans;

  }

  getTransInfo(action) {
    let from;
    let to;
    let amount;


  }

  getLockData() {

  }

  getRedeemData() {

  }

  getRevokeData() {

  }

  getDecodeEventTokenAddr(decodeEvent) {
    return decodeEvent;
  }

  getDecodeEventStoremanGroup(decodeEvent) {
    return decodeEvent;
  }

  getDecodeEventValue(decodeEvent) {
    return decodeEvent.args.value;
  }

  getDecodeEventToHtlcAddr(decodeEvent) {
    return decodeEvent.args.toHtlcAddr;
  }

}
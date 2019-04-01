"use strict"

const {
    getGlobalChain,
    sleep
    //   getChain
} = require('comm/lib');

module.exports = class EosCrossAgent {
    constructor(crossChain, tokenType, crossDirection, record = null, action = null) {

    }

    getTransChainType(crossDirection, action) {

    }

    async initAgentTransInfo(action) {

    }

    getLockedTime() { }

    getTransInfo(action) { }

    getLockData() { }

    getRedeemData() { }

    getRevokeData() { }

    createTrans(action) { }

    sendTransSync() { }

    async sendTrans(callback) { }

    validateTrans() {

    }

    buildLockData(hashKey, result) { }

    buildRedeemData(hashKey, result) { }

    buildRevokeData(hashKey, result) { }

    getDecodeEventTokenAddr(decodeEvent) {
        return '0x';
    }

    getDecodeEventStoremanGroup(decodeEvent) {
        return decodeEvent.args.storeman;
    }

    getDecodeEventDbData(chainType, crossChain, tokenType, decodeEvent, event, lockedTime) { }
}
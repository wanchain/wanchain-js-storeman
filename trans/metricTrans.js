"use strict"

const WanRawTrans = require('./WanRawTrans');
const Web3 = require('web3');
const {metricCfg, abiMap} = require('../metric/conf/metric');

module.exports = class MetricTrans extends WanRawTrans {
    constructor(from, to, gas, gasPrice, nonce, value) {
        console.log("<<<<<<from",from);
        console.log("<<<<<<to",to);
        console.log("<<<<<<gas",gas);
        console.log("<<<<<<gasPrice",gasPrice);
        console.log("<<<<<<nonce",nonce);
        console.log("<<<<<<value",value);

        super(from, to, gas, gasPrice, nonce, value);
        // build web3
        this.web3 = new Web3(metricCfg.wanNodeURL);
    }

    sendSignedRawTrans(rawTx){
        console.log("Entering sendSignedRawTrans");
        this.web3.sendRawTransaction(rawTx);
    }
};
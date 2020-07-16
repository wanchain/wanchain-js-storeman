"use strict"

const WanRawTrans = require('./WanRawTrans');
const Web3 = require('web3');
const metricCfg = require('../agent/osm/cfg/config');

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
        this.web3 = new Web3(new Web3.providers.HttpProvider(metricCfg.wanNodeURL));
    }

    sendSignedRawTrans(rawTx){
        let self = this;
        return new Promise(function(resolve,reject){
            console.log("Entering sendSignedRawTrans");
            try{
                let txHash = self.web3.eth.sendRawTransaction(rawTx);
                resolve(txHash);
            }catch(err){
                console.log("sendSignedRawTrans error : ", err);
                reject(err);
            }
        });
    }
};
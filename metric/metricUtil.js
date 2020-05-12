"use strict"
const {metricCfg, abiMap} = require('./conf/metric');
const Web3 = require('web3');

async function getCommonData() {
    let from;
    let to;
    let amount;
    let gas;
    let gasPrice;
    let nonce;

    return new Promise(async (resolve, reject) => {
        try {
            from = metricCfg.selfAddress;
            to = metricCfg.contractAddress.metric;
            gas = metricCfg.gasLimit;
            gasPrice = metricCfg.gasPrice;
            amount = 0x0;
            // nonce = await getNonceByWeb3(from);
            resolve([from,to,gas,gasPrice,nonce,amount]);
        } catch (err) {
            console.log("getCommonData failed", err);
            reject(err);
        }
    });
}

async function getNonceByWeb3(addr, includePendingOrNot = true) {
    let web3 = new Web3(metricCfg.wanNodeURL);
    let nonce;
    return new Promise(function (resolve, reject) {
        if (includePendingOrNot) {
            web3.eth.getTransactionCount(addr, 'pending', function (err, result) {
                if (!err) {
                    nonce = '0x' + result.toString(16);
                    resolve(nonce);
                } else {
                    reject(err);
                }
            })
        } else {
            web3.eth.getTransactionCount(addr, function (err, result) {
                if (!err) {
                    nonce = '0x' + result.toString(16);
                    resolve(nonce);
                } else {
                    reject(err);
                }
            })
        }
    })
};

module.exports = {
    getCommonData
}

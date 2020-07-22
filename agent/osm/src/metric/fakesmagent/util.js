const Web3 = require('web3_1.2');
const metricCfg = require('./config');

async function sleep(timeduring) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, timeduring);
    })
}

function getContract(abi, address) {
    let web3 = new Web3();
    web3.setProvider(new Web3.providers.HttpProvider(metricCfg.wanNodeURL));
    let contract = new web3.eth.Contract(abi, address);
    console.log("URL:", metricCfg.wanNodeURL);
    //console.log("abi:",abi);
    console.log("address:", address);
    console.log("self address:", metricCfg.selfAddress);
    return contract;
}


async function getCommon(amount) {
    let from;
    let to;
    let gas;
    let gasPrice;
    let nonce;

    return new Promise(async (resolve, reject) => {
        try {
            from = metricCfg.selfAddress;
            to = metricCfg.contractAddress.htlc;
            gas = web3.toBigNumber(metricCfg.gasLimit);
            gasPrice = web3.toBigNumber(metricCfg.gasPrice);
            amount = web3.toBigNumber(amount);
            nonce = await getNonceByWeb3(from);
            resolve([from, to, gas, gasPrice, nonce, amount]);
        } catch (err) {
            console.log("getCommonData failed", err);
            reject(err);
        }
    });
}

async function getReceipt(txHash) {
    let web3 = new Web3(new Web3.providers.HttpProvider(metricCfg.wanNodeURL));
    return new Promise(async (resolve, reject) => {
        try {
            let receipt;
            while (!receipt) {
                receipt = web3.eth.getTransactionReceipt(txHash);
                await sleep(10);
            }
            resolve(receipt);
        } catch (err) {
            reject(err);
        }
    })
}

async function getNonceByWeb3(addr, includePendingOrNot = false) {
    console.log(">>>>>>>>>>>>>>Entering getNonceByWeb3");
    console.log("metricCfg", metricCfg);
    console.log(">>>>>>>>>>>>>>metricCfg.wanNodeURL", metricCfg.wanNodeURL);

    let web3 = new Web3(new Web3.providers.HttpProvider(metricCfg.wanNodeURL));
    console.log(">>>>>>>>>>>>>web3.version.api ", web3.version.api);
    let nonce;
    return new Promise(function (resolve, reject) {

        try {
            if (includePendingOrNot) {

                try {
                    web3.eth.getTransactionCount(addr, 'pending', function (err, result) {
                        if (!err) {
                            nonce = '0x' + result.toString(16);
                            resolve(nonce);
                        } else {
                            reject(err);
                        }
                    })
                } catch (err) {
                    reject(err)
                }

            } else {
                try {
                    web3.eth.getTransactionCount(addr, function (err, result) {
                        if (!err) {
                            nonce = '0x' + result.toString(16);
                            resolve(nonce);
                        } else {
                            reject(err);
                        }
                    })
                } catch (err) {
                    reject(err);
                }

            }
        } catch (err) {
            console.log("Entering getNonceByWeb3 try catch");
            reject(err);
        }
    })
};

module.exports = {
    getCommon,
    getReceipt,
    sleep,
    getContract
};
"use strict"

const {metricCfg, abiMap} = require('./conf/metric');
const MetricContract = require('./metricContract');
let MetricTrans = require('../trans/metricTrans');
let KeyStore = require('../utils/keyStore');

let {getCommonData} = require('./metricUtil');

function sleep(time) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve();
        }, time);
    })
}

class IncntSlshWriter {
    constructor() {
        this.logger = global.monitorLogger;
        this.metricConfig = global.metricConfig;
        this.tasks = [];
        this.mutexMetric = false;
    }

    handleInctSlsh(xhash, signedResult) {
        console.log("Entering handleInctSlsh");
        this.enQueue(xhash, signedResult);
    }


    enQueue(xHash, signedResult) {
        this.lockMutex();
        this.tasks.unshift({xHash: xHash, signedResult: signedResult});
        this.unlockMutex();
    }

    popQueue() {
        let task = null;
        //this.lockMutex(this.mutexMetric);
        this.lockMutex();
        if (this.tasks.length > 0) {
            task = this.tasks.pop();
        }
        this.unlockMutex();
        return task;
    }

    lockMutex() {
        while (this.mutexMetric) {
            sleep(3);
        }
        ;
        this.mutexMetric = true
    }

    unlockMutex() {
        this.mutexMetric = false;
    }

    run() {
        setInterval(() => {
            console.log("--------------------------------setInterval :: popQueue---------------------");
            let task = this.popQueue();
            if (task != null) {
                console.log("task :", task);
                this.procSignedResult(task).catch((err) => {
                    console.log("--------------------------------setInterval :: enQueue---------------------");
                    this.enQueue(task.xHash, task.signedResult);
                })
            }
        }, 1000)
    }

    procSignedResult(task) {
        return new Promise(function (resolve, reject) {

            console.log("Entering procSignedResult");
            let abi = abiMap["Metric"];
            let address = metricCfg.contractAddress.metric;

            // console.log(">>>>procSignedResult: abi", abi);
            // console.log(">>>>procSignedResult: address", address);

            let c = new MetricContract(abi, address);
            let data = c.buildData(task);
            for (let oneProofData of data) {
                // write one proof to the metric contract
                try {
                    let commoneInfo = [];
                    getCommonData()
                        .then((ret) => {
                            console.log(">>>>>ret of getCommonData ", ret);
                            commoneInfo = ret;


                            console.log("===============================================");
                            console.log(">>>>>commoneInfor ", commoneInfo);
                            let mt = new MetricTrans(...commoneInfo);
                            mt.setData(oneProofData);

                            console.log("metricCfg.keystore.pwd", metricCfg.keystore.pwd);
                            console.log("metricCfg.keystore.path", metricCfg.keystore.path);

                            // get privateKey
                            let prvKey = KeyStore.getPrivateKeyByKsPath(metricCfg.selfAddress, metricCfg.keystore.pwd, metricCfg.keystore.path);
                            //let signedRawTx = mt.signFromKeystore(metricCfg.keystore.pwd, metricCfg.keystore.path);
                            let signedRawTx = mt.sign(prvKey);
                            console.log("<<<<<<<<signedRawTx is " + signedRawTx);
                            //todo handle error.
                            mt.sendSignedRawTrans(signedRawTx)
                                .then((result) => {
                                    console.log("---------------------------sendTrans successfully------------ txHash", result);
                                    resolve(result);
                                })
                                .catch((err) => {
                                    console.log("---------------------------sendTrans failed------------ err", err);
                                    reject(err);
                                });
                            //resolve();
                        })
                        .catch((err) => {
                            console.log("--------------------------------error procSignedResult :: getCommonData---------------------");
                            reject(err);
                            throw err;
                        });


                } catch (err) {
                    console.log("--------------------------------error procSignedResult :: try catch---------------------");
                    reject(err);
                    console.log(err);
                }

            }
        });

    }
}

global.incntSlshWriter = null;

function getIncntSlshWriter() {
    if (global.incntSlshWriter == null) {
        global.incntSlshWriter = new IncntSlshWriter();
    } else {
        return global.incntSlshWriter;
    }
}

module.exports = {
    getIncntSlshWriter
};


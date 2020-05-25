"use strict"

const {metricCfg, abiMap} = require('./conf/metric');
const MetricContract = require('./metricContract');
let MetricTrans = require('../trans/metricTrans');
let KeyStore = require('../utils/keyStore');
const Web3 = require('web3');

let {getCommonData, getReceipt} = require('./metricUtil');

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
            console.log("\n\n\n\n\n");
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

        setInterval(() => {
            console.log("\n\n\n\n\n");
            console.log("--------------------------------setInterval :: get static data ---------------------");
            this.getStaticData();
        }, 10000)
    }

    getStaticData() {
        //getPrdInctMetric
        //getPrdSlshMetric
        function getEpIDByNow() {
            let tmstamp = new Date().getTime() / 1000;
            return Math.floor(tmstamp / (5 * 1440 * 12));
        }

        let startEpID = getEpIDByNow();
        let endEpID = startEpID + 1;
        let grpId = "0x0000000000000000000000000000000000000031353839393533323738313235";

        let abi = abiMap["Metric"];
        let address = metricCfg.contractAddress.metric;

        let web3 = new Web3(new Web3.providers.HttpProvider(metricCfg.wanNodeURL));

        let MyContract = web3.eth.contract(abi);
        let c = MyContract.at(address);
        let ret = c.getPrdInctMetric.call(grpId, startEpID, endEpID);
        console.log(".............getPrdInctMetric..........");
        for(let i=0;i<ret.length;i++){
            console.log("i: "+i+" count: "+ret[i].toString(10));
        }

        console.log(".............getPrdSlshMetric..........");
        ret = c.getPrdSlshMetric.call(grpId, startEpID, endEpID);
        for(let i=0;i<ret.length;i++){
            console.log("i: "+i+" count: "+ret[i].toString(10));
        }

        console.log(".............getDependence..........");
        ret = c.getDependence.call();
        for(let i=0;i<ret.length;i++){
            console.log("i: "+i+" count: "+ret[i]);
        }
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
                            console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>ret of getCommonData ", ret);
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
                                    getReceipt(result)
                                        .then((recpt) => {
                                            console.log("recpt " + recpt);
                                            if (recpt.status == "0x1") {
                                                console.log("---------------------------status receipt is OK------------ txHash", result);
                                                resolve(recpt);
                                            } else {
                                                console.log("---------------------------status receipt is error!------------ txHash", result);
                                                reject(recpt);
                                            }
                                        });
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


"use strict"

const abiMap = require('../../cfg/abi');
const metricCfg = require('../../cfg/config');
const MetricContract = require('./metricContract');
let MetricTrans = require('../../../../trans/metricTrans');
let KeyStore = require('../../../../utils/keyStore');
const Web3 = require('web3');
const wanchain = require('../utils/wanchain');
const {startFakeSmagent} = require('./fakesmagent/testFakesmagent');


let {getCommonData, getReceipt} = require('./metricUtil');

async function sleep(time) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve();
        }, time);
    })
}

class IncntSlshWriter {
    constructor() {
        this.logger = global.metricLogger;
        this.tasks = [];
        this.mutexMetric = false;
        //todo should read the task on disk
    }

    handleInctSlsh(xhash, signedResult) {
        console.log("Entering handleInctSlsh");
        this.enQueue(xhash, signedResult);
    }


    enQueue(xHash, signedResult) {
        console.log("--------------------------------setInterval :: enQueue---------------------");
        this.lockMutex();
        this.tasks.unshift({xHash: xHash, signedResult: signedResult});
        this.unlockMutex();
    }

    popQueue() {
        console.log("--------------------------------setInterval :: popQueue---------------------");
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
        this.mutexMetric = true
    }

    unlockMutex() {
        this.mutexMetric = false;
    }

    run() {

        if(global.enableFakeSmagent){
            // startFakeSmagent();
        }
        setInterval(async() => {

            console.log("\n\n\n\n\n");
            let task = this.popQueue();
            if (task != null) {
                console.log("task :", task);
                this.procSignedResult(task).catch((err) => {
                    console.log("--------------------------------setInterval ::procSignedResult error", err);
                    console.log("--------------------------------setInterval :: enQueue---------------------");
                    this.enQueue(task.xHash, task.signedResult);
                })
            }
            await sleep(5000);
        }, 10000);

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
            return Math.floor(tmstamp / (1*12*10));
        }

        let startEpIDTemp = getEpIDByNow();
        let oneWeekEpoch = 7;
        let startEpID = startEpIDTemp - oneWeekEpoch;
        //let endEpID = startEpID + 1;
        let endEpID = startEpIDTemp + 1;
        let grpId = "0x0000000000000000000000000000000000000031353839393533323738313235";

        let abi = abiMap.get("metric");
        let address = metricCfg.contractAddress.metric;

        let web3 = new Web3(new Web3.providers.HttpProvider(metricCfg.wanNodeURL));

        let MyContract = web3.eth.contract(abi);
        let c = MyContract.at(address);
        let ret = c.getPrdInctMetric.call(grpId, startEpID, endEpID);
        console.log(".............getPrdInctMetric..........");
        console.log(".............startEpId.........." + startEpID);
        console.log(".............endEpID.........." + endEpID);

        for (let i = 0; i < ret.length; i++) {
            console.log("i: " + i + "incentive count: " + ret[i].toString(10));
        }

        console.log(".............getPrdSlshMetric..........");
        ret = c.getPrdSlshMetric.call(grpId, startEpID, endEpID);
        for (let i = 0; i < ret.length; i++) {
            console.log("i: " + i + "slsh count: " + ret[i].toString(10));
        }

        console.log(".............getDependence..........");
        ret = c.getDependence.call();
        for (let i = 0; i < ret.length; i++) {
            console.log("i: " + i + " dependence: " + ret[i]);
        }
    }

    procSignedResult(task) {
        return new Promise(async function (resolve, reject) {

            console.log("Entering procSignedResult");
            let abi = abiMap.get("metric");
            let address = metricCfg.contractAddress.metric;
            //console.log(">>>>procSignedResult: abi", abi);
            console.log(">>>>procSignedResult: address", address);


            let c = new MetricContract(abi, address);
            let data = c.buildData(task);

            try{
                let commoneInfo = [];
                commoneInfo = await getCommonData();
                console.log(">>>>>commoneInfor ", commoneInfo);

                let mt = new MetricTrans(...commoneInfo);
                mt.setData(data);

                // let prvKey = KeyStore.getPrivateKeyByKsPath(wanchain.selfAddress, metricCfg.keystore.pwd, metricCfg.keystore.path);
                //let signedRawTx = mt.signFromKeystore(metricCfg.keystore.pwd, metricCfg.keystore.path);
                let signedRawTx = mt.sign(wanchain.selfSk);
                console.log("<<<<<<<<signedRawTx is " + signedRawTx);

                let txHash = await mt.sendSignedRawTrans(signedRawTx)
                console.log("---------------------------sendTrans successfully------------ txHash", txHash);

                let rcpt = await getReceipt(txHash);
                if (rcpt.status == "0x1") {
                    console.log("---------------------------status receipt is OK------------ txHash", txHash);
                    resolve(rcpt);
                } else {
                    console.log("---------------------------status receipt is error!------------ txHash", txHash);
                    reject(rcpt);
                }
            }catch(err){
                console.log("--------------------------------error procSignedResult :: error---------------------", err);
                reject(err);
            }
        });
    }
}
global.incntSlshWriter = null;

function getIncntSlshWriter() {
    if (global.incntSlshWriter == null) {
        global.incntSlshWriter = new IncntSlshWriter();
    }
    return global.incntSlshWriter;
}

module.exports = {
    getIncntSlshWriter
};


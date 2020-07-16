"use strict"

const Web3 = require('web3');
const {grpBuildCfg,abiMap} = require('./conf/grpBuild');
const TimeoutPromise = require('../utils/timeoutPromise.js');
const Contract = require('../contract/Contract');

function union(thisSet, otherSet) {
    let unionSet = new Set();
    let values = Array.from(thisSet);
    for (let i = 0; i < values.length; i++) {
        unionSet.add(values[i]);
    }


    values = Array.from(otherSet);
    for (let i = 0; i < values.length; i++) {
        unionSet.add(values[i]);
    }

    return unionSet;
}

function intersection(thisSet, otherSet) {
    let interSectionSet = new Set();
    let values = Array.from(thisSet);
    for (let i = 0; i < values.length; i++) {

        if (otherSet.has(values[i])) {
            interSectionSet.add(values[i])
        }
    }

    return interSectionSet;
}

function difference(thisSet, otherSet) {
    let differenceSet = new Set();
    let values = Array.from(thisSet);
    for (let i = 0; i < values.length; i++) {

        if (!otherSet.has(values[i])) {
            differenceSet.add(values[i])
        }
    }

    return differenceSet;
}

function equal(thisSet, otherSet) {
    let differenceSet = new Set();
    differenceSet = difference(thisSet,otherSet);
    return differenceSet.length == 0 ? true : false;
}

//output: events
function getScEvent(address, topics, fromBlk, toBlk, retryTimes, callback) {
    console.log(">>>>>>>>>>>>>Entering getScEvent");
    let times = 0;

    let filterValue = {
        fromBlock: fromBlk,
        toBlock: toBlk,
        topics: topics,
        address: address
    };
    console.log(">>>>>>>>>>>>>filterValue " + JSON.stringify(filterValue));
    console.log(">>>>>>>>>>>>>wanNodeURL " + grpBuildCfg.wanNodeURL);
    let web3 = new Web3(new Web3.providers.HttpProvider(grpBuildCfg.wanNodeURL));

    let filter = web3.eth.filter(filterValue);
    let filterGet = function (filter) {
        filter.get(function (err, events) {
            if (err) {
                if (times >= retryTimes) {
                    callback(err, events);
                } else {
                    times++;
                    filterGet(filter);
                }
            } else {
                callback(err, events);
            }
        });
    };
    try {
        filterGet(filter);
    } catch (err) {
        callback(err, null);
    }
}


function getLastBlockNumber(){
    console.log(grpBuildCfg);
    //console.log(abiMap);

    return new Promise(async (resolve, reject) =>{
        try{
            console.log("Entering getLastBlockNumber wanNodeURL :", grpBuildCfg.wanNodeURL);
            let web3 = new Web3(new Web3.providers.HttpProvider(grpBuildCfg.wanNodeURL));
            web3.eth.getBlockNumber(async (err,blockNumber)=>{
                if(err){
                    reject(err);
                }else{
                    resolve(blockNumber);
                }
            })
        }catch(err){
            console.log(err);
        }

    })

}

function getWorkingGrps(address, topics, fromBlk, toBlk, retryTimes) {
    console.log(">>>>>>>>>>>>>Entering getWorkingGrps");
    let self = this;
    let abi = abiMap["Mortgage"];
    let contractAddr = grpBuildCfg.contractAddress.mortgage;

    return new TimeoutPromise(async (resolve, reject) => {
        try{
            getScEvent(address, topics, fromBlk, toBlk, retryTimes, async (err, logs) => {

                console.log(">>>>>>>>>>>>>get event log. len(log) "+ logs.length);
                if (err) {
                    log.error(err);
                    reject(err);
                } else {
                    let parsedLogs = [];

                    // for (let onelog of logs){
                    //     console.log(">>>>>>>>>>>>>>>>>one log is \n", JSON.stringify(onelog));
                    //
                    //     let contract = new Contract(abi, contractAddr);
                    //     let parsedLog = contract.parseEvents([JSON.parse(JSON.stringify(onelog))]);
                    //     console.log(">>>>>>>>>>>>>>>>>parsed one log is \n", parsedLog);
                    //
                    // }

                    if (logs !== null) {
                        let contract = new Contract(abi, contractAddr);
                        parsedLogs = contract.parseEvents(JSON.parse(JSON.stringify(logs)));

                        console.log(">>>>>>>>>>>parsedLogs ", parsedLogs);
                    }

                    let regGrp = new Set();
                    let unRegGrp = new Set();
                    let totalGrp = new Set();

                    for (let i of parsedLogs) {
                        if (i && (i.event === grpBuildCfg.regGrpEvtName)) {
                            regGrp.add(i.args["groupId"]);
                        }
                        if (i && i.event === grpBuildCfg.unregGrpEvtName) {
                            unRegGrp.add(i.args["groupId"]);
                        }
                    }
                    totalGrp = difference(regGrp,unRegGrp);
                    resolve(totalGrp);
                }
            });
        }catch(err){
            reject(err);
        }

    });
}

//IMortgage

async function getThresholdByGrpId(grpId) {
    return new Promise(function (resolve, reject) {
        try{
            let web3 = new Web3(new Web3.providers.HttpProvider(grpBuildCfg.wanNodeURL));
            let abi = abiMap["Mortgage"];
            let address = grpBuildCfg.contractAddress.mortgage;
            console.log("address ",address);

            let myContract = web3.eth.contract(abi);
            let myContractIns = myContract.at(address);

            let ret = myContractIns.getThresholdByGrpId(grpId);
            //let ret = myContractIns.getSelectedSmNumber(grpId);
            console.log("ret ", ret.toString(10));
            resolve(ret.toString(10));
        }catch(err){
            reject(err);
        }

    })
};


async function getSelectedSmNumber(grpId) {
    return new Promise(function (resolve, reject) {
        try{
            let web3 = new Web3(new Web3.providers.HttpProvider(grpBuildCfg.wanNodeURL));
            let abi = abiMap["Mortgage"];
            let address = grpBuildCfg.contractAddress.mortgage;
            console.log("address ",address);

            let myContract = web3.eth.contract(abi);
            let myContractIns = myContract.at(address);

            let ret = myContractIns.getSelectedSmNumber(grpId);
            console.log("ret ", ret.toString(10));
            resolve(ret.toString(10));
        }catch(err){
            reject(err);
        }
    })
};
// ouput:
/* {
        address
        workingPk
        nodeId
    }
 */

async function getSelectedSmInfo(grpId,smIndex) {
    return new Promise(function (resolve, reject) {
        try{
            let web3 = new Web3(new Web3.providers.HttpProvider(grpBuildCfg.wanNodeURL));
            let abi = abiMap["Mortgage"];
            let address = grpBuildCfg.contractAddress.mortgage;

            console.log("address ",address);

            let myContract = web3.eth.contract(abi);
            let myContractIns = myContract.at(address);

            let ret = myContractIns.getSelectedSmInfo(grpId,smIndex);
            resolve(ret);
        }catch(err){
            reject(err);
        }

    })
};

// IGPK
async function getPkShareByIndex(grpId,smIndex) {
    return new Promise(function (resolve, reject) {
        try{
            let web3 = new Web3(new Web3.providers.HttpProvider(grpBuildCfg.wanNodeURL));
            let abi = abiMap["CreateGpk"];
            let address = grpBuildCfg.contractAddress.createGpk;
            console.log("address ",address);
            let myContract = web3.eth.contract(abi);
            let myContractIns = myContract.at(address);

            let ret = myContractIns.getPkShare(grpId,smIndex);
            resolve(ret);
        }catch(err){
            reject(err);
        }

    })
};

// getGPKByGrpId
async function getGPKByGrpId(grpId) {
    return new Promise(function (resolve, reject) {
        try{
            let web3 = new Web3(new Web3.providers.HttpProvider(grpBuildCfg.wanNodeURL));
            let abi = abiMap["CreateGpk"];
            let address = grpBuildCfg.contractAddress.createGpk;
            console.log("address ",address);

            let myContract = web3.eth.contract(abi);
            let myContractIns = myContract.at(address);

            let ret = myContractIns.getGpk(grpId);
            resolve(ret);
        }catch(err){
            reject(err);
        }
    })
};

module.exports ={
    union,
    intersection,
    difference,
    equal,
    getLastBlockNumber,
    getWorkingGrps,
    getThresholdByGrpId,
    getSelectedSmNumber,
    getSelectedSmInfo,
    getPkShareByIndex,
    getGPKByGrpId
};
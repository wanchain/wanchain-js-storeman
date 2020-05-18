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
        getScEvent(address, topics, fromBlk, toBlk, retryTimes, async (err, logs) => {

            console.log(">>>>>>>>>>>>>get event log. len(log) "+ logs.length);
            if (err) {
                log.error(err);
                reject(err);
            } else {
                let parsedLogs = [];
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
                        regGrp.push(i.args["grpId"]);
                    }
                    if (i && i.event === grpBuildCfg.unregGrpEvtName) {
                        unRegGrp.push(i.args["grpId"]);
                    }
                }
                totalGrp = difference(regGrp,unRegGrp);
                resolve(totalGrp);
            }
        });
    });
}

//IMortgage

async function getThresholdByGrpId(grpId) {
    return new Promise(function (resolve, reject) {
        let web3 = new Web3(new Web3.providers.HttpProvider(grpBuildCfg.wanNodeURL));
        let myContract = new web3.eth.Contract(abiMap["Mortgage"],grpBuildCfg.contractAddress.mortgage);
        myContract.methods.getThresholdByGrpId(grpId).call({from:grpBuildCfg.selfAddress},(err,result)=>{
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });

    })
};

// async function getLeaderIndexByGrpId(grpId) {
//     return new Promise(function (resolve, reject) {
//
//     })
// };

async function getSelectedSmNumber(grpId) {
    return new Promise(function (resolve, reject) {
        let web3 = new Web3(new Web3.providers.HttpProvider(grpBuildCfg.wanNodeURL));
        let myContract = new web3.eth.Contract(abiMap["Mortgage"],grpBuildCfg.contractAddress.mortgage);
        myContract.methods.getSelectedSmNumber(grpId).call({from:grpBuildCfg.selfAddress},(err,result)=>{
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });

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
        let web3 = new Web3(new Web3.providers.HttpProvider(grpBuildCfg.wanNodeURL));
        let myContract = new web3.eth.Contract(abiMap["Mortgage"],grpBuildCfg.contractAddress.mortgage);
        myContract.methods.getSelectedSmInfo(grpId,smIndex).call({from:grpBuildCfg.selfAddress},(err,result)=>{
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });

    })
};

// IGPK
async function getPkShareByIndex(grpId,smIndex) {
    return new Promise(function (resolve, reject) {
        let web3 = new Web3(new Web3.providers.HttpProvider(grpBuildCfg.wanNodeURL));
        let myContract = new web3.eth.Contract(abiMap["CreateGpk"],grpBuildCfg.contractAddress.mortgage);
        myContract.methods.getPkShareByIndex(grpId,smIndex).call({from:grpBuildCfg.selfAddress},(err,result)=>{
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });

    })
};

// getGPKByGrpId
async function getGPKByGrpId(grpId) {
    return new Promise(function (resolve, reject) {
        let web3 = new Web3(new Web3.providers.HttpProvider(grpBuildCfg.wanNodeURL));
        let myContract = new web3.eth.Contract(abiMap["CreateGpk"],grpBuildCfg.contractAddress.mortgage);
        myContract.methods.getGPKByGrpId(grpId).call({from:grpBuildCfg.selfAddress},(err,result)=>{
            if(err){
                reject(err);
            }else{
                resolve(result);
            }
        });

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
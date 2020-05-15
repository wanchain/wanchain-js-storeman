"use strict"

const Web3 = require('web3');
const {grpBuildCfg,abiMap} = require('./conf/grpBuild');

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

    let times = 0;

    let filterValue = {
        fromBlock: fromBlk,
        toBlock: toBlk,
        topics: topics,
        address: address
    };

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
    return new Promise((resolve, reject) =>{
        try{
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

function getTotalGrps(address, topics, fromBlk, toBlk, retryTimes) {
    let self = this;
    let abi = abiMap["CreateGpk"];
    let contractAddr = grpBuildCfg.contractAddress.createGpk;

    return new TimeoutPromise((resolve, reject) => {
        getScEvent(address, topics, fromBlk, toBlk, retryTimes, async (err, logs) => {
            if (err) {
                log.error(err);
                reject(err);
            } else {
                let parsedLogs = [];
                if (logs !== null) {
                    let contract = new Contract(abi, contractAddr);
                    parsedLogs = contract.parseEvents(JSON.parse(JSON.stringify(logs)));
                }

                let regGrp = new Set();
                let unRegGrp = new Set();
                let totalGrp = new Set();

                for (let i of parsedLogs) {
                    if (i && (i.event === 'GpkCreatedLogger')) {
                        regGrp.push(i.args["grpId"]);
                    }
                    if (i && i.event === 'GpkCreatedLogger') {
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

    })
};

// async function getLeaderIndexByGrpId(grpId) {
//     return new Promise(function (resolve, reject) {
//
//     })
// };

async function getSelectedSmNumber(grpId) {
    return new Promise(function (resolve, reject) {

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

    })
};

// IGPK
async function getPkShareByIndex(grpId,smIndex) {
    return new Promise(function (resolve, reject) {

    })
};

// getGPKByGrpId
async function getGPKByGrpId(grpId) {
    return new Promise(function (resolve, reject) {

    })
};

module.exports ={
    union,
    intersection,
    difference,
    equal,
    getTotalGrps,
    getLastBlockNumber,
    getWorkingGrps,
    getThresholdByGrpId,
    getSelectedSmNumber,
    getSelectedSmInfo,
    getPkShareByIndex,
    getGPKByGrpId
};
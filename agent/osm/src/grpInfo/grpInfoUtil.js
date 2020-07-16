"use strict"

const Web3 = require('web3_1.2');

const abiMap = require('../../cfg/abi');
const metricCfg = require('../../cfg/config');

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
    differenceSet = difference(thisSet, otherSet);
    return differenceSet.length == 0 ? true : false;
}


function getContract(abi, address) {
    let web3 = new Web3()
    web3.setProvider(new Web3.providers.HttpProvider(metricCfg.wanNodeURL));
    let contract = new web3.eth.Contract(abi, address);
    console.log("URL:",metricCfg.wanNodeURL);
    //console.log("abi:",abi);
    console.log("address:",address);
    return contract;
}


//ISMG

async function getGrpsByAdd(wkAddr) {
    return new Promise(async function (resolve, reject) {
        try {

            let c = getContract(abiMap.get("smg"), metricCfg.contractAddress.smg);
            let ret = await c.methods.getStoremanInfo(wkAddr).call();

            console.log("getThresholdByGrpId ret ", ret);
            let grps = [];
            if (ret["nextGroupId"].length) {
                grps.push(ret["nextGroupId"].toString(10))
            }
            if (ret["groupId"].length) {
                grps.push(ret["groupId"].toString(10))
            }
            resolve(grps);
        } catch (err) {
            console.log("getGrpsByAdd error", err);
            reject(err);
        }
    })
};

const grpStatus = {
    none: 0,
    initial: 1,
    curveSeted: 2,
    failed: 3,
    selected: 4,
    ready: 5,
    unregistered: 6,
    dismissed: 7
}

async function getReadyGrps(grps) {
    return new Promise(async function (resolve, reject) {
        try {
            let c = getContract(abiMap.get("smg"), metricCfg.contractAddress.smg);
            let grpsReady = [];

            //enum GroupStatus {none, initial,curveSeted, failed,selected,ready,unregistered, dismissed}
            for (let grp of grps) {
                let grpInfo = await c.methods.getStoremanGroupInfo(grp).call();
                if (parseInt(grpInfo["status"]) == grpStatus.ready) {
                    grpsReady.push(grp);
                }
            }
            resolve(grpsReady);
        } catch (err) {
            console.log("getReadyGrps error", err);
            reject(err);
        }
    })
};


async function getSelectedSmNumber(grpId) {
    return new Promise(async function (resolve, reject) {
        try {
            let c = getContract(abiMap.get("smg"), metricCfg.contractAddress.smg);
            let ret = await c.methods.getSelectedSmNumber(grpId).call();
            console.log("getSelectedSmNumber ret ", ret.toString(10));
            resolve(ret.toString(10));
        } catch (err) {
            console.log("getSelectedSmNumber error", err);
            reject(err);
        }
    })
};

async function getThresholdByGrpId(grpId) {
    return new Promise(async function (resolve, reject) {
        try {
            let c = getContract(abiMap.get("smg"), metricCfg.contractAddress.smg);
            let ret = await c.methods.getThresholdByGrpId(grpId).call();
            console.log("getThresholdByGrpId ret ", ret.toString(10));
            resolve(ret.toString(10));
        } catch (err) {
            console.log("getThresholdByGrpId error", err);
            reject(err);
        }
    })
};

//  {   curveTypes:[curve1,curve2],
//      gpks:[gpk1,gpk2]
//  }
async function getCurveGpk(grpId) {
    let ret = {
        "curveTypes": [],
        "gpks": []
    };
    return new Promise(async function (resolve, reject) {
        try {
            let c = getContract(abiMap.get("smg"), metricCfg.contractAddress.smg);
            let ret = await c.methods.getStoremanGroupConfig(grpId).call();
            console.log("getStoremanGroupConfig ret ", ret);
            if (ret["gpk1"].length) {
                ret.curveTypes.push(ret["curve1"]);
                ret.gpks.push(ret["gpk1"]);
            }

            if (ret["gpk2"].length) {
                ret.curveTypes.push(ret["curve2"]);
                ret.gpks.push(ret["gpk2"]);
            }
            resolve(ret);
        } catch (err) {
            console.log("getStoremanGroupConfig error", err);
            reject(err);
        }
    })
}

async function getGrpInfoContent(grpId, smCount) {
    return new Promise(async (resolve, reject) => {

        try {
            let c = getContract(abiMap.get("smg"), metricCfg.contractAddress.smg);
            let pms = [];
            for (let i = 0; i < parseInt(smCount); i++) {
                pms.push(new Promise(async (resolve, reject) => {
                    try {
                        let ret = await c.methods.getSelectedSmInfo(grpId, i).call();
                        console.log("getSelectedSmInfo ret ", ret);
                        resolve(ret);
                    } catch (err) {
                        reject(err);
                    }
                }))
            }

            let c1 = getContract(abiMap.get("smg"), metricCfg.contractAddress.createGpk);
            for (let i = 0; i < parseInt(smCount); i++) {
                pms.push(new Promise(async (resolve, reject) => {
                    try {
                        let ret = await c1.methods.getPkShare(grpId, i).call();
                        console.log("getPkShare ret ", ret);
                        resolve(ret);
                    } catch (err) {
                        reject(err);
                    }
                }))
            }
            let resultAll = await Promise.all(pms);

            let resultContent = [];
            for(let i=0;i<smCount;i++){
                let baseInfo = resultAll[i];
                let gpkShareInfo = resultAll[i+smCount];
                let oneResult = {
                    "workingPk":null,
                    "nodeId":null,
                    "address":null,
                    "pkShares":[],
                };

                oneResult.pkShares.push(gpkShareInfo[0]);
                oneResult.pkShares.push(gpkShareInfo[1]);

                oneResult.workingPk = baseInfo["pk"];
                oneResult.nodeId =baseInfo["enodeId"];
                oneResult.address =baseInfo["txAddress"];

                resultContent.push(oneResult);
            }
            console.log("ret of getGrpInfoContent",resultContent);
            result(resultContent);

        } catch (err) {
            console.log("getGrpInfoContent error", err);
            reject(err)
        }
    });
}

module.exports = {
    equal,
    getGrpsByAdd,
    getReadyGrps,
    getSelectedSmNumber,
    getThresholdByGrpId,
    getCurveGpk,
    getGrpInfoContent
};
"use strict"

const Web3 = require('web3_1.2');

const abiMap = require('../../cfg/abi');
const metricCfg = require('../../cfg/config');
const wanchain = require('../utils/wanchain');
const Web3027 = require('web3');
var net = require('net');

exports.ipcUrl = path.join(__dirname,'../../../../../../osm1/schnorrmpc/data/gwan.ipc');
const web3Mpc = require("../../../../mpc/web3Mpc");

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
    console.log("differenceSet",differenceSet);

    let differenceSet1 = new Set();
    differenceSet1 = difference(otherSet,thisSet);
    console.log("differenceSet",differenceSet1);

    return differenceSet.size == 0 && differenceSet1.size == 0 ? true : false;
}


function getContract(abi, address) {
    let web3 = new Web3()
    web3.setProvider(new Web3.providers.HttpProvider(metricCfg.wanNodeURL));
    let contract = new web3.eth.Contract(abi, address);
    console.log("URL:", metricCfg.wanNodeURL);
    //console.log("abi:",abi);
    console.log("address:", address);
    console.log("self address:", wanchain.selfAddress);
    return contract;
}


//ISMG

async function getGrpsByAdd(wkAddr) {
    return new Promise(async function (resolve, reject) {
        try {

            let c = getContract(abiMap.get("smg"), metricCfg.contractAddress.smg);
            let ret = await c.methods.getStoremanInfo(wkAddr).call();

            console.log("%%%%%%%%%%%%%%%%%%%%%%%getGrpsByAdd ret ", ret);
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
                console.log("%%%%%%%%%%%%%%%%%%%%%%% getReadyGrps grpID", grp, "ret getStoremanGroupInfo", grpInfo);
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
            console.log("%%%%%%%%%%%%%%%%%%%%%%% getSelectedSmNumber ret ", ret.toString(10));
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
            console.log("%%%%%%%%%%%%%%%%%%%%%%% getThresholdByGrpId ret ", ret.toString(10));
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
    let retResult = {
        "curveTypes": [],
        "gpks": []
    };
    return new Promise(async function (resolve, reject) {
        try {
            let c = getContract(abiMap.get("smg"), metricCfg.contractAddress.smg);
            let ret = await c.methods.getStoremanGroupConfig(grpId).call();
            console.log("%%%%%%%%%%%%%%%%%%%%%%% getStoremanGroupConfig ret ", ret);
            if (ret["gpk1"].length) {
                retResult.curveTypes.push(ret["curve1"]);
                retResult.gpks.push(ret["gpk1"]);
            }

            if (ret["gpk2"].length) {
                retResult.curveTypes.push(ret["curve2"]);
                retResult.gpks.push(ret["gpk2"]);
            }
            resolve(retResult);
        } catch (err) {
            console.log("getStoremanGroupConfig error", err);
            reject(err);
        }
    })
}

async function getGrpInfoContent(grpId, smCount) {
    return new Promise(async (resolve, reject) => {

        try {

            let pms = [];

            let c = getContract(abiMap.get("smg"), metricCfg.contractAddress.smg);
            for (let i = 0; i < parseInt(smCount); i++) {
                pms.push(new Promise(async (resolve, reject) => {
                    try {
                        let ret = await c.methods.getSelectedSmInfo(grpId, i).call();
                        console.log("%%%%%%%%%%%%%%%%%%%%%%% getSelectedSmInfo ret ", ret);
                        resolve(ret);
                    } catch (err) {
                        reject(err);
                    }
                }))
            }


            let c1 = getContract(abiMap.get("gpk"), metricCfg.contractAddress.gpk);
            for (let i = 0; i < parseInt(smCount); i++) {
                pms.push(new Promise(async (resolve, reject) => {
                    try {
                        let ret = await c1.methods.getPkShare(grpId, i).call();
                        console.log("%%%%%%%%%%%%%%%%%%%%%%% getPkShare ret ", ret);
                        resolve(ret);
                    } catch (err) {
                        reject(err);
                    }
                }))
            }

            console.log("._._._._._._._._._._ len of all promise", pms.length);

            let resultAll = await Promise.all(pms);

            console.log("._._._._._._._._._._ len of all promise result", resultAll.length);
            for (let retItem of resultAll) {
                console.log("._._._._._._._._._._ retItem", retItem);
            }

            let resultContent = [];
            for (let i = 0; i < parseInt(smCount); i++) {

                let baseInfo = resultAll[i];
                let gpkShareInfo = resultAll[i + parseInt(smCount)];

                let oneResult = {
                    "workingPk": null,
                    "nodeId": null,
                    "address": null,
                    "pkShares": [],
                };

                console.log("._._._._._._._._._._sm index:", i, "baseInfo:", resultAll[i], "gpkShareInfo", resultAll[i + parseInt(smCount)]);

                oneResult.pkShares.push(gpkShareInfo["pkShare1"]);
                oneResult.pkShares.push(gpkShareInfo["pkShare2"]);

                // oneResult.workingPk = baseInfo["pk"];
                // oneResult.nodeId = baseInfo["enodeId"];
                // oneResult.address = baseInfo["txAddress"];

                oneResult.address = baseInfo[0];
                oneResult.workingPk = baseInfo[1];
                oneResult.nodeId = baseInfo[2];


                resultContent.push(oneResult);
            }
            console.log("ret of getGrpInfoContent", resultContent);
            resolve(resultContent);

        } catch (err) {
            console.log("getGrpInfoContent error", err);
            reject(err)
        }
    });
}

async  function noticeMpc(){
    return new Promise(async (resolve, reject) => {
        let web3 = new Web3027();
        web3.setProvider(new Web3027.providers.IpcProvider(ipcUrl, net));
        console.log(".................ipcUrl", ipcUrl);
        web3Mpc.extend(web3);

        web3.storeman.freshGrpInfo((err, result) => {
            if (!err) {
                resolve(result);
            } else {
                reject(err);
            }
        })
    });
}

module.exports = {
    equal,
    getGrpsByAdd,
    getReadyGrps,
    getSelectedSmNumber,
    getThresholdByGrpId,
    getCurveGpk,
    getGrpInfoContent,
    noticeMpc
};
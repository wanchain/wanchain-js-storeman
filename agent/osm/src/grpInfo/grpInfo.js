"use strict"

let fs = require('fs');
let path = require('path');
const metricCfg = require('../../cfg/config');

const {
    equal,
    getGrpsByAdd,
    getReadyGrps,
    getSelectedSmNumber,
    getThresholdByGrpId,
    getCurveGpk,
    getGrpInfoContent
} = require('./grpInfoUtil');

const Web3 = require('web3');

function sleep(time) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve();
        }, time);
    })
}


class GrpInfo {
    constructor() {
        this.preGrpSet = new Set();
    }


    run() {
         setInterval(() => {
             this.mainLoop();
         }, 3000)
    }

    async mainLoop() {
        // get all group
        // get all reg event  from block to latest (using init filter)
        // get all unreg event from block to latest
        // get the diff collection

        try{
            console.log("------------------------------------Entering mainLoop-----------------------------");
            let grps        = await  getGrpsByAdd(metricCfg.selfAddress);
            let grpsReady    = await  getReadyGrps(grps);
            let grpsReadySet = new Set(grpsReady);
            console.log("old group set:",this.preGrpSet);
            console.log("new group set:",grpsReadySet);

            if(equal(this.preGrpSet,grpsReadySet)){
                console.log("------------------------------------no group info changed-----------------------------");
                return;
            }

            this.preGrpSet = grpsReadySet;

            let p = this.buildGrpInfo(grpsReady);

            console.log(">>>>>>>>>>>>>grpInfoPath "+ grpBuildCfg.grpInfoOutPath);
            console.log(">>>>>>>>>>>>>grpInfoFileName "+ grpBuildCfg.grpInfoFileName);
            let fullFileName = path.join(grpBuildCfg.grpInfoOutPath,grpBuildCfg.grpInfoFileName);

            p.then((fileContent)=>{
                if(fileContent.length){
                    this.writeGrpInfoFile(fileContent, fullFileName);
                    //todo notify mpc
                }else{
                    console.log(">>>>>>>>>>>>empty file content.");
                }
            });

        }catch(err){
            console.log("err in mainLoop",err);
        }
    }

    async buildGrpInfo(grpSet) {
        let pkShare = {
          "index":null,
          "pkShare":null
        };

        let grpElem = {
            "index": null,
            "workingPk": null,
            "nodeId": null
        };

        let grpCurve = {
            "gpk": null,
            "curveType": null,
            "pkShares": []
        };

        let oneGrpInfo = {
            "grpId": null,
            "leaderInx": null,
            "totalNumber": null,
            "thresholdNumber": null,
            "grpElms": [],
            "grpCurves":[]
        };

        let fileContent = {
            "grpInfo": []
        };

        console.log(">>>>>>>>>>>len of grpSet "+ grpSet.size);
        if(grpSet.size == 0){
            return "";
        }
        for (let grpId of grpSet) {
            console.log(".............one group ID "+ grpId);
            let oneGrpInfoTemp = Object.assign({}, oneGrpInfo);

            let grpElems = [];  // item : grpElem
            let grpCurves = [];
            try {
                let totalNumber = await getSelectedSmNumber(grpId);
                console.log(".............totalNumber "+totalNumber);
                let thresholdNumber = await  getThresholdByGrpId(grpId);
                console.log(".............thresholdNumber "+thresholdNumber);
                let leaderIndex = 0;

                let curveAndGpk = await getCurveGpk(grpId);
                let  grpInfoContent = await getGrpInfoContent(grpId,totalNumber);

                for (let i = 0; i < totalNumber; i++) {
                    let grpElemTemp = Object.assign({}, grpElem);

                    grpElemTemp.nodeId = grpInfoContent[i].nodeId;
                    console.log(".............nodeId "+grpElemTemp.nodeId);

                    grpElemTemp.workingPk = grpInfoContent[i].workingPk;
                    console.log(".............workingPk "+grpElemTemp.workingPk);

                    grpElemTemp.index = i.toString();
                    console.log(".............index "+grpElemTemp.index);

                    console.log(".............address "+grpInfoContent[i].address);

                    grpElems.push(grpElemTemp);
                }
                // grpCurves
                for(let j = 0;j <curveAndGpk.gpks.length;j++){
                    let grpCurveTemp = Object.assign({},grpCurve);
                    grpCurveTemp.gpk = curveAndGpk.gpks[j];
                    grpCurveTemp.curveType = curveAndGpk.curveTypes[j];

                    let pkShares = [];
                    for(let i = 0; i<totalNumber;i++){
                        let pkShareTemp = Object.assign({},pkShare);
                        pkShareTemp.index = i.toString();
                        pkShareTemp.pkShare =  grpInfoContent[i][j];

                        pkShares.push(pkShareTemp);
                    }
                    grpCurveTemp.pkShares = pkShares;
                    grpCurves.push(grpCurveTemp);
                }
                oneGrpInfoTemp.grpId = grpId;
                oneGrpInfoTemp.leaderInx = "0";
                oneGrpInfoTemp.totalNumber = totalNumber;
                oneGrpInfoTemp.thresholdNumber = thresholdNumber;
                oneGrpInfoTemp.grpElms = grpElems;
                oneGrpInfoTemp.grpCurves = grpCurves;

                fileContent.grpInfo.push(oneGrpInfoTemp);
            } catch (err) {
                console.log(err);
                return "";
            }

        }
        //return fileContent;
        return JSON.stringify(fileContent)
    }

    writeGrpInfoFile(fileContent, filename) {
        console.log(">>>>>>>>>>>>>>>fileContent ",fileContent);
        fs.writeFile(filename, fileContent, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                console.log("writeGrpInfoFile successfully.");
            }
        });
    }
}

global.grpInfo = null;

function getGrpInfoInst() {
    if (global.grpInfo == null) {
        global.grpInfo = new GrpInfo();
    } else {
        return global.grpInfo;
    }
}

module.exports = {
    getGrpInfoInst
};


"use strict"

let fs = require('fs');
let path = require('path');

const {grpBuildCfg} = require('./conf/grpBuild');
const {
    equal,
    getLastBlockNumber,
    getWorkingGrps,
    getThresholdByGrpId,
    getSelectedSmNumber,
    getSelectedSmInfo,
    getPkShareByIndex,
    getGPKByGrpId
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
        this.logger = global.monitorLogger;
        this.metricConfig = global.metricConfig;
        this.regGrp = new Set();
        this.unregGrp = new Set();

        this.preResultGrp = new Set();
        this.resultGrp = new Set();
        this.filter = null;

        this.contract = null;
        this.web3 = null;
    }

    init() {
        try {
            // build the filter using "fromBlock"
            this.filter = grpBuildCfg.filter;
            // build the contract of need to be scanned.

            // build web3
            this.web3 = new Web3(new Web3.providers.HttpProvider(grpBuildCfg.wanNodeURL));
        } catch (err) {
            console.log(err);
        }

    }

    run() {
        // setInterval(() => {
        //     this.mainLoop();
        // }, 3000)

        this.mainLoop();
    }

    async mainLoop() {
        // get all group
        // get all reg event  from block to latest (using init filter)
        // get all unreg event from block to latest
        // get the diff collection
        console.log("------------------------------------Entering mainLoop-----------------------------");
        let lastBlockNumber = await getLastBlockNumber();
        console.log(">>>>>>>>>>>>>>lastBlockNumber: "+lastBlockNumber);
        console.log(">>>>>>>>>>>>>>fromBlkNumber: "+this.filter.fromBlk);
        this.resultGrp = await getWorkingGrps(grpBuildCfg.contractAddress.mortgage, [], this.filter.fromBlk, lastBlockNumber, 3);
        // build grpInfo.json
        if (equal(this.resultGrp, this.preResultGrp)) {
            //todo no change grp, do nothing.
        } else {
            let p = this.buildGrpInfo(this.resultGrp);

            console.log(">>>>>>>>>>>>>grpInfoPath "+ grpBuildCfg.grpInfoOutPath);
            console.log(">>>>>>>>>>>>>grpInfoFileName "+ grpBuildCfg.grpInfoFileName);
            let fullFileName = path.join(grpBuildCfg.grpInfoOutPath,grpBuildCfg.grpInfoFileName);
            //let fullFileName = path.join("/home/jacob/","grpInfo.json");

            p.then((fileContent)=>{
                if(fileContent.length){
                    this.writeGrpInfoFile(fileContent, fullFileName);
                }else{
                    console.log(">>>>>>>>>>>>empty file content.");
                }
            });
            //todo grp have changed, build new grpInfo.json

            //todo notify mpc process
        }
        // all above success , update the filter, especially the from block
        this.filter.fromBlk = lastBlockNumber;
    }

    /*
    * {
	"grpInfo":[
			{
				"grpId": "grouID1",
				"grpPk": "0x04e1b7cca6333dad107c5a3aaa1d65b024e3eb85acf1e5b40138a1a592d181f56453b366ec65dfcf97da7bafa99ccddbc70582554be55830b4a84b47defdd88993",
				"leaderInx": "0",
				"totalNumber": "4",
				"thresholdNumber": "2",
				"grpElms":
				[
					{
						"index": 		"0",
						"workingPk": 	"0x04d9482a01dd8bb0fb997561e734823d6cf341557ab117b7f0de72530c5e2f0913ef74ac187589ed90a2b9b69f736af4b9f87c68ae34c550a60f4499e2559cbfa5",
						"nodeId": 		"0x9c6d6f351a3ede10ed994f7f6b754b391745bba7677b74063ff1c58597ad52095df8e95f736d42033eee568dfa94c5a7689a9b83cc33bf919ff6763ae7f46f8d",
						"pkShare":		"0x04ece82aac77e69c51ab3571f18d2aff697029f76349aa1a5d44875944e28b7ba24717ebf95f6de5ffb5c1c0dfac380138579e5c0f42c5c2013b6a5f7240ba22bb"
					},
					{
						"index": 		"1",
						"workingPk": 	"0x043d0461abc005e082021fb2dd81781f676941b2f922422932d56374646328a8132bb0f7956532981bced30a1aa3301e9134041b399058de31d388651fc005b49e",
						"nodeId": 		"0x78f760cd286c36c5db44c590f9e2409411e41f0bd10d17b6d4fb208cddf8df9b6957a027ee3b628fb685501cad256fefdc103916e2418e0ec9cee4883bbe4e4d",
						"pkShare":		"0x04212b88eb328f51e0042bbe182f1096e0659629cd1244f6d75b6b0102dbfdfa9b644435e63b8b80637b599ba3a163345c19394b849e27684f6e4b40546a5b440b"
					},
					{
						"index": 		"2",
						"workingPk": 	"0x04f65f08b31c46e97751865b24a176f28888f2cef91ffdf95d0cbf3fd71b4abdab7f4b4b55cfac5853198854569bad590ed260557f50e6bc944ad63a274369339a",
						"nodeId": 		"0xdc997644bc12df6da60fef4922e257dc74bd506a05be714fb1380d1031c3eac102085bcc676339aa95b38502a6788ae6e4db329903e92d1a70be7e207c38ad35",
						"pkShare":		"0x04c820dd8d14c89512aa6124f8c0227a1ab5605a56401e32788928e51917cbb5c17c39437045beaeda0aa2ee90d7a00df185c54c43b72cc781390e68e35fcbdb9a"
					},
					{
						"index": 		"3",
						"workingPk": 	"0x042687ff2d4ba1cfa8bbd27aa33d691dabe007a0eaaf109aab2a990154906f00860e5ead9ed95080c144a61a0eabb5df7f109ff348c9b9de68ee133a49c0731fc0",
						"nodeId": 		"0x005d55b8634d6afa930b0a8c31a3cc2c8246d996ed06fb41d2520a4d8155eefa41258440ee2bfff2473191e62495729b9ef86d7be685ac21fd67d71b09cce1a5",
						"pkShare":		"0x04d7d675e1f99cf06d7cf73722dbf412a24ee7b57b549aff6a6dfd6140457386f5da6a531abdb49ebf6db00070d2f730486bd25419b3d91da637eff75d190bf503"
					}

				]
			}

		]
}

     */
    async buildGrpInfo(grpSet) {
        let grpElem = {
            "index": null,
            "workingPk": null,
            "nodeId": null,
            "pkShare": null
        };

        let oneGrpInfo = {
            "grpId": null,
            "grpPk": null,
            "leaderInx": null,
            "totalNumber": null,
            "thresholdNumber": null,
            "grpElms": [],
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

            let grpElems = []; // item : grpElem
            try {
                let totalNumber = await getSelectedSmNumber(grpId);
                console.log(".............totalNumber "+totalNumber);
                let thresholdNumber = await  getThresholdByGrpId(grpId);
                console.log(".............thresholdNumber "+thresholdNumber);
                let leaderIndex = 0;
                // todo error handle
                for (let i = 0; i < totalNumber; i++) {
                    let grpElemTemp = Object.assign({}, grpElem);

                    grpElemTemp.pkShare = await getPkShareByIndex(grpId, i);
                    console.log(".............pkShare "+grpElemTemp.pkShare);

                    let smInfo = await getSelectedSmInfo(grpId, i);
                    //grpElemTemp.nodeId = smInfo.nodeId;
                    grpElemTemp.nodeId = smInfo[2];
                    console.log(".............nodeId "+grpElemTemp.nodeId);


                    //grpElemTemp.workingPk = smInfo.workingPk;
                    grpElemTemp.workingPk = "0x04"+smInfo[1].substr(2);
                    console.log(".............workingPk "+grpElemTemp.workingPk);

                    grpElemTemp.index = i.toString();
                    console.log(".............index "+grpElemTemp.index);

                    console.log(".............address "+smInfo[0]);

                    grpElems.push(grpElemTemp);
                }

                let gpk = await getGPKByGrpId(grpId);
                console.log(".............gpk "+gpk);

                oneGrpInfoTemp.grpId = grpId;

                oneGrpInfoTemp.grpPk = gpk;

                oneGrpInfoTemp.leaderInx = "0";
                oneGrpInfoTemp.totalNumber = totalNumber;
                oneGrpInfoTemp.thresholdNumber = thresholdNumber;
                oneGrpInfoTemp.grpElms = grpElems;


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

    noticeMpc() {

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


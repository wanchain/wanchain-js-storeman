"use strict"

const {metricCfg, abiMap} = require('./conf/metric');

let Contract = require("../contract/Contract");

module.exports = class MetricContract extends Contract{
    constructor(abi, address){
        //console.log(">>>>>Abi:",abi);
        super(abi, address);
    }
    // -1: internal error
    // 0: success
    // 1: rNW
    // 2: sNW
    // 3. rSlsh
    // 4. sSlsh

    // 0: 	wrInct
    // 1:	wrRNW
    // 2.	wrSNW
    // 4.	wrRSlshPolyCM 	wrRSlshPolyData
    // 5.	wrSSlshShare 		wrSSlshPolyPln

    buildData(task){

        console.log("xHash = "+ task.xHash);
        console.log("signedResult = "+ task.signedResult);

        let xHash = task.xHash;
        let signedResult = task.signedResult;
        let functionNames = [];

        // [ [] ]
        let parameters = [];

        let retData = [];
        console.log("begin build functionNames and parameters.");
        switch(signedResult.ResultType){
            case 0:
                functionNames.push("wrInct");
                parameters.push([signedResult.GrpId,xHash,signedResult.IncntData]);
                break;
            case 1:
                functionNames.push("wrRNW");
                parameters.push([signedResult.GrpId,xHash,signedResult.RNW]);
                break;
            case 2:
                functionNames.push("wrSNW");
                parameters.push([signedResult.GrpId,xHash,signedResult.SNW]);
                break;
            case 3:
                functionNames.push("wrRSlshPolyCM");
                parameters.push([signedResult.GrpId,
                    xHash,
                    signedResult.sndrAndRcvrIndex,
                    signedResult.becauseSndr,
                    signedResult.polyCM,
                    signedResult.polyCMR,
                    signedResult.polyCMS]);

                functionNames.push("wrRSlshPolyData");
                parameters.push([signedResult.GrpId,
                        xHash,
                        signedResult.sndrAndRcvrIndex,
                        signedResult.becauseSndr,
                        signedResult.polyData,
                        signedResult.polyDataR,
                    signedResult.polyDataS]);

                break;
            case 4:
                functionNames.push("wrSSlshShare");
                parameters.push([signedResult.GrpId,
                    xHash,
                    signedResult.sndrAndRcvrIndex,
                    signedResult.becauseSndr,
                    signedResult.gpkShare,
                    signedResult.rpkShare,
                    signedResult.m]);


                functionNames.push("wrSSlshPolyPln");
                parameters.push([signedResult.GrpId,
                    xHash,
                    signedResult.sndrAndRcvrIndex,
                    signedResult.becauseSndr,
                    signedResult.polyData,
                    signedResult.polyDataR,
                    signedResult.polyDataS]);

            default:
                break;
        }


        console.log("End build functionNames and parameters.");

        console.log("Begin build customer data by functioNames and parameters.");
        for(let i= 0; i<functionNames.length;i++){

            console.log("functionNames "+ functionNames[i]);
            for(let j= 0; j<parameters[i].length;j++){
                console.log(">>>>>>>>>>>>parameters "+ parameters[i][j]);
            }
            let dataTmp = this.constructData(functionNames[i],...parameters[i]);
            console.log(">>>>>data built is :",dataTmp);
            retData.push(dataTmp);
        }
        console.log("End build customer data by functioNames and parameters.");
        return retData;
    }
};
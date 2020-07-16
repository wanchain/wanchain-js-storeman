"use strict"
const metricCfg = require('../../cfg/config');
const Web3 = require('web3_1.2');

module.exports = class MetricContract {
    constructor(abi, address) {
        //console.log(">>>>>Abi:",abi);

        let web3 = new Web3();
        web3.setProvider(new Web3.providers.HttpProvider(metricCfg.wanNodeURL));

        this.web3 = web3;
        this.metricContract = new web3.eth.Contract(abi, address);
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

    buildData(task) {

        console.log("xHash = " + task.xHash);
        console.log("signedResult = " + task.signedResult);

        let xHash = task.xHash;
        let signedResult = task.signedResult;
        let functionNames = [];

        console.log("begin build functionNames and parameters.");
        switch (signedResult.ResultType) {
            case 0:

                return this.metricContract.methods.wrInct(signedResult.GrpId, xHash, signedResult.IncntData).encodeABI();
            case 1:
                functionNames.push("wrRNW");
                return this.metricContract.methods.wrRNW(signedResult.GrpId, xHash, signedResult.RNW).encodeABI();
            case 2:
                functionNames.push("wrSNW");

                return this.metricContract.methods.wrSNW(signedResult.GrpId, xHash, signedResult.SNW).encodeABI();

            case 3:
                functionNames.push("wrRSlsh");
                let rSlsh = signedResult.RSlsh[0];
                console.log("buildData, wrRSlsh rSlsh:", rSlsh);
                // let rslshData = {
                //     polyCMData: {
                //         polyCM: rSlsh.PolyCM,
                //         polyCMR: rSlsh.PolyCMR,
                //         polyCMS: rSlsh.PolyCMS
                //     },
                //     polyDataPln: {
                //         polyData: rSlsh.PolyData,
                //         polyDataR: rSlsh.PolyDataR,
                //         polyDataS: rSlsh.PolyDataS,
                //     },
                //     sndrIndex: rSlsh.SndrAndRcvrIndex[0],
                //     rcvrIndex: rSlsh.SndrAndRcvrIndex[1],
                //     becauseSndr: rSlsh.BecauseSndr ? 0x01 : 0x00,
                //     curveType: signedResult.CurveType,
                // };

                return this.metricContract.methods.wrRSlsh(signedResult.GrpId,
                    xHash,
                    [[rSlsh.PolyCM, rSlsh.PolyCMR, rSlsh.PolyCMS],
                        [rSlsh.PolyData, rSlsh.PolyDataR, rSlsh.PolyDataS],
                        rSlsh.SndrAndRcvrIndex[0],
                        rSlsh.SndrAndRcvrIndex[1],
                        rSlsh.BecauseSndr ? 0x01 : 0x00,
                        signedResult.CurveType]).encodeABI();
            case 4:
                functionNames.push("wrSSlsh");
                let sSlsh = signedResult.SSlsh[0];
                console.log("buildData, wrSSlsh sSlsh:", sSlsh);
                // let sslshData = {
                //     polyDataPln: {
                //         polyData: sSlsh.PolyData,
                //         polyDataR: sSlsh.PolyDataR,
                //         polyDataS: sSlsh.PolyDataS,
                //     },
                //
                //     gpkShare: sSlsh.GPKShare,
                //     m: sSlsh.M,
                //     rpkShare: sSlsh.RPKShare,
                //
                //     sndrIndex: sSlsh.SndrAndRcvrIndex[0],
                //     rcvrIndex: sSlsh.SndrAndRcvrIndex[1],
                //     becauseSndr: sSlsh.BecauseSndr ? 0x01 : 0x00,
                //     curveType: signedResult.CurveType,
                // };

                return this.metricContract.methods.wrSSlsh(signedResult.GrpId,
                    xHash,
                    [[sSlsh.PolyData, sSlsh.PolyDataR, sSlsh.PolyDataS],
                        sSlsh.M,
                        sSlsh.RPKShare,
                        sSlsh.GPKShare,
                        sSlsh.SndrAndRcvrIndex[0],
                        sSlsh.SndrAndRcvrIndex[1],
                        sSlsh.BecauseSndr ? 0x01 : 0x00,
                        signedResult.CurveType]).encodeABI();

            default:
                return null;
        }
    }
};
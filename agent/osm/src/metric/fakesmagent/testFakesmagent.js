/*
* this test is used to build fake transaction, and build the incentive and slash data when sm agent is not ready.
* test tools only.
 */

"use strict"

const {getIncntSlshWriter} = require('../incntSlshWriter');
const Web3 = require('web3_1.2');
const Web3027 = require('web3');
const abiMap = require('./abi');
const metricCfg = require('./config');
const wanchain = require('../../utils/wanchain');

const CurveType = {
    sk256: '0x00',
    bn256: '0x01'
};

const web3Mpc = require("../../../../../mpc/web3Mpc");
var net = require('net');


function getxHash() {
    return Web3.utils.randomHex(32);
}

let {sleep, getContract} = require('./util');


function getTokenInfo() {
    let asciiTokenOrigAccount = "YCC-Account";
    let token2WanRatio = 10;
    let minDeposit = "10000000000000000000";
    let withdrawDelayTime = 60 * 60 * 72;
    let asciiTokenName = "ycc";
    let asciiTokenSymbol = "YCC";

    return {
        asciiTokenOrigAccount: asciiTokenOrigAccount,
        token2WanRatio: token2WanRatio,
        minDeposit: minDeposit,
        withdrawDelayTime: withdrawDelayTime,
        asciiTokenName: asciiTokenName,
        asciiTokenSymbol: asciiTokenSymbol,
        decimals: 10
    };
}

let {
    asciiTokenOrigAccount,
    token2WanRatio,
    minDeposit,
    withdrawDelayTime,
    asciiTokenName,
    asciiTokenSymbol,
    decimals
} = getTokenInfo();


const {
    equal,
    getGrpsByAdd,
    getReadyGrps,
    getSelectedSmNumber,
    getThresholdByGrpId,
    getCurveGpk,
    getGrpInfoContent,
    noticeMpc
} = require('../../grpInfo/grpInfoUtil');


function hexAdd0x(hexs) {
    if (0 != hexs.indexOf('0x')) {
        return '0x' + hexs;
    }
    return hexs;
}

async function getWKGPK(){
    return new Promise(async (resolve, reject) => {
        try{
            let grps = await getGrpsByAdd(global.workingAddress);
            let wkGrps = await getReadyGrps(grps);
            let gpks = [];
            for(let grpId of wkGrps){
                let grpCurves = await getCurveGpk(grpId);
                for(let ct of grpCurves.curveTypes){
                    let k = 0;
                    if(Number(ct) == 0){
                        //resolve(grpCurves.gpks[k]);
                        gpks.push(grpCurves.gpks[k])
                    }
                    k++;
                }
            }
            resolve(gpks);
        }catch(err){
            console.log("getWKGPK", "error", err);
            reject(err);
        }
    })
}

async function run() {

    // htlc dependence
    let getResult = await getDep();
    console.log("ret getDep", getResult);

    // add TM Token
    await addToken();

    // getIncntSlshWriter();

    let txCount = 0;
    while (1) {
        try {
            txCount++;
            let wkGpks = await getWKGPK();
            if(wkGpks.length > 1){
                if(txCount%2){
                    metricCfg.GPK = wkGpks[0];
                }else{
                    metricCfg.GPK = wkGpks[1];
                }
            }else{
                metricCfg.GPK = wkGpks[0];
            }

            console.log("ret of getWKGPK",metricCfg.GPK);
            // build data
            let xHash = getxHash();
            let typesArray = ['bytes', 'bytes32', 'address', 'uint'];
            let parameters = [Web3.utils.toHex(asciiTokenOrigAccount), xHash, metricCfg.wanAddress, metricCfg.value];


            let coder = require("web3/lib/solidity/coder");
            let data = hexAdd0x(coder.encodeParams(typesArray, parameters));

            // send sign data to mpc
            let sr = await getMpcSignedData(metricCfg.GPK, data, CurveType.sk256);
            console.log(".........ret of getMpcSignedData", sr);

            // send signed result to the queue of metric
            global.incntSlshWriter.handleInctSlsh(xHash, sr);


            let c = await getContract(abiMap.get("htlc"), metricCfg.contractAddress.htlc);
            // await c.methods.inSmgLock(Web3.utils.toHex(asciiTokenOrigAccount),
            //     xHash,
            //     metricCfg.wanAddress,
            //     metricCfg.value,
            //     metricCfg.GPK,
            //     sr.R,
            //     sr.S).send({from: metricCfg.ownerAddress}).on('transactionHash', function (hash) {
            //     console.log("......................inSmgLock transactionHash ", hash);
            // });
            let txData = await c.methods.inSmgLock(Web3.utils.toHex(asciiTokenOrigAccount),
            xHash,
            metricCfg.wanAddress,
            metricCfg.value,
            metricCfg.GPK,
            sr.R,
            sr.S).encodeABI();
            let txHash = await wanchain.sendTx(metricCfg.contractAddress.htlc, txData);
            console.log("......................inSmgLock transactionHash ", txHash);
        } catch (err) {
            console.log("Error in inSmgLock ignore....");
        }

        await sleep(10000);
    }

}

async function getMpcSignedData(gpk, data, curveType) {
    return new Promise(async (resolve, reject) => {
        let web3 = new Web3027();
        web3.setProvider(new Web3027.providers.IpcProvider(metricCfg.ipcUrl, net));
        web3Mpc.extend(web3);

        let signData = {
            pk: gpk,
            data: data,
            Curve: curveType
        };

        try {
            // add valid data
            for (let i = 2; i < 7; i++) {

                try{
                    let ipcUrl = "ipcUrlNode" + i;
                    console.log("......ipcUrl", metricCfg[ipcUrl]);
                    web3.setProvider(new Web3027.providers.IpcProvider(metricCfg[ipcUrl], net));
                    web3Mpc.extend(web3);
                    web3.storeman.addValidData(signData, (err, result) => {
                        if (err) {
                            reject(err);
                        }
                    });
                }catch(err){
                    console.log("......err", err);
                }
            }
            // send sign data to mpc
            web3.setProvider(new Web3027.providers.IpcProvider(metricCfg.ipcUrl, net));
            web3.storeman.signData(signData, (err, result) => {
                if (!err) {
                    resolve(result);
                } else {
                    reject(err);
                }
            })
        } catch (err) {
            reject(err);
        }
    })
}

async function addToken() {
    return new Promise(async (resolve, reject) => {

        try {
            let abi = abiMap.get("tm");
            let address = metricCfg.contractAddress.tm;
            console.log(metricCfg.wanNodeURL);

            var web3 = new Web3();
            web3.setProvider(new Web3.providers.HttpProvider(metricCfg.wanNodeURL));

            let c = new web3.eth.Contract(abi, address);
            await c.methods.addToken(asciiTokenOrigAccount, token2WanRatio, minDeposit, withdrawDelayTime, asciiTokenName, asciiTokenSymbol, decimals);
            resolve();
        } catch (err) {
            reject(err);
        }
    })
}

function getDep() {
    console.log("Entering getDep function");
    return new Promise(async (resolve, reject) => {
        try {
            let abi = abiMap.get("htlc");
            let address = metricCfg.contractAddress.htlc;
            console.log(metricCfg.wanNodeURL);

            var web3 = new Web3();
            web3.setProvider(new Web3.providers.HttpProvider(metricCfg.wanNodeURL));

            let c = new web3.eth.Contract(abi, address);
            let data = await c.methods.getEconomics().call();
            if (data[0].length) {
                resolve(true);
            }

        } catch (err) {
            console.log("setDep err:", err);
            reject(err);
        }
        ;
    })
}

function startFakeSmagent() {
    run();
}

// startFakeSmagent();

module.exports = {
    startFakeSmagent
};

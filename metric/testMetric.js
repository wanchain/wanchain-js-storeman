"use strict"

const {getIncntSlshWriter} = require('./incntSlshWriter');

const Web3 = require('web3');
const {metricCfg,abiMap} = require('./conf/metric');

//const xHashInct = '0xec4916dd28fc4c10d78e287ca5d9cc51ee1ae73cbfde08c6b37324cbfaac8bc5';
const xHashInct = '0xec4916dd28fc4c10d78e287ca5d9cc51ee1ae73cbfde08c6b37324cbfaac8bc6';
//const xRNW = '0x0000000000000000000000000000000000000000000000000000000000000002';
const xRNW = '0x0000000000000000000000000000000000000000000000000000000000000003';

const xHashLockSmg = '0x0000000000000000000000000000000000000000000000000000007868617368';

function test() {
    // let isw = getIncntSlshWriter();
    // isw.run();

    getIncntSlshWriter();
    global.incntSlshWriter.run();

    let incSr = {
        GrpId: "0x67726f75494431",
        IncntData: "0x0f",
        R: "0x04c94709ccfa6e2d0d0ffcb75418c104e614f43cb29b82a7c2d1cf90870bf088dcf98350bacd8ecc636b05109994cb29c239b436e0487719e877967beba26742cf",
        RNW: "0x",
        RSlsh: null,
        ResultType: 0,
        S: "0x5cedb42d1f9790320da49197d88eba43a8699925b4d0839886926023fe740c86",
        SNW: "0x",
        SSlsh: null
    }

    let slshSr = {
        GrpId: "0x0000000000000000000000000000000000000031353839393533323738313235",
        IncntData: "0x",
        R: "0x",
        RNW: "0x0e",
        RSlsh: null,
        ResultType: 1,
        S: "0x",
        SNW: "0x",
        SSlsh: null
    }

    let incLockSmgSr = {
        GrpId: "0x0000000000000000000000000000000000000031353839393533323738313235",
        IncntData: "0x07",
        R: "0x042889675e82ca348bc8769ecf0b4533dec112a4531ea4024f15a8b96e154d1447d634f50078cb2003b13fc0324c60798c1eb58954bfcbfcf1293b42959615b686",
        RNW: "0x",
        RSlsh: null,
        ResultType: 0,
        S: "0x62926fc0009c1d3d854d060dd64ead34573be15c60373dbf3a3d070ae2a01422",
        SNW: "0x",
        SSlsh: null
    }

    global.incntSlshWriter.handleInctSlsh(xHashInct, incSr);
    global.incntSlshWriter.handleInctSlsh(xHashLockSmg, incLockSmgSr);
    global.incntSlshWriter.handleInctSlsh(xRNW, slshSr);


}

//test();

function mainTest(){
    testCheckSig();
    //test();
    testGetEpid();
    //testGetEpidOK();
}

mainTest();


function Hexstring2btye(str){
    let pos = 0;
    let len = str.length;
    if (len % 2 != 0) {
        return null;
    }
    len /= 2;
    let hexA = new Array();
    for (let i = 0; i < len; i++) {
        let s = str.substr(pos, 2);
        let v = parseInt(s, 16);
        hexA.push(v);
        pos += 2;
    }
    return hexA;
}

function Bytes2HexString(b){
    let hexs = "";
    for (let i = 0; i < b.length; i++) {
        let hex = (b[i]).toString(16);
        if (hex.length === 1) {
            hexs = '0' + hex;
        }
        hexs += hex.toUpperCase();
    }
    return hexs;
}


async function testCheckSig() {
    // build contract
    let web3 = new Web3(new Web3.providers.HttpProvider("http://192.168.1.179:7654"));
    let c = web3.eth.contract(abiMap["Metric"]);
    let cInst = c.at(metricCfg.contractAddress.metric);
    try{

        // let b = new Buffer("04d9482a01dd8bb0fb997561e734823d6cf341557ab117b7f0de72530c5e2f0913ef74ac187589ed90a2b9b69f736af4b9f87c68ae34c550a60f4499e2559cbfa5",'hex');
        // console.log(web3.fromAscii(web3.toAscii("0x04d9482a01dd8bb0fb997561e734823d6cf341557ab117b7f0de72530c5e2f0913ef74ac187589ed90a2b9b69f736af4b9f87c68ae34c550a60f4499e2559cbfa5")));
        //
        //  // for(let i = 0; i< b.length; i++){
        //  //     console.log(b[i]);
        //  // }


        let ret = await cInst.checkSig('0xb536ad7724251502d75380d774ecb5c015fd8a191dd6ceb05abf677e281b81e1',
            '0xba1d75823c0f4c07be3e07723e54c3d503829d3c9d0599a78426ac4995096a17',
            '0x9a3b16eac39592d14e53b030e0275d087b9e6b38dc9d47a7383df40b4c7aec90',
            '0x04d9482a01dd8bb0fb997561e734823d6cf341557ab117b7f0de72530c5e2f0913ef74ac187589ed90a2b9b69f736af4b9f87c68ae34c550a60f4499e2559cbfa5');

        //let ret = await cInst.checkSigTest();
        console.log("check sig result");
        console.log(ret);
    }catch(err){
        console.log(err);
    }
    // call checkSig()
}


async function testGetEpid() {
    // build contract
    let web3 = new Web3(new Web3.providers.HttpProvider("http://192.168.1.179:7654"));
    let c = web3.eth.contract(abiMap["Metric"]);

    let cInst = c.at(metricCfg.contractAddress.metric);
    console.log(".........metric address"+metricCfg.contractAddress.metric);
    try{

        let nowTm = Math.floor(+ new Date()/1000);

        let bn = web3.toBigNumber(nowTm);
        console.log("!!!!!!!!!now timestamp"+nowTm);
        console.log(".........bn "+bn);
        console.log(".........bn"+bn);
        let epochIdSc = await cInst.getEpochId(nowTm);
        let epochIdSc1 = await cInst.getEpochId(bn);
        console.log(epochIdSc);
        console.log(epochIdSc1);

    }catch(err){
        console.log(err);
    }
    // call checkSig()
}


async function testGetEpidOK() {
    let web3 = new Web3(new Web3.providers.HttpProvider("http://192.168.1.179:7654"));
    let abiOk = [
        {
            "constant": true,
            "inputs": [
                {
                    "name": "epochId",
                    "type": "uint256"
                }
            ],
            "name": "getRandomNumberByEpochId",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "timestamp",
                    "type": "uint256"
                }
            ],
            "name": "getRandomNumberByTimestamp",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "blockTime",
                    "type": "uint256"
                }
            ],
            "name": "getEpochId",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "blockTime",
                    "type": "uint256"
                }
            ],
            "name": "getEpochIdId",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }
    ];
    let c = web3.eth.contract(abiOk);

    let cInst = c.at('0x06f1a4ceAF031c3C2834a786Ac6200b6750B1b46');
    try{

        let nowTm = Math.floor(+ new Date()/1000);

        let bn = web3.toBigNumber(nowTm);
        console.log(".........now timestamp"+nowTm);
        console.log(".........bn "+bn);
        console.log(".........bn"+bn);
        let epochIdSc = await cInst.getEpochId(nowTm);
        console.log(epochIdSc);
        //let epochIdSc1 = await cInst.getEpochId(bn);



    }catch(err){
        console.log(err);
    }
    // let myWeb3 = new Web3(new Web3.providers.HttpProvider("http://192.168.1.179:7654"));
    // let now = Math.floor(Date.now() / 1000);
    // console.log("timestamp:" + now);
    // let c = myWeb3.eth.contract([
    //     {
    //         "constant": true,
    //         "inputs": [
    //             {
    //                 "name": "epochId",
    //                 "type": "uint256"
    //             }
    //         ],
    //         "name": "getRandomNumberByEpochId",
    //         "outputs": [
    //             {
    //                 "name": "",
    //                 "type": "uint256"
    //             }
    //         ],
    //         "payable": false,
    //         "stateMutability": "view",
    //         "type": "function"
    //     },
    //     {
    //         "constant": true,
    //         "inputs": [
    //             {
    //                 "name": "timestamp",
    //                 "type": "uint256"
    //             }
    //         ],
    //         "name": "getRandomNumberByTimestamp",
    //         "outputs": [
    //             {
    //                 "name": "",
    //                 "type": "uint256"
    //             }
    //         ],
    //         "payable": false,
    //         "stateMutability": "view",
    //         "type": "function"
    //     },
    //     {
    //         "constant": true,
    //         "inputs": [
    //             {
    //                 "name": "blockTime",
    //                 "type": "uint256"
    //             }
    //         ],
    //         "name": "getEpochId",
    //         "outputs": [
    //             {
    //                 "name": "",
    //                 "type": "uint256"
    //             }
    //         ],
    //         "payable": false,
    //         "stateMutability": "view",
    //         "type": "function"
    //     },
    //     {
    //         "constant": true,
    //         "inputs": [
    //             {
    //                 "name": "blockTime",
    //                 "type": "uint256"
    //             }
    //         ],
    //         "name": "getEpochIdId",
    //         "outputs": [
    //             {
    //                 "name": "",
    //                 "type": "uint256"
    //             }
    //         ],
    //         "payable": false,
    //         "stateMutability": "view",
    //         "type": "function"
    //     }
    // ]);
    // let cInst =  c.at('0x08D7d61472dc0C247B10BBFA5a88772979C536Ae');
    // let ret = await cInst.getEpochId(now);
    // console.log(cInst.address);
    // console.log(ret);
    // call checkSig()
}

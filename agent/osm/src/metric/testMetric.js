"use strict"

const {getIncntSlshWriter} = require('./incntSlshWriter');
const Web3 = require('web3_1.2');

const abiMap = require('../../cfg/abi');
const metricCfg = require('../../cfg/config');

const fakeSmgAddr = '0x4359a1e5A069a0edA8FE23eA654589EE81341E47';
const ownerAddr = '0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e';

function getxHash(){
    return Web3.utils.randomHex(32);
}

async function test() {

    try{
      let ret =  await setDep();
      console.log("ret of setDep ",ret);
    }catch(err){
        console.log("err of setDep",err);
    }



    let incSR = {
        GrpId: "0x0000000000000000000000000000000000000031353839393533323738313235",
        IncntData: "0x0f",
        R: "0x04c94709ccfa6e2d0d0ffcb75418c104e614f43cb29b82a7c2d1cf90870bf088dcf98350bacd8ecc636b05109994cb29c239b436e0487719e877967beba26742cf",
        RNW: "0x",
        RSlsh: null,
        ResultType: 0,
        S: "0x5cedb42d1f9790320da49197d88eba43a8699925b4d0839886926023fe740c86",
        SNW: "0x",
        SSlsh: null
    };

    let slshNwSR = {
        GrpId: "0x0000000000000000000000000000000000000031353839393533323738313235",
        IncntData: "0x",
        R: "0x",
        RNW: "0x0e",
        RSlsh: null,
        ResultType: 1,
        S: "0x",
        SNW: "0x",
        SSlsh: null
    };

    let rSlshSR = {
        CurveType: 0,
            GrpId: "0x0000000000000000000000000000000000000031353839393533323738313235",
        IncntData: "0x",
        R: "0x",
        RNW: "0x",
        RSlsh: [{
        BecauseSndr: true,
        PolyCM: "0x954bb8ad1570066f3493ca925a6554eb7729ab08f15bb273ed85fbe60d0e624cb55ec9e3f34e19dde7113730bd80e14c265d4a1b831f0fe9f4f8813c04480caf5327d31d6c248cb087f9a0c2916f5b0ce1a04a4823fbc69435fbec169a3d7605f34c64346a7c2956ec128d5646c1ddc1037fc09cc95317b7e91a1a3d44bb9d823e0ce8c7f5892db6a963da03379efb4f4c4f9d3371ba421db6f2cdb37c4efbad7908362a1835a7db5180e81572a8a54a4ff0c53d59dac50515ddd1c6959d9b96",
        PolyCMR: "0x73015869cfd7d88cfb03313dd61023f0142d51f084619025ed25abe405ff70f5",
        PolyCMS: "0x8a9e2240cf1ece2e622aa9921198680c61fec256fefeef25b7f2ac6f8876c118",
        PolyData: "0x01",
        PolyDataR: "0x050d5a7de8fceb70797c9ff20bf8cfbcc64c62766bdf29f856a7ecd12a584e03",
        PolyDataS: "0x30fcf0dc4ecf55304e36ae4bab43678e1f99165715ecb7bffe7fc073e71a6bce",
        SndrAndRcvrIndex: [0, 2]
    }],
        ResultType: 3,
        S: "0x",
        SNW: "0x",
        SSlsh: null
    };

    let sSlshSR = {
        CurveType: 0,
        GrpId: "0x0000000000000000000000000000000000000031353839393533323738313235",
        IncntData: "0x",
        R: "0x",
        RNW: "0x",
        RSlsh: null,
        ResultType: 4,
        S: "0x",
        SNW: "0x",
        SSlsh: [{
            BecauseSndr: false,
            GPKShare: "0x0524fd8df2a7ebbe41c5d12a77618577997cc3cc27af411e4875cebf1d28345044ffc19e776e91141d19e8d77bc4f18d0d0b134c5af603492b9ba99c98992cd4",
            M: "0x03ba160b024683e5051fff3e6ca013c28193c82e89fc9e16dcfb7f1bda67ea60",
            PolyData: "0x08fad6d6eaaae87c7549e2cb958a53830649deec99ded906ab22d6cbea69f3d9",
            PolyDataR: "0x5f9f00cee1ccd39a1dbf1974f0bbec2f93d3696455fb5feb73ba86242ce31e4c",
            PolyDataS: "0x01",
            RPKShare: "0x6be1c26d1e43b316b2297ee5d56a8f92d2a4b64d285f1a24cfdeae0467678708e4abd971e62d82f134ea9c3ce1b56334df0c17308da68062b7e69ac8c68ca868",
            SndrAndRcvrIndex: [2, 0]
        }]
    };

    getIncntSlshWriter();
    global.incntSlshWriter.handleInctSlsh(getxHash(), incSR);
    global.incntSlshWriter.handleInctSlsh(getxHash(), slshNwSR);
    global.incntSlshWriter.handleInctSlsh(getxHash(), rSlshSR);
    global.incntSlshWriter.handleInctSlsh(getxHash(), sSlshSR);

    global.incntSlshWriter.run();

}



function setDep(){
    console.log("Entering setDep function");
    return new Promise(async (resolve, reject) =>{
        try{
            let abi = abiMap.get("metric");
            let address = metricCfg.contractAddress.metric;
            console.log(metricCfg.wanNodeURL);

            var web3 = new Web3();
            web3.setProvider(new Web3.providers.HttpProvider(metricCfg.wanNodeURL));

            let c = new web3.eth.Contract(abi,address);
            let deps = await c.methods.getDependence().call();
            console.log("old deps is ",deps);
            let data = await c.methods.setDependence(fakeSmgAddr,fakeSmgAddr).send({from:ownerAddr});
            resolve(data);

        }catch(err){
            console.log("setDep err:",err);
            reject(err);
        };
    })

}

function mainTest(){
    //testCheckSig();
    testGetEpidOK();
}

function testWeb3(){
    let abi = abiMap.get("metric");
    let address = metricCfg.contractAddress.metric;

    console.log("Entering testWeb3");
    console.log(metricCfg.wanNodeURL);
    let web3 = new Web3(Web3.providers.HttpProvider(metricCfg.wanNodeURL));

    let c = new web3.eth.Contract(abi,address);
    let data = c.methods.wrRSlsh("0x73015869cfd7d88cfb03313dd61023f0142d51f084619025ed25abe405ff70f5",
        "0x73015869cfd7d88cfb03313dd61023f0142d51f084619025ed25abe405ff70f5",
        [["0x954bb8ad1570066f3493ca925a6554eb7729ab08f15bb273ed85fbe60d0e624cb55ec9e3f34e19dde7113730bd80e14c265d4a1b831f0fe9f4f8813c04480caf5327d31d6c248cb087f9a0c2916f5b0ce1a04a4823fbc69435fbec169a3d7605f34c64346a7c2956ec128d5646c1ddc1037fc09cc95317b7e91a1a3d44bb9d823e0ce8c7f5892db6a963da03379efb4f4c4f9d3371ba421db6f2cdb37c4efbad7908362a1835a7db5180e81572a8a54a4ff0c53d59dac50515ddd1c6959d9b96",
        "0x73015869cfd7d88cfb03313dd61023f0142d51f084619025ed25abe405ff70f5",
        "0x8a9e2240cf1ece2e622aa9921198680c61fec256fefeef25b7f2ac6f8876c118"],
        ["0x01",
        "0x050d5a7de8fceb70797c9ff20bf8cfbcc64c62766bdf29f856a7ecd12a584e03",
        "0x01"],
        0x00,
        0x02,
        0x01,
        0x00]).encodeABI();
    console.log(data);
}

//testWeb3();
test();
//mainTest();


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
    let web3 = new Web3(new Web3.providers.HttpProvider(metricCfg.wanNodeURL));
    let c = web3.eth.contract(abiMap.get("metric"));
    let cInst = c.at(metricCfg.contractAddress.metric);
    try{
        let ret = await cInst.checkSig('0xb536ad7724251502d75380d774ecb5c015fd8a191dd6ceb05abf677e281b81e1',
            '0xba1d75823c0f4c07be3e07723e54c3d503829d3c9d0599a78426ac4995096a17',
            '0x9a3b16eac39592d14e53b030e0275d087b9e6b38dc9d47a7383df40b4c7aec90',
            '0x04d9482a01dd8bb0fb997561e734823d6cf341557ab117b7f0de72530c5e2f0913ef74ac187589ed90a2b9b69f736af4b9f87c68ae34c550a60f4499e2559cbfa5');

        console.log("check sig result");
        console.log(ret);
    }catch(err){
        console.log(err);
    }
    // call checkSig()
}

async function testGetEpidOK() {
    let web3 = new Web3(new Web3.providers.HttpProvider(metricCfg.wanNodeURL));
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
    }catch(err){
        console.log(err);
    }
}

const path = require('path');
const globalConfig = require('../../../conf/config');

exports.wanNodeURL = globalConfig.testnet.wanWeb3Url;
// exports.wanNodeURL = 'http://127.0.0.1:7654';

exports.contractAddress = {
    smg: '0x0730b955378707aBcE29d0Af0aBcf56c568fbf8F',
    gpk: '0xEda4aBc60993AbA0dA93396196Bf7BB348Eb8410',
    metric: '0x31f7C0C98233A3aeB2FCD1AdD55977Fa1f14761F'
};

exports.keystore = {
    path: global.keystore,
    pwd: global.secret['WORKING_PWD']
    // path: path.join(__dirname, '../keystore/0x5793e629c061e7fd642ab6a1b4d552cec0e2d606'),
    // pwd: 'wanglu',
};

//todo should input the real mpc's config path
//exports.grpInfoOutPath = __dirname;
exports.grpInfoOutPath = path.join(__dirname,"../../../../schnorrmpc/data/");
exports.grpInfoFileName = "groupInfo.json";

exports.gasPrice = 180000000000;
exports.gasLimit = 10000000;

exports.dbUrl = global.dbUrl;
exports.dbOption = global.dbOption;

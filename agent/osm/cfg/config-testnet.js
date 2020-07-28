const path = require('path');
const globalConfig = require('../../../conf/config');

exports.wanNodeURL = globalConfig.testnet.wanWeb3Url;
// exports.wanNodeURL = 'http://127.0.0.1:7654';

exports.contractAddress = {
    smg: '0x342603eE99A8475Ef0F19d7B9E45408848f33790',
    gpk: '0x388bF68f7c5Af29757438D3F6C829dA569C4c60F',
    metric: '0xaabEF8320C6C8d802ea9dd59f9443eC0E10740d7'
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

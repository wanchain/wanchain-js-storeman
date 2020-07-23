const path = require('path');
const globalConfig = require('../../../conf/config');

exports.wanNodeURL = globalConfig.testnet.wanWeb3Url;
// exports.wanNodeURL = 'http://127.0.0.1:7654';

exports.contractAddress = {
    smg: '0x03aCcC1120CFCF9192739E06576d30ef5cca7deB',
    gpk: '0x9475e9645C7EA7025F074FA5ACac374596753b4A',
    metric: '0xB5aeb49FbFDC621D08EcCCA40770C9E17688C0dD'
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

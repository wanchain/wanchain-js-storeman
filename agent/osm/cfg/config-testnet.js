const path = require('path');
const globalConfig = require('../../../conf/config');

exports.wanNodeURL = globalConfig.testnet.wanWeb3Url;
// exports.wanNodeURL = 'http://127.0.0.1:7654';

exports.contractAddress = {
    smg: '0x627e8f93c89ea22f5414aba9d2304c0f2009aba5',
    gpk: '0xa358c0640D56350115Ca3875167aCCAee63871a0',
    metric: '0x72D5C87150092f5842B9b0E4386b98e456AE0497'
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

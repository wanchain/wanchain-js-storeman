const path = require('path');
const globalConfig = require('../../../conf/config');

exports.wanNodeURL = globalConfig.testnet.wanWeb3Url;
// exports.wanNodeURL = 'http://127.0.0.1:7654';

exports.contractAddress = {
    smg: '0xa4d326aBe48cD29dA6441b9672615e6CC651513D',
    gpk: '0xE31289389530cabb4b3d2fc82FD7Fb724E80dc5f',
    metric: '0x4A18571CDa0898313E9CD1eeaB63EB6712C4b0A2'
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

exports.slashRounds = 0;

const globalConfig = require('../../../conf/config');

exports.wanNodeURL = globalConfig.main.wanWeb3Url;

exports.contractAddress = {
    smg: '0x06D7840Ab88F52248257ec340f2CD2a6213B1369',
    gpk: '0xa7D83D33E76e08FF1218AFa9bEa90fED3B732F8D',
    metric: '0x8e84b41800d7915aD3fF9E6bbba434c7ca99fB95'
};

exports.keystore = {
    path: global.keystore,
    pwd: global.secret['WORKING_PWD']
};

//todo should input the real mpc's config path
exports.grpInfoOutPath = __dirname;
exports.grpInfoFileName = "grpInfo.json";

exports.gasPrice = 180000000000;
exports.gasLimit = 10000000;

exports.dbUrl = global.dbUrl;
exports.dbOption = global.dbOption;
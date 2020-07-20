const path = require('path');
const globalConfig = require('../../../conf/config');

//exports.wanNodeURL = globalConfig.testnet.wanWeb3Url;
exports.wanNodeURL = 'http://127.0.0.1:7654';

exports.contractAddress = {
    smg: '0x06D7840Ab88F52248257ec340f2CD2a6213B1369',
    gpk: '0xa7D83D33E76e08FF1218AFa9bEa90fED3B732F8D',
    metric: '0x5e9F6a7875F97Eb84Bf68514fA09a1a45cf9FDa2'
};

exports.keystore = {
    //todo should input the real keystore path
    //path: global.keystore,
    path: path.join(__dirname, '../keystore/0x5793e629c061e7fd642ab6a1b4d552cec0e2d606'),
    pwd: 'wanglu',
};


//todo should input the real mpc's config path
exports.grpInfoOutPath = __dirname;
exports.grpInfoFileName = "grpInfo.json";

exports.startBlock = 2479267;

exports.gasPrice = 180000000000;
exports.gasLimit = 10000000;

let dbServer = {
    "hosts": "192.168.1.58:27017",
    "replica": "",
    "database": "osm-testnet",
    "username": "dev",
    "password": "wanglu"
};

exports.dbOptions = {
    // useNewUrlParser: true,
    keepAlive: true,
    reconnectTries: Number.MAX_VALUE
};

exports.dbUrl = function (readSecondary = false) {
    let dbString = 'mongodb://';
    if (dbServer.name) {
        dbString += (dbServer.username + ':' + dbServer.password + '@');
    }
    dbString += dbServer.hosts;
    dbString += ('/' + dbServer.database);
    dbString += '?authSource=admin';
    if (dbServer.replica) {
        dbString += ('&replicaSet=' + dbServer.replica);
    }
    if (readSecondary) {
        dbString += '&readPreference=secondaryPreferred';
    }
    return dbString;
};
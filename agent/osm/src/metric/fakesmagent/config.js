const path = require('path');

exports.wanNodeURL = 'http://127.0.0.1:7654';
exports.ipcUrl = '/home/jacob/mpc_poc/data1/gwan.ipc';
exports.ipcUrlNode2 = '/home/jacob/mpc_poc/data2/gwan.ipc';
exports.ipcUrlNode3 = '/home/jacob/mpc_poc/data3/gwan.ipc';

exports.contractAddress = {
    htlc:'0x6d317407Ae7Ff8412e31C13Ce1a27eEa533C5731',
    tm:'0x29786De4f8Da347C84CE6440E1822D05BEF6C55f'
};

exports.keystore = {
    //todo should input the real keystore path
    //path: global.keystore,
    path: '/home/jacob/wanchain/openStoreman/test/keystore',
    pwd: 'wanglu',
};


exports.selfAddress = "0x2e54a80b977fd1859782e2ee96a76285a7fc75ba";
exports.ownerAddress = "0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e";

exports.wanAddress = "0x2e54a80b977fd1859782e2ee96a76285a7fc75ba";  // used for inSmgLock parameter.
exports.value = 0x1000000000; //1-G
exports.GPK = "0x82e5d4ad633e9e028b283e52338e4fe4c5467091fd4f5d9aec74cb78c25738be1154a9b1cff44b7fe935e774da7a9fad873b76323573138bc361a9cfdb6a20d2";

exports.gasPrice = 180000000000;
exports.gasLimit = 10000000;
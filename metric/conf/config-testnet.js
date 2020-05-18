const path = require('path');

exports.wanNodeURL = 'http://192.168.1.179:7654';

exports.contractAddress = {
    createGpk: '0xb9DD855dc6A9340Ea6B566A5B454202115BcF485',
    mortgage: '0xBf39C3FA9EEc3754629A8Fe0B34b84E117a3Ec8B',
    //metric: '0x8D7ADa79B4a89Bdc95653696A3A289A1E5629763',   // proxy address
    metric: '0x8e84b41800d7915aD3fF9E6bbba434c7ca99fB95',   // proxy address
};

exports.selfAddress = "0x2e54a80b977fd1859782e2ee96a76285a7fc75ba";

exports.keystore = {
    //path: path.join(__dirname, '../keystore/0xb9DD855dc6A9340Ea6B566A5B454202115BcF485'),
    path: '/home/jacob/wanchain/openStoreman/test/keystore',
    //pwd: '123456',
    pwd: 'wanglu',
};

// exports.gasPrice = 1000000000;
// exports.gasLimit = 470000;

exports.gasPrice = 1000000000;
exports.gasLimit = 470000;
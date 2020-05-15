const path = require('path');

exports.wanNodeURL = 'http://192.168.1.198:5101';

exports.contractAddress = {
    createGpk: '0xb9DD855dc6A9340Ea6B566A5B454202115BcF485',
    mortgage: '0xb9DD855dc6A9340Ea6B566A5B454202115BcF485',
    metric: '0x8D7ADa79B4a89Bdc95653696A3A289A1E5629763',   // proxy address
};

exports.selfAddress = "0xF74256dda89B4AF2c341A314F9549fEade0304e9";

exports.keystore = {
    //path: path.join(__dirname, '../keystore/0xb9DD855dc6A9340Ea6B566A5B454202115BcF485'),
    path: '/home/jacob/mpc_test_1/data1/keystore',
    pwd: '123456',
};


exports.gasPrice = 1000000000;
exports.gasLimit = 470000;


exports.filter = {
    fromBlk: '123456',
    address: contractAddress.createGpk,
};

exports.regGrpEvtName = 'GpkCreatedLogger';
exports.unregGrpEvtName = 'GpkCreatedLogger';

exports.grpInfoOutPath = '/home/jacob';
exports.grpInfoFileName = 'grpInfo.json';
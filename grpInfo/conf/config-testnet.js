const path = require('path');


let gpkAddr = '0xb9DD855dc6A9340Ea6B566A5B454202115BcF485';
let mortgageAddr = '0x06e685F98a1087e789ade454AbB3f0033DDA8d11';
let metricAddr = '0x8e84b41800d7915aD3fF9E6bbba434c7ca99fB95';


//exports.wanNodeURL = 'http://192.168.1.198:5101';
exports.wanNodeURL = 'http://192.168.1.179:7654';

exports.contractAddress = {
    createGpk: gpkAddr,
    mortgage: mortgageAddr,
    metric: metricAddr,   // proxy address
};

//exports.selfAddress = "0xF74256dda89B4AF2c341A314F9549fEade0304e9";
exports.selfAddress = "0x2e54a80b977fd1859782e2ee96a76285a7fc75ba";

exports.keystore = {
    //path: path.join(__dirname, '../keystore/0xb9DD855dc6A9340Ea6B566A5B454202115BcF485'),
    path: '/home/jacob/wanchain/openStoreman/test/keystore',
    //pwd: '123456',
    pwd: 'wanglu',
};


exports.gasPrice = 1000000000;
exports.gasLimit = 470000;


// exports.filter = {
//     fromBlk: '0',
//     address: gpkAddr,
// };

exports.filter = {
    fromBlk: '0',
    address: mortgageAddr,
};

exports.regGrpEvtName = 'StoremanGroupRegistrationLogger';
exports.unregGrpEvtName = 'StoremanGroupApplyUnRegistrationLogger';

exports.grpInfoOutPath = "/home/jacob/";
exports.grpInfoFileName = "grpInfo.json";
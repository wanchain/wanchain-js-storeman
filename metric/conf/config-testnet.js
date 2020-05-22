const path = require('path');

exports.wanNodeURL = 'http://192.168.1.179:7654';

exports.contractAddress = {
    createGpk: '0xdb1B1ADA7ca4874544A482F78E0c47e2300916e6',
    mortgage: '0x49fde469b39389Cd93999A3Ec092143C01c5f411',
    //metric: '0x8e84b41800d7915aD3fF9E6bbba434c7ca99fB95',   // proxy address
    metric: '0x2208577B3329101A4C168f95Be34A54C61c33b9A',   // proxy address

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
//exports.gasLimit = 470000;
exports.gasLimit = 470000;
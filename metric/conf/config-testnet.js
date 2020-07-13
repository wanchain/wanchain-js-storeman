const path = require('path');

exports.wanNodeURL = 'http://192.168.1.179:7654';

exports.contractAddress = {
    createGpk: '0xdb1B1ADA7ca4874544A482F78E0c47e2300916e6',
    mortgage: '0xc3EAc95eCf5D0a197dE5632E299b6d4ec109b7Fe',
    metric: '0x38CD2572C58Ff51F378C7a45453a27ddc8F63721',

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
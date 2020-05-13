const path = require('path');

exports.wanNodeURL = 'http://192.168.1.198:5101';

exports.contractAddress = {
    createGpk: '0xb9DD855dc6A9340Ea6B566A5B454202115BcF485',
    mortgage: '0xb9DD855dc6A9340Ea6B566A5B454202115BcF485',
    metric: '0xb9DD855dc6A9340Ea6B566A5B454202115BcF485',
};

exports.selfAddress = "0xF74256dda89B4AF2c341A314F9549fEade0304e9";

exports.keystore = {
    //path: path.join(__dirname, '../keystore/0xb9DD855dc6A9340Ea6B566A5B454202115BcF485'),
    path: '/home/jacob/mpc_test_1/data1/keystore',
    pwd: '123456',
};

exports.gasPrice = 1000000000;
exports.gasLimit = 470000;
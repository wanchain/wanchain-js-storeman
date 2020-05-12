const path = require('path');

exports.wanNodeURL = 'http://192.168.1.58:18545';

exports.contractAddress = {
    createGpk: '0xec4916dd28fc4c10d78e287ca5d9cc51ee1ae73cbfde08c6b37324cbfaac8bc5',
    mortgage: '0xec4916dd28fc4c10d78e287ca5d9cc51ee1ae73cbfde08c6b37324cbfaac8bc5',
    metric:'0xec4916dd28fc4c10d78e287ca5d9cc51ee1ae73cbfde08c6b37324cbfaac8bc5',
};

exports.selfAddress = "0x979d4A9535C5A3596E6235E32295706CFDD71D38";

exports.keystore = {
    //path: path.join(__dirname, '../keystore/0xb9DD855dc6A9340Ea6B566A5B454202115BcF485'),
    path: '/home/jacob/mpc_test_1/data1/keystore',
    pwd: '123456',
};

exports.gasPrice = 1000000000;
exports.gasLimit = 4700000;
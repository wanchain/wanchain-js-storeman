const path = require('path');
const globalConfig = require('../../../../../conf/config');
exports.wanNodeURL = globalConfig.testnet.wanWeb3Url;

exports.ipcUrl = path.join(__dirname,'../../../../../../../osm1/schnorrmpc/data/gwan.ipc');
exports.ipcUrlNode2 = path.join(__dirname,'../../../../../../../osm2/schnorrmpc/data/gwan.ipc');
exports.ipcUrlNode3 = path.join(__dirname,'../../../../../../../osm3/schnorrmpc/data/gwan.ipc');
exports.ipcUrlNode4 = path.join(__dirname,'../../../../../../../osm4/schnorrmpc/data/gwan.ipc');

exports.contractAddress = {
    htlc:'0xBC14e83fB52eB2b3233E067ed6dA4a0D45014495',
    tm:'0xDec3496f689DA75F3adA0b3e9C314944153e80Fe'
};
exports.GPK = "0x6164a0f5a32836c7b5b4de8049fda5c78361ff0f7edd5570c54c0ecafc7508de514dbe209ce0d4693271f836773d9f78bd0d25ae25cc4c86e6257d808e6d0453";

// exports.keystore = {
//     //todo should input the real keystore path
//     //path: global.keystore,
//     path: '/home/jacob/wanchain/openStoreman/test/keystore',
//     pwd: 'wanglu',
// };


exports.selfAddress = "0x5793e629c061e7fd642ab6a1b4d552cec0e2d606";
exports.ownerAddress = "0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e";

exports.wanAddress = "0x2e54a80b977fd1859782e2ee96a76285a7fc75ba";  // used for inSmgLock parameter.
exports.value = 0x1000000000; //1-G


exports.gasPrice = 180000000000;
exports.gasLimit = 10000000;

const path = require('path');

const {
  loadConfig
} = require('comm/lib');

let storemanConfig = global.config;

const ethWeb3File = path.join(__dirname, '../conf/config.json');

/*MainNet config*/
let ethWeb3IpOps = {
  web3Ips:                ["http://34.220.234.117:18545","http://34.210.147.106:18545"],
  nextWeb3IpFileName:     ethWeb3File,
  timeOutOfLastBlock:     200,
  currentOKWeb3IpIndex:   0
};

/*testNet config*/
let ethWeb3IpTestOps = {
  web3Ips:                ["http://34.220.234.117:18546","http://34.210.147.106:18546"],
  nextWeb3IpFileName:     ethWeb3File,
  timeOutOfLastBlock:     200,
  currentOKWeb3IpIndex:   0
};

const config = {
  testNet: global.testnet,
  curEthWeb3Ip: storemanConfig.crossTokens['ETH'].CONF.nodeUrl,
  syncInterval: 15 * 1000,
  chainWeb3IpOpsDict: {
    'ETH': global.testnet ? ethWeb3IpTestOps : ethWeb3IpOps
  }
}

module.exports = config;
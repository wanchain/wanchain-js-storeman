const path = require('path');
const moduleConfig = require('../conf/moduleConfig.js');
let configJson = require('conf/config.json');
let storemanConfig = moduleConfig.testnet?configJson.testnet:configJson.main;

const ethWeb3File = path.join(__dirname, '../conf/config.json');

/*MainNet config*/
let ethWeb3IpOps = {
  web3Ips:                ["http://54.184.15.234:18545","http://54.71.100.180:18545"],
  nextWeb3IpFileName:     ethWeb3File,
  timeOutOfLastBlock:     200,
  currentOKWeb3IpIndex:   0
};

/*testNet config*/
let ethWeb3IpTestOps = {
  web3Ips:                ["http://54.185.138.211:18545","http://54.245.197.12:18545"],
  nextWeb3IpFileName:     ethWeb3File,
  timeOutOfLastBlock:     200,
  currentOKWeb3IpIndex:   0
};

const config = {
  testNet: moduleConfig.testnet,
  curEthWeb3Ip: storemanConfig.ethWeb3Url,
  syncInterval: 15 * 1000,
  chainWeb3IpOpsDict: {
    'ETH': moduleConfig.testnet ? ethWeb3IpTestOps : ethWeb3IpOps
  }
}

module.exports = config;
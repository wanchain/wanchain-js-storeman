const baseChain = require("chain/base.js");
// const web3Obj = require('conf/web3Obj.js');
// const chainSCConfig = require('conf/chainSCConfig.js');
const config = require('conf/config');

class EthChain extends baseChain {
  constructor(log, web3) {
    super(log, web3);
    this.chainType = 'ETH';
  }

  tokenLock(xHash, callback) {
    //signature
    //send rawTansaction
    //callback
  }

  tokenConfirm(x, callback) {

  }

  tokenCancel(xHash, callback) {

  }
}

module.exports = EthChain;
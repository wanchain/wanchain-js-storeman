const baseChain = require("chain/base.js");

class EthChain extends baseChain {
  constructor(log, web3) {
    super(log, web3);
    this.chainType = 'ETH';
  }

  tokenLock(xHash, callback) {
  }

  tokenConfirm(x, callback) {
  }

  tokenCancel(xHash, callback) {
  }
}

module.exports = EthChain;
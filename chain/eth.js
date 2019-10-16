const baseChain = require("chain/base.js");

class EthChain extends baseChain {
  constructor(log, nodeUrl) {
    super(log, nodeUrl);
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
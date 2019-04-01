"use strict"

const baseChain = require("chain/base.js");
const Eos = require('eosjs'); 

class EosChain extends baseChain {
  constructor(log) {
    super(log);
    let configJson = JSON.parse(fs.readFileSync('conf/config.json'));
    let config = global.testnet?configJson.testnet:configJson.main;
    this.eosConfig = {
      expireInSeconds: 60,
      broadcast: true,
      debug: false,
      sign: true,
      httpEndPoint: config.eosUrl,
      chainId: config.eosChainId
    }
    this.chainType = 'EOS';
    this.eos = Eos(this.config);
  }

  getNetworkId() {

  }

  getScEventSync(address, topics, fromBlk, toBlk, retryTimes = 0) {

  }

  getBlockNumberSync() {

  }

  sendRawTransaction(signedTx, callback) {
  }

  getBlockByNumber(blockNumber, callback) {

  }

  getTransactionConfirmSync(txHash, waitBlocks) {
  }

  getTokenInfo(tokenScAddr) {

  }

}

module.exports = EosChain;
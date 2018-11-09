const baseChain = require("chain/base.js");
const chainSCConfig = require('conf/moduleConfig.js');

class WanChain extends baseChain {
  constructor(log, web3) {
    super(log, web3);
    this.chainType = 'WAN';
  }

  getSolInferface(abi, contractAddr, contractFunc) {
    let contract = this.theWeb3.eth.contract(abi);
    let conInstance = contract.at(contractAddr);
    return conInstance[contractFunc];
  }

  getTokenScManagerFuncInterface(crossChain, tokenType, contractFunc) {
    let scAbi = chainSCConfig.crossInfoDict[crossChain][tokenType]["tokenManagerAbi"];
    let contractAddr = chainSCConfigcrossInfoDict[crossChain][tokenType]["tokenManagerAddr"];
    return this.getSolInferface(scAbi, contractAddr, contractFunc);
  }

  getStoremanQuota(crossChain, tokenType, address) {
    let getStoremanGroup = this.getTokenScManagerFuncInterface(crossChain, tokenType, 'getStoremanGroup');
    return new Promise(function(resolve, reject) {
      getStoremanGroup(address, function(err, result) {
        if (err) {
          return reject(err);
        } else {
          return resolve(result);
        }
      });
    });
  }

  getQuotaLedgerFunc(crossChain, tokenType, contractFunc) {
    let scAbi = chainSCConfig.crossInfoDict[crossChain][tokenType]["quotaLedgerAbi"];
    let contractAddr = chainSCConfigcrossInfoDict[crossChain][tokenType]["quotaLedgerAddr"];
    return this.getSolInferface(scAbi, contractAddr, contractFunc);
  }

  getErc20StoremanQuota(crossChain, tokenType, tokenOrigAddr, smgAddress) {
    let func = this.getQuotaLedgerFunc(crossChain, tokenType, 'queryStoremanGroupQuota');
    return new Promise(function(resolve, reject) {
      func(tokenOrigAddr, smgAddress, function(err, result) {
        if (err) {
          return reject(err);
        } else {
          return resolve(result);
        }
      });
    });
  }
}



module.exports = WanChain;
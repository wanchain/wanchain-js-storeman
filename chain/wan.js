const baseChain = require("chain/base.js");
const chainSCConfig = require('conf/moduleConfig.js');
// const solc = require('solc');
const fs = require('fs');
// const wanUtil = require('wanchain-util');

class WanChain extends baseChain {
  constructor(log, web3) {
    super(log, web3);
    this.chainType = 'WAN';
  }

  /**
   * Checks if the given string is an address
   *
   * @method isAddress
   * @param {String} address the given HEX adress
   * @return {Boolean}
   */
  // checkAddress(address) {
  //   if (/^(0x)?[0-9a-fA-F]{40}$/i.test(address)) {
  //     // check if it has the basic requirements of an address
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  // checkHash(hash) {
  //   if (/^(0x)?[0-9a-fA-F]{64}$/i.test(hash)) {
  //     // check if it has the basic requirements of an hash
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  // strMapToObj(strMap) {
  //   let obj = Object.create(null);
  //   for (let [k, v] of strMap) {
  //     obj[k] = v;
  //   }
  //   return obj;
  // }

  // commandSha3(command) {
  //   return wanUtil.sha3(command, 256);
  // }

  // getEventHash(eventName, contractAbi) {
  //   return '0x' + this.commandSha3(this.getcommandString(eventName, contractAbi)).toString('hex');
  // }

  // getcommandString(funcName, contractAbi) {
  //   let log = this.log;
  //   for (var i = 0; i < contractAbi.length; ++i) {
  //     let item = contractAbi[i];
  //     if (item.name == funcName) {
  //       let command = funcName + '(';
  //       for (var j = 0; j < item.inputs.length; ++j) {
  //         if (j != 0) {
  //           command = command + ',';
  //         }
  //         command = command + item.inputs[j].type;
  //       }
  //       command = command + ')';
  //       log.debug('getcommandString get result: ', command);
  //       return command;
  //     }
  //   }
  // }

  // getCrossScAddress(crossChain) {
  //   let reply = {
  //     header: this.header,
  //     status: 'success'
  //   };
  //   reply.originalChainHtlcAddr = chainSCConfig.chainScDict[crossChain]["originalChainHtlcAddr"];
  //   reply.wanchainHtlcAddr = chainSCConfig.chainScDict[crossChain]["wanchainHtlcAddr"];
  //   return reply;
  // }

  // getCrossEthScAddress() {
  //   return chainSCConfig.wethScGroup.wanchainHtlcAddr;
  // }

  // compileSol(solFile) {
  //   let content = fs.readFileSync(solFile, 'utf8');
  //   return solc.compile(content, 1);
  // }

  // getAbi(compileSol, contractName) {
  //   return JSON.parse(compileSol.contracts[':' + contractName].interface);
  // }

  // getScEventLog(contractAddr, eventName, contractAbi, crossChain) {
  //   let log = this.log;
  //   let topics = [this.getEventHash(eventName, contractAbi), null, chainSCConfig.crossChainDict[crossChain]];
  //   log.debug("getScEventLog is called, and the topics is ", topics);
  //   let self = this;
  //   return new Promise(function(resolve, reject) {
  //     try {
  //       self.getScEvent(contractAddr, topics, function(result) {
  //         if (result.status === 'success') {
  //           resolve(result);
  //         } else {
  //           reject(result);
  //         }
  //       });
  //     } catch (err) {
  //       let reply = {
  //         header: this.header,
  //         status: 'failed',
  //         error: err
  //       };
  //       reject(reply);
  //     }
  //   });
  // }

  // getScInstance(abi, contractAddr) {
  //   return this.theWeb3.eth.contract(abi).at(contractAddr);
  // }

  getSolInferface(abi, contractAddr, contractFunc) {
    let contract = this.theWeb3.eth.contract(abi);
    let conInstance = contract.at(contractAddr);
    return conInstance[contractFunc];
  }

  // getSolVar(abi, contractAddr, varName) {
  //   let contract = this.theWeb3.eth.contract(abi);
  //   let conInstance = contract.at(contractAddr);
  //   return conInstance[varName];
  // }

  // getERC20Var(contractAddr, varName) {
  //   return this.getSolVar(chainSCConfig.erc20Abi, contractAddr, varName);
  // }

  // getERC20Interface(contractAddr, contractFunc) {
  //   return this.getSolInferface(chainSCConfig.erc20Abi, contractAddr, contractFunc);
  // }

  // getTokenScManagerFuncInterface(crossChain, contractFunc) {
  //   let scAbi = chainSCConfig.chainScDict[crossChain]["tokenScManagerAbi"];
  //   let contractAddr = chainSCConfig.chainScDict[crossChain]["tokenScManagerAddr"];
  //   return this.getSolInferface(scAbi, contractAddr, contractFunc);
  // }

  // getSmgAdminScFuncInterface(contractFunc) {
  //   let scAbi = chainSCConfig.smgAdminScAbi;
  //   let contractAddr = chainSCConfig.smgAdminScAddr;
  //   return this.getSolInferface(scAbi, contractAddr, contractFunc);
  // }

  // getSmgAdminScCoinInfoMap() {
  //   let scAbi = chainSCConfig.smgAdminScAbi;
  //   let contractAddr = chainSCConfig.smgAdminScAddr;
  //   let smgAdminIns = this.getScInstance(scAbi, contractAddr);
  //   return smgAdminIns['mapCoinInfo'];
  // }

  // getSmgAdminScSmgMap() {
  //   let scAbi = chainSCConfig.smgAdminScAbi;
  //   let contractAddr = chainSCConfig.smgAdminScAddr;
  //   let smgAdminIns = this.getScInstance(scAbi, contractAddr);
  //   return smgAdminIns['mapCoinSmgInfo'];
  // }

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

  // getStoreManOriginalChainAddr(coinId, address) {
  //   let getStoreManOriginalChainAddr = this.getSmgAdminScFuncInterface('getStoremanOriginalChainAddr');
  //   return new Promise(function(resolve, reject) {
  //     getStoreManOriginalChainAddr(coinId, address, function(err, result) {
  //       if (err) {
  //         return reject(err);
  //       } else {
  //         return resolve(result);
  //       }
  //     });
  //   });
  // }

  // getStoremanGroupDeposit(coinId, address) {
  //   let smgGroupMap = this.getSmgAdminScSmgMap();
  //   return smgGroupMap(coinId, address)[0];
  // }

  // getStoremanGroupTxFeeRatio(coinId, address) {
  //   let smgGroupMap = this.getSmgAdminScSmgMap();
  //   return smgGroupMap(coinId, address)[3];
  // }

  // getStoremanMap(coinId, address) {
  //   let smgGroupMap = this.getSmgAdminScSmgMap();
  //   return new Promise(function(resolve, reject) {
  //     smgGroupMap(coinId, address, function(err, result) {
  //       if (err) {
  //         return reject(err);
  //       } else {
  //         return resolve(result);
  //       }
  //     });
  //   });
  // }

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

  // getCoin2WanRatio(crossChain, callback) {
  //   let log = this.log;
  //   let reply = {
  //     header: this.header,
  //     status: 'failed'
  //   };
  //   try {
  //     let coinId = chainSCConfig.crossChainDict[crossChain];
  //     let coinInfoMap = this.getSmgAdminScCoinInfoMap();
  //     reply.status = 'success';
  //     reply.c2wRatio = coinInfoMap(coinId)[0].toString(10);
  //     log.info('getCoin2WanRatio successfully on crossChain ', crossChain);
  //   } catch (err) {
  //     reply.error = (err.hasOwnProperty("message")) ? err.message : err;
  //   }
  //   callback(reply);
  // }

  // async getStoremanGroupRegister(crossChain) {
  //   let log = this.log;
  //   try {
  //     let result = await this.getScEventLog(chainSCConfig.smgAdminScAddr, 'SmgRegister', chainSCConfig.smgAdminScAbi, crossChain);
  //     log.debug("sockets getStoremanGroupRegister result: ", result);
  //     return result;
  //   } catch (err) {
  //     log.error("something is wrong when getStoremanGroupRegister is called: ", err);
  //     return err;
  //   }
  // }

  // async getStoremanGroupUnregister(crossChain) {
  //   let log = this.log;
  //   try {
  //     let result = await this.getScEventLog(chainSCConfig.smgAdminScAddr, 'SmgApplyUnRegister', chainSCConfig.smgAdminScAbi, crossChain);
  //     log.debug("sockets getStoremanGroupUnregister result: ", result);
  //     return result;
  //   } catch (err) {
  //     log.error("something is wrong when getStoremanGroupUnregister is called: ", err);
  //     return err;
  //   }
  // }

  // async getStoremanGroupWithdraw(crossChain) {
  //   let log = this.log;
  //   try {
  //     let result = await this.getScEventLog(chainSCConfig.smgAdminScAddr, 'SmgWithdraw', chainSCConfig.smgAdminScAbi, crossChain);
  //     log.debug("sockets getStoremanGroupWithdraw result: ", result);
  //     return result;
  //   } catch (err) {
  //     log.error("something is wrong when getStoremanGroupWithdraw is called: ", err);
  //     return err;
  //   }
  // }

  // storemanGroupRegister(crossChain, storemanGroup, registerResult) {
  //   let log = this.log;
  //   let registerLogs = registerResult.logs;
  //   for (var registerLog of registerLogs) {
  //     let storemanAddr = '0x' + registerLog.topics[1].slice(26, 66);
  //     log.info("storemanGroupRegister", storemanAddr);
  //     storemanGroup.push(storemanAddr);
  //   }
  // }

  // storemanGroupUnregister(crossChain, storemanGroup, unregisterResult) {
  //   let log = this.log;
  //   let unregisterLogs = unregisterResult.logs;
  //   for (var unregisterLog of unregisterLogs) {
  //     let storemanAddr = '0x' + unregisterLog.topics[1].slice(26, 66);
  //     log.info("storemanGroupUnregister", storemanAddr);
  //     for (var index = 0; index < storemanGroup.length; index++) {
  //       if (storemanGroup[index] === storemanAddr) {
  //         storemanGroup.splice(index, 1);
  //         return;
  //       }
  //     }
  //   }
  // }

  // async getStoremanGroupInfo(crossChain, storemanGroup) {
  //   let log = this.log;
  //   let storemanGroupMap = new Map();
  //   let coinId = chainSCConfig.crossChainDict[crossChain];
  //   let error = null;
  //   let chain = this;

  //   let arrayAsync = storemanGroup.map(async function(storemanAddr) {
  //     return new Promise(async (resolve, reject) => {
  //       let [storemanQuotas, storemanethAddress, smgGroupMap] = await Promise.all([
  //         chain.getStoremanQuota(crossChain, storemanAddr),
  //         chain.getStoreManOriginalChainAddr(coinId, storemanAddr),
  //         chain.getStoremanMap(coinId, storemanAddr)
  //       ]);
  //       storemanGroupMap.set(storemanAddr, {
  //         ethAddress: storemanethAddress,
  //         deposit: smgGroupMap[0].toString(10),
  //         txFeeRatio: smgGroupMap[3].toString(10),
  //         quota: storemanQuotas[0].toString(10),
  //         inboundQuota: storemanQuotas[1].toString(10),
  //         outboundQuota: storemanQuotas[2].toString(10),
  //         receivable: storemanQuotas[3].toString(10),
  //         payable: storemanQuotas[4].toString(10),
  //         debt: storemanQuotas[5].toString(10)
  //       });
  //       resolve();
  //     });
  //   });

  //   try {
  //     await Promise.all(arrayAsync);
  //   } catch (err) {
  //     storemanGroupMap = null;
  //     error = (err.hasOwnProperty("message")) ? err.message : err;
  //   }

  //   return {
  //     storemanGroupMap,
  //     error
  //   };
  // }

  // storemanGroupQoSSort(crossChain, storemanGroupMap) {
  //   let log = this.log;
  //   let storemanGroup = [];
  //   let tmpstoremanGroup = this.strMapToObj(storemanGroupMap);
  //   log.debug(tmpstoremanGroup);
  //   var sortObjkeys = Object.keys(tmpstoremanGroup).sort(function(group1, group2) {
  //     return tmpstoremanGroup[group2].quota - tmpstoremanGroup[group1].quota;
  //   });
  //   for (var index in sortObjkeys) {
  //     let wanAddress = sortObjkeys[index];
  //     let storemanAdd = {
  //       wanAddress: wanAddress
  //     }
  //     let storeman = Object.assign(storemanAdd, tmpstoremanGroup[sortObjkeys[index]])
  //     storemanGroup[index] = storeman;
  //   }
  //   return storemanGroup;
  // }

  // async getSyncStoremanGroups(crossChain, callback) {
  //   let log = this.log;
  //   let storemanGroup = [];
  //   let reply = {
  //     header: this.header,
  //     status: 'failed'
  //   };

  //   try {
  //     let registerResult = await this.getStoremanGroupRegister(crossChain);
  //     if (registerResult.status === 'success' && registerResult.logs !== null) {
  //       log.info('getStoremanGroupRegister successfully on crossChain ', crossChain);
  //       log.debug('getStoremanGroupRegister get result:', registerResult);
  //       this.storemanGroupRegister(crossChain, storemanGroup, registerResult);
  //       log.debug("After register, the storemanGroup is ", storemanGroup);

  //       let unregisterResult = await this.getStoremanGroupUnregister(crossChain);
  //       if (unregisterResult.status === 'success' && unregisterResult.logs !== null) {
  //         log.info('getStoremanGroupUnregister successfully on crossChain ', crossChain);
  //         this.storemanGroupUnregister(crossChain, storemanGroup, unregisterResult);
  //         log.debug("After unregister, the storemanGroup is ", storemanGroup);
  //       } else if (unregisterResult.status === 'success' && unregisterResult.logs === null) {
  //         log.info('There is no StoremanGroupUnregister happened on crossChain ', crossChain);
  //       } else {
  //         log.error('getStoremanGroupUnregister failed on crossChain ', crossChain);
  //       }
  //     } else {
  //       log.error('getStoremanGroupRegister failed on crossChain ', crossChain);
  //       callback(registerResult);
  //       return;
  //     }
  //     let {
  //       storemanGroupMap,
  //       error
  //     } = await this.getStoremanGroupInfo(crossChain, storemanGroup);
  //     if (storemanGroupMap !== null) {
  //       storemanGroup = this.storemanGroupQoSSort(crossChain, storemanGroupMap);
  //       reply = {
  //         header: this.header,
  //         status: 'success',
  //         storemanGroup: storemanGroup
  //       }
  //     } else {
  //       reply.error = error;
  //     }
  //   } catch (err) {
  //     reply.error = (err.hasOwnProperty("message")) ? err.message : err;
  //   }
  //   callback(reply);
  // }

  // getTokenBalance(address, keyValue, callback) {
  //   let log = this.log;
  //   let reply = null;
  //   let tokenScAddr = null;

  //   if (!this.checkAddress(address)) {
  //     reply = {
  //       header: this.header,
  //       status: 'failed',
  //       error: 'invalid address'
  //     };
  //     callback(reply);
  //     return;
  //   }

  //   if (this.checkAddress(keyValue)) {
  //     tokenScAddr = keyValue;
  //     reply = {
  //       header: this.header,
  //       status: 'success',
  //       tokenScAddr: tokenScAddr,
  //       address: address
  //     };
  //   } else {
  //     let scGroup = keyValue.toLowerCase() + 'ScGroup';
  //     tokenScAddr = chainSCConfig[scGroup].tokenScAddr;
  //     reply = {
  //       header: this.header,
  //       status: 'success',
  //       tokenType: keyValue,
  //       address: address
  //     };
  //   }
  //   try {
  //     let balanceOf = this.getERC20Interface(tokenScAddr, 'balanceOf');
  //     balanceOf(address, function(err, balance) {
  //       if (err) {
  //         reply.status = 'failed';
  //         reply.error = (err.hasOwnProperty("message")) ? err.message : err;
  //       } else {
  //         let tokenBalance = balance.toString();
  //         log.debug('getTokenBalance at tokenScAddr', tokenScAddr, 'on address ', address, 'the result is ',
  //           tokenBalance);
  //         reply.tokenBalance = tokenBalance;
  //       }
  //       callback(reply);
  //     });
  //   } catch (err) {
  //     reply.status = 'failed';
  //     reply.error = (err.hasOwnProperty("message")) ? err.message : err;
  //     callback(reply);
  //   }
  // }

  // async getMultiTokenBalance(address, keyValue, callback) {
  //   let log = this.log;
  //   let reply = null;
  //   let tokenScAddr = null;

  //   if (!Array.isArray(address)) {
  //     reply = {
  //       header: this.header,
  //       status: 'failed',
  //       error: 'invalid address, not an array'
  //     };
  //     callback(reply);
  //     return;
  //   }

  //   if (this.checkAddress(keyValue)) {
  //     tokenScAddr = keyValue;
  //     reply = {
  //       header: this.header,
  //       status: 'success',
  //       tokenScAddr: tokenScAddr,
  //       tokenBalance: {}
  //     };
  //   } else {
  //     let scGroup = keyValue.toLowerCase() + 'ScGroup';
  //     tokenScAddr = chainSCConfig[scGroup].tokenScAddr;
  //     reply = {
  //       header: this.header,
  //       status: 'success',
  //       tokenType: keyValue,
  //       tokenBalance: {}
  //     };
  //   }

  //   let multiTokenAddress = [...address].map((tokenAddr) => {
  //     return new Promise((resolve, reject) => {
  //       this.getTokenBalance(tokenAddr, tokenScAddr, function(result) {
  //         if (result.status === 'success') {
  //           log.debug('getTokenBalance balance ', result.tokenBalance, ' successfully on address ', tokenAddr);
  //           reply.tokenBalance[tokenAddr] = result.tokenBalance;
  //         } else {
  //           log.error('getTokenBalance failed on address ', tokenAddr, result.error);
  //           reply.status = 'failed';
  //           reply.tokenBalance[tokenAddr] = result.error;
  //         }
  //         resolve();
  //       });
  //     })
  //   });

  //   try {
  //     await Promise.all(multiTokenAddress);
  //   } catch (err) {
  //     reply.status = 'failed';
  //     reply.error = (err.hasOwnProperty("message")) ? err.message : err;
  //   }
  //   callback(reply);
  // }

  // getTokenSupply(tokenScAddr, callback) {
  //   let log = this.log;
  //   let reply = null;

  //   if (!this.checkAddress(tokenScAddr)) {
  //     reply = {
  //       header: this.header,
  //       status: 'failed',
  //       error: 'invalid address'
  //     };
  //     callback(reply);
  //     return;
  //   }

  //   try {
  //     let totalSupply = this.getERC20Var(tokenScAddr, 'totalSupply')().toString(10);

  //     log.debug('getTokenSupply of tokenScAddr', tokenScAddr, 'the result is', totalSupply);
  //     reply = {
  //       header: this.header,
  //       status: 'success',
  //       tokenScAddr: tokenScAddr,
  //       totalSupply: totalSupply
  //     };
  //   } catch (err) {
  //     reply = {
  //       header: this.header,
  //       status: 'failed',
  //       tokenScAddr: tokenScAddr,
  //       error: err
  //     };
  //   }
  //   callback(reply);
  // }
}



module.exports = WanChain;
const baseChain = require("chain/base.js");
const moduleConfig = require('conf/moduleConfig.js');
const TimeoutPromise = require('utils/timeoutPromise.js')
let Contract = require("contract/Contract.js");

class WanChain extends baseChain {
  constructor(log, nodeUrl) {
    super(log, nodeUrl);
  }

  setChainType() {
    this.chainType = 'WAN';
  }
  
  getTokenScManagerFuncInterface(crossChain, tokenType, contractFunc) {
    let scAbi = moduleConfig.crossInfoDict[crossChain][tokenType]["tokenManagerAbi"];
    let contractAddr = moduleConfig.crossInfoDict[crossChain][tokenType]["tokenManagerAddr"];
    return this.getSolInferface(scAbi, contractAddr, contractFunc);
  }

  getStoremanQuota(crossChain, tokenType, address) {
    let chainType = this.chainType;
    let getStoremanGroup = this.getTokenScManagerFuncInterface(crossChain, tokenType, 'getStoremanGroup');
    return new TimeoutPromise((resolve, reject) => {
      getStoremanGroup(address, function(err, result) {
        if (err) {
          return reject(err);
        } else {
          return resolve(result);
        }
      });
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getStoremanQuota timeout');
  }

  getQuotaLedgerFunc(crossChain, tokenType, contractFunc) {
    let scAbi = moduleConfig.crossInfoDict[crossChain][tokenType]["quotaLedgerAbi"];
    let contractAddr = moduleConfig.crossInfoDict[crossChain][tokenType]["quotaLedgerAddr"];
    return this.getSolInferface(scAbi, contractAddr, contractFunc);
  }

  getTokenStoremanQuota(crossChain, tokenType, tokenOrigAddr, smgAddress) {
    let chainType = this.chainType;
    let func = this.getQuotaLedgerFunc(crossChain, tokenType, 'queryStoremanGroupQuota');
    return new TimeoutPromise((resolve, reject) => {
      func(tokenOrigAddr, smgAddress, function(err, result) {
        if (err) {
          return reject(err);
        } else {
          return resolve(result);
        }
      });
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getTokenStoremanQuota timeout');
  }

  getTokenStoremanFee(crossChain, tokenType, tokenOrigAddr, smgAddress) {
    let chainType = this.chainType;
    let func = this.getQuotaLedgerFunc(crossChain, tokenType, 'getStoremanFee');
    return new TimeoutPromise((resolve, reject) => {
      func(smgAddress, function(err, result) {
        if (err) {
          return reject(err);
        } else {
          return resolve(result);
        }
      });
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getTokenStoremanFee timeout');
  }

  getStoremanGroups(crossChain) {
    let log = this.log;
    let chainType = this.chainType;
    let self = this;
    let abi = moduleConfig.crossInfoDict[crossChain].COIN.smgAdminAbi;
    let contractAddr = moduleConfig.crossInfoDict[crossChain].COIN.smgAdminAddr;
    let topic = [];

    return new TimeoutPromise((resolve, reject) => {
      try {
      self.getScEvent(contractAddr, topic, 0, 'latest', moduleConfig.web3RetryTimes, async (err, logs) => {
        if (err) {
          log.error(err);
          reject(err);
        } else {
          let parsedLogs = [];
          if (logs !== null) {
            let contract = new Contract(abi, contractAddr);
            parsedLogs = contract.parseEvents(JSON.parse(JSON.stringify(logs)));
          }
          let storemanGroup = [];
          for (let i of parsedLogs) {
            if (i && i.event === 'SmgRegister') {
              storemanGroup.push(i.args);
            }
          }
          for (let i of parsedLogs) {
            if (i && i.event === 'SmgApplyUnRegister') {
              for (let index = 0; index < storemanGroup.length; index++) {
                if ((storemanGroup[index].tokenOrigAddr === i.args.tokenOrigAddr && storemanGroup[index].smgWanAddr === i.args.smgWanAddr)) {
                  storemanGroup.splice(index, 1);
                  break;
                }
              }
            }
          }
          resolve(storemanGroup);
        }
      })
      } catch (err) {
        reject(err);
      }

    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getStoremanGroups timeout');
  }

  async getTokenStoremanGroupsOfMutiTokens(crossChain, tokens) {
    let log = this.log;
    let chainType = this.chainType;
    let self = this;
    let tokenStoremanGroups = [];

    let multiTokens = tokens.map((token) => {
      return new TimeoutPromise(async (resolve, reject) => {
        let storeman;
        try {
          storeman = await self.getTokenStoremanGroups(crossChain, token.tokenOrigAddr);
        } catch (err) {
          reject(err);
        }
        tokenStoremanGroups = tokenStoremanGroups.concat(storeman);
        resolve();
      }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getTokenStoremanGroupsOfMutiTokens timeout');
    })
    try {
      await Promise.all(multiTokens);
    } catch (err) {
      log.error("getTokenStoremanGroupsOfMutiTokens", err);
      return await Promise.reject(err);
    }
    return tokenStoremanGroups;
  }

  async getTokenStoremanGroups(crossChain, tokenAddr, storemanWan, storemanOri) {
    let log = this.log;
    let chainType = this.chainType;
    let self = this;
    let abi = moduleConfig.crossInfoDict[crossChain].TOKEN.smgAdminAbi;
    // let topic = [null, this.encodeTopic('address', tokenAddr)];
    let topic = [];

    let addrs;
    if (Array.isArray(moduleConfig.crossInfoDict[crossChain].TOKEN.smgAdminAddr)) {
      addrs = moduleConfig.crossInfoDict[crossChain].TOKEN.smgAdminAddr;
    } else {
      addrs = [moduleConfig.crossInfoDict[crossChain].TOKEN.smgAdminAddr];
    }

    let storemanGroup = [];
    let getMultiStoremanEvent = addrs.map((contractAddr) => {
      return new TimeoutPromise((resolve, reject) => {
        self.getScEvent(contractAddr, topic, 0, 'latest', moduleConfig.web3RetryTimes, async (err, logs) => {
          if (err) {
            log.error(err);
            reject(err);
          } else {
            let parsedLogs = [];
            if (logs !== null) {
              let contract = new Contract(abi, contractAddr);
              // let sign = contract.getEventSignature("StoremanGroupRegistrationLogger");
              parsedLogs = contract.parseEvents(JSON.parse(JSON.stringify(logs)));
            }

            let unRegLog = [];
  
            for (let i of parsedLogs) {
              let tokenOrigParam;
              if (i && i.args.hasOwnProperty('tokenOrigAccount')) {
                tokenOrigParam = 'tokenOrigAccount';
              } else if (i && i.args.hasOwnProperty('tokenOrigAddr')) {
                tokenOrigParam = 'tokenOrigAddr';
              } else {
                continue;
              }
              let smgParam;
              if (i && i.args.hasOwnProperty('smgWanAddr')) {
                smgParam = 'smgWanAddr';
              } else if (i && i.args.hasOwnProperty('storemanGroup')) {
                smgParam = 'storemanGroup';
              } else {
                continue;
              }

              if (i && i.event === 'StoremanGroupRegistrationLogger' && i.args[tokenOrigParam] === tokenAddr) {
                if (i.args[smgParam] === storemanWan) {
                  if (!storemanOri || (storemanOri && i.args.smgOrigAddr === storemanOri)) {
                    storemanGroup.push(i);
                  }
                } 
              }

              if (i && i.event === 'StoremanGroupApplyUnRegistrationLogger' && i.args[tokenOrigParam] === tokenAddr) {
                if (i.args[smgParam] === storemanWan) {
                  if (!storemanOri || (storemanOri && i.args.smgOrigAddr === storemanOri)) {
                    unRegLog.push(i);
                  }
                } 
              }
            }

            // debtOpt need the storemanRegistration check
            if (!global.argv.doDebt) {
              for (let i of unRegLog) {
                for (let index = 0; index < storemanGroup.length; index++) {
                  if (i.blockNumber > storemanGroup[index].blockNumber) {
                    storemanGroup.splice(index, 1);
                    break;
                  }
                }
              }
            }
            resolve(storemanGroup);
          }
        })
      }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getTokenStoremanGroups timeout');
    })

    try {
      await Promise.all(getMultiStoremanEvent);
    } catch (err) {
      log.error("getTokenStoremanGroups", err);
      return await Promise.reject(err);
    }
    return storemanGroup;
  }

  getRegTokenTokens(crossChain) {
    let log = this.log;
    let chainType = this.chainType;
    let self = this;
    let abi = moduleConfig.crossInfoDict[crossChain].TOKEN.tokenManagerAbi;
    let contractAddr = moduleConfig.crossInfoDict[crossChain].TOKEN.tokenManagerAddr;

    return new TimeoutPromise((resolve, reject) => {
      self.getScEvent(contractAddr, [], 0, 'latest', moduleConfig.web3RetryTimes, async (err, logs) => {
        if (err) {
          log.error(err);
          reject(err);
        } else {
          let parsedLogs = [];
          if (logs !== null) {
            let contract = new Contract(abi, contractAddr);
            parsedLogs = contract.parseEvents(JSON.parse(JSON.stringify(logs)));
          }
          let regEvents = [];
          let regTokenRecord = {};

          let regLogs = [];
          // let updateRegLogs = [];
          let unRegLog = [];

          for (let i of parsedLogs) {
            if (i && (i.event === 'TokenAddedLogger' || i.event === 'TokenUpdatedLogger')) {
              regLogs.push(i);
            }
            if (i && i.event === 'TokenRemovedLogger') {
              unRegLog.push(i);
            }
          }

          for (let i of regLogs) {
            let tokenOrigParam;
            if (i.args.hasOwnProperty('tokenOrigAccount')) {
              tokenOrigParam = 'tokenOrigAccount';
            } else if (i.args.hasOwnProperty('tokenOrigAddr')) {
              tokenOrigParam = 'tokenOrigAddr';
            } else {
              continue;
            }
            if (regTokenRecord.hasOwnProperty(i.args[tokenOrigParam]) && (regTokenRecord[i.args[tokenOrigParam]] < i.blockNumber)) {
              for (let index = 0; index < regEvents.length; index++) {
                if (regEvents[index][tokenOrigParam] === i.args[tokenOrigParam]) {
                  regEvents.splice(index, 1);
                  break;
                }
              }
            }
            regTokenRecord[i.args[tokenOrigParam]] = i.blockNumber;
            regEvents.push(i.args);
          }

          for (let i of unRegLog) {
            let tokenOrigParam;
            if (i.args.hasOwnProperty('tokenOrigAccount')) {
              tokenOrigParam = 'tokenOrigAccount';
            } else if (i.args.hasOwnProperty('tokenOrigAddr')) {
              tokenOrigParam = 'tokenOrigAddr';
            } else {
              continue;
            }
            if (regTokenRecord.hasOwnProperty(i.args[tokenOrigParam]) && (regTokenRecord[i.args[tokenOrigParam]] < i.blockNumber)) {
              for (let index = 0; index < regEvents.length; index++) {
                if (regEvents[index][tokenOrigParam] === i.args[tokenOrigParam]) {
                  regEvents.splice(index, 1);
                  break;
                }
              }
            }
          }

          // for (let i of regEvents) {
          //   self.bigNumber2String(i, 10);
          // }
          resolve(regEvents);
        }
      });
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getRegTokenTokens timeout');
  }

  getStoremanGroupList() {
    let self = this;
    let contractAddr = moduleConfig.crossChainSmgScDict.CONTRACT["smgAdminAddr"];
    let contractAbi = moduleConfig.crossChainSmgScDict.CONTRACT["smgAdminAbi"];
    let scFunc = 'getStoremanGroupList';

    let registerEvent = chainSCConfig.crossChainSmgScDict.EVENT["register"];
    let unRegisterEvent = chainSCConfig.crossChainSmgScDict.EVENT["unregister"];

    return new TimeoutPromise(async (resolve, reject) => {
      try {
        let contract = new Contract(contractAbi, contractAddr);
        parsedLogs = contract.parseEvents(JSON.parse(JSON.stringify(logs)));

        let registerLogs;
        let registerTopics = [contract.getEventSignature(registerEvent), null, null];
        registerLogs = await self.getScEventSync(contractAddr, registerTopics);
        log.debug(funcName + "::getStoremanGroupRegEvent get result:", registerLogs);

        let unRegisterLogs;
        let unRegisterTopics = [contract.getEventSignature(unRegisterEvent), null];
        unRegisterLogs = await self.getScEventSync(contractAddr, unRegisterTopics);
        log.debug(funcName + "::getStoremanGroupUnregEvent get result:", unRegisterLogs);

        let storemanGroup = [];
        let storemanLogs = [];
        let regStoremanRecord = {};

        if (registerLogs && registerLogs.length !== 0) {
          for (let log of registerLogs) {
            if (regStoremanRecord.hasOwnProperty(log.topics[1]) && (regStoremanRecord[log.topics[1]] < log.blockNumber)) {
              for (let index = 0; index < storemanLogs.length; index++) {
                if (storemanLogs[index].topics[1] === log.topics[1]) {
                  storemanLogs.splice(index, 1);
                  break;
                }
              }
            }
            regStoremanRecord[log.topics[1]] = log.blockNumber;
            storemanLogs.push(log);
          }

          if (unRegisterLogs && unRegisterLogs.length !== 0) {
            for (let log of unRegisterLogs) {
              if (regStoremanRecord.hasOwnProperty(log.topics[1]) && (regStoremanRecord[log.topics[1]] < log.blockNumber)) {
                for (let index = 0; index < storemanLogs.length; index++) {
                  if (storemanLogs[index].topics[1] === log.topics[1]) {
                    storemanLogs.splice(index, 1);
                    break;
                  }
                }
              }
            }
          }
        }

        let storemanArgs = contract.parseEvents(JSON.parse(JSON.stringify(storemanLogs)));

        for (let log of storemanArgs) {
          storemanGroup.push(log.args);
        }
        resolve(storemanGroup);
      } catch (err) {
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + self.chainType + ' getStoremanGroupList timeout');
  }

  getStoremanInfo(wkAddress) {
    let self = this;
    let contractAddr = moduleConfig.crossChainSmgScDict.CONTRACT["smgAdminAddr"];
    let contractAbi = moduleConfig.crossChainSmgScDict.CONTRACT["smgAdminAbi"];
    let scFunc = 'getStoremanInfo';

    return new TimeoutPromise((resolve, reject) => {
      let func = self.getSolInterfaceV2(contractAbi, contractAddr, scFunc);
      func(wkAddress).call((err, result) => {
        if (err) {
          return reject(err);
        } else {
          if (result && Object.keys(result).length) {
            let length = Object.keys(result).length / 2;
            for (let i = 0; i < length; i++) {
              delete result[i.toString()];
            }
          }
          return resolve(result);
        }
      });
    }, moduleConfig.promiseTimeout, "ChainType: " + self.chainType + ' getStoremanInfo timeout');
  }

  getStoremanGroupConfig(groupId) {
    let self = this;
    let contractAddr = moduleConfig.crossChainSmgScDict.CONTRACT["smgAdminAddr"];
    let contractAbi = moduleConfig.crossChainSmgScDict.CONTRACT["smgAdminAbi"];
    let scFunc = 'getStoremanGroupConfig';

    return new TimeoutPromise((resolve, reject) => {
      let func = self.getSolInterfaceV2(contractAbi, contractAddr, scFunc);
      func(groupId).call((err, result) => {
        if (err) {
          return reject(err);
        } else {
          if (result && Object.keys(result).length) {
            let length = Object.keys(result).length / 2;
            for (let i = 0; i < length; i++) {
              delete result[i.toString()];
            }
          }
          return resolve(result);
        }
      });
    }, moduleConfig.promiseTimeout, "ChainType: " + self.chainType + ' getStoremanGroupConfig timeout');
  }

  getStoremanGroupInfo(groupId) {
    let self = this;
    let contractAddr = moduleConfig.crossChainSmgScDict.CONTRACT["smgAdminAddr"];
    let contractAbi = moduleConfig.crossChainSmgScDict.CONTRACT["smgAdminAbi"];
    let scFunc = 'getStoremanGroupInfo';

    return new TimeoutPromise((resolve, reject) => {
      let func = self.getSolInterfaceV2(contractAbi, contractAddr, scFunc);
      func(groupId).call((err, result) => {
        if (err) {
          return reject(err);
        } else {
          if (result && Object.keys(result).length) {
            let length = Object.keys(result).length / 2;
            for (let i = 0; i < length; i++) {
              delete result[i.toString()];
            }
          }
          return resolve(result);
        }
      });
    }, moduleConfig.promiseTimeout, "ChainType: " + self.chainType + ' getStoremanGroupInfo timeout');
  }

  getTokenPairs() {
    let self = this;
    let contractAbi = moduleConfig.crossInfoDict[self.chainType].CONTRACT.tokenManagerAbi;
    let contractAddr = moduleConfig.crossInfoDict[self.chainType].CONTRACT.tokenManagerAddr;
    let scFunc = 'getTokenPairs';

    return new TimeoutPromise((resolve, reject) => {
      let func = self.getSolInterfaceV2(contractAbi, contractAddr, scFunc);
      func().call((err, result) => {
        if (err) {
          return reject(err);
        } else {
          let tokenPairs = [];
          if (result && Object.keys(result).length) {
            let length = Object.keys(result).length / 2;
            for (let i = 0; i < length; i++) {
              delete result[i.toString()];
            }

            Object.keys(result).forEach((key) => {
              for (let i = 0; i < result[key].length; i++) {
                if (!tokenPairs[i]) {
                  tokenPairs[i] = {};
                }
                tokenPairs[i][key] = result[key][i];
              }
            })
          }
          return resolve(tokenPairs);
        }
      });
    }, moduleConfig.promiseTimeout, "ChainType: " + self.chainType + ' getTokenPairs timeout');
  }

  getTokenPairIDs() {
    let self = this;
    let contractAbi = moduleConfig.crossInfoDict[self.chainType].CONTRACT.tokenManagerAbi;
    let contractAddr = moduleConfig.crossInfoDict[self.chainType].CONTRACT.tokenManagerAddr;
    let scFunc = 'getTokenPairs';

    return new TimeoutPromise((resolve, reject) => {
      let func = self.getSolInterfaceV2(contractAbi, contractAddr, scFunc);
      func().call((err, result) => {
        if (err) {
          return reject(err);
        } else {
          let tokenPairIDs = [];
          if (result && Object.keys(result).length) {
            tokenPairIDs = result['id'];
          }
          return resolve(tokenPairIDs);
        }
      });
    }, moduleConfig.promiseTimeout, "ChainType: " + self.chainType + ' getTokenPairIDs timeout');
  }

  getTokenPairsByChainPair(chainID1, chainID2) {
    let self = this;
    let contractAbi = moduleConfig.crossInfoDict[self.chainType].CONTRACT.tokenManagerAbi;
    let contractAddr = moduleConfig.crossInfoDict[self.chainType].CONTRACT.tokenManagerAddr;
    let scFunc = 'getTokenPairsByChainID';

    return new TimeoutPromise((resolve, reject) => {
      let func = self.getSolInterfaceV2(contractAbi, contractAddr, scFunc);
      func(chainID1, chainID2).call((err, result) => {
        if (err) {
          return reject(err);
        } else {
          let tokenPairs = [];
          if (result && Object.keys(result).length) {
            let length = Object.keys(result).length / 2;
            for (let i = 0; i < length; i++) {
              delete result[i.toString()];
            }

            Object.keys(result).forEach((key) => {
              for (let i = 0; i < result[key].length; i++) {
                if (!tokenPairs[i]) {
                  tokenPairs[i] = {};
                }
                tokenPairs[i][key] = result[key][i];
              }
            })
          }
          return resolve(tokenPairs);
        }
      });
    }, moduleConfig.promiseTimeout, "ChainType: " + self.chainType + ' getTokenPairsByChainPair timeout');
  }

  getTokenPairIDsByChainPair(chainID1, chainID2) {
    let self = this;
    let contractAbi = moduleConfig.crossInfoDict[self.chainType].CONTRACT.tokenManagerAbi;
    let contractAddr = moduleConfig.crossInfoDict[self.chainType].CONTRACT.tokenManagerAddr;
    let scFunc = 'getTokenPairsByChainID';

    return new TimeoutPromise((resolve, reject) => {
      let func = self.getSolInterfaceV2(contractAbi, contractAddr, scFunc);
      func(chainID1, chainID2).call((err, result) => {
        if (err) {
          return reject(err);
        } else {
          let tokenPairIDs = [];
          if (result && Object.keys(result).length) {
            tokenPairIDs = result['id'];
          }
          return resolve(tokenPairIDs);
        }
      });
    }, moduleConfig.promiseTimeout, "ChainType: " + self.chainType + ' getTokenPairIDsByChainPair timeout');
  }
}

module.exports = WanChain;
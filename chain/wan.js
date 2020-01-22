const baseChain = require("chain/base.js");
const chainSCConfig = require('conf/moduleConfig.js');
const TimeoutPromise = require('utils/timeoutPromise.js')
let Contract = require("contract/Contract.js");

class WanChain extends baseChain {
  constructor(log, web3) {
    super(log, web3);
    this.chainType = 'WAN';
  }

  getTokenScManagerFuncInterface(crossChain, tokenType, contractFunc) {
    let scAbi = chainSCConfig.crossInfoDict[crossChain][tokenType]["tokenManagerAbi"];
    let contractAddr = chainSCConfig.crossInfoDict[crossChain][tokenType]["tokenManagerAddr"];
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
    }, chainSCConfig.promiseTimeout, "ChainType: " + chainType + ' getStoremanQuota timeout');
  }

  getQuotaLedgerFunc(crossChain, tokenType, contractFunc) {
    let scAbi = chainSCConfig.crossInfoDict[crossChain][tokenType]["quotaLedgerAbi"];
    let contractAddr = chainSCConfig.crossInfoDict[crossChain][tokenType]["quotaLedgerAddr"];
    return this.getSolInferface(scAbi, contractAddr, contractFunc);
  }

  getErc20StoremanQuota(crossChain, tokenType, tokenOrigAddr, smgAddress) {
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
    }, chainSCConfig.promiseTimeout, "ChainType: " + chainType + ' getErc20StoremanQuota timeout');
  }

  getStoremanGroups(crossChain) {
    let log = this.log;
    let chainType = this.chainType;
    let self = this;
    let abi = chainSCConfig.crossInfoDict[crossChain].COIN.smgAdminAbi;
    let contractAddr = chainSCConfig.crossInfoDict[crossChain].COIN.smgAdminAddr;
    let topic = [];

    return new TimeoutPromise((resolve, reject) => {
      try {
      self.getScEvent(contractAddr, topic, 0, 'latest', async (err, logs) => {
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
            if (i.event === 'SmgRegister') {
              storemanGroup.push(i.args);
            }
          }
          for (let i of parsedLogs) {
            if (i.event === 'SmgApplyUnRegister') {
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

    }, chainSCConfig.promiseTimeout, "ChainType: " + chainType + ' getStoremanGroups timeout');
  }

  async getErc20StoremanGroupsOfMutiTokens(crossChain, tokens) {
    let log = this.log;
    let chainType = this.chainType;
    let self = this;
    let erc20StoremanGroups = [];

    let multiTokens = tokens.map((token) => {
      return new TimeoutPromise(async (resolve, reject) => {
        let storeman;
        try {
          storeman = await self.getErc20StoremanGroups(crossChain, token.tokenOrigAddr);
        } catch (err) {
          reject(err);
        }
        erc20StoremanGroups = erc20StoremanGroups.concat(storeman);
        resolve();
      }, chainSCConfig.promiseTimeout, "ChainType: " + chainType + ' getErc20StoremanGroupsOfMutiTokens timeout');
    })
    try {
      await Promise.all(multiTokens);
    } catch (err) {
      log.error("getErc20StoremanGroupsOfMutiTokens", err);
      return Promise.reject(err);
    }
    return erc20StoremanGroups;
  }

  async getErc20StoremanGroups(crossChain, tokenAddr) {
    let log = this.log;
    let chainType = this.chainType;
    let self = this;
    let abi = chainSCConfig.crossInfoDict[crossChain].ERC20.smgAdminAbi;
    let topic = [null, this.encodeTopic('address', tokenAddr)];

    let addrs;
    if (Array.isArray(chainSCConfig.crossInfoDict[crossChain].ERC20.smgAdminAddr)) {
      addrs = chainSCConfig.crossInfoDict[crossChain].ERC20.smgAdminAddr;
    } else {
      addrs = [chainSCConfig.crossInfoDict[crossChain].ERC20.smgAdminAddr];
    }

    let storemanGroup = [];
    let getMultiStoremanEvent = addrs.map((contractAddr) => {
      return new TimeoutPromise((resolve, reject) => {
        self.getScEvent(contractAddr, topic, 0, 'latest', async (err, logs) => {
          if (err) {
            log.error(err);
            reject(err);
          } else {
            let parsedLogs = [];
            if (logs !== null) {
              let contract = new Contract(abi, contractAddr);
              parsedLogs = contract.parseEvents(JSON.parse(JSON.stringify(logs)));
            }

            for (let i of parsedLogs) {
              if (i.event === 'StoremanGroupRegistrationLogger') {
                storemanGroup.push(i.args);
              }
            }
            for (let i of parsedLogs) {
              if (i.event === 'StoremanGroupApplyUnRegistrationLogger') {
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
      }, chainSCConfig.promiseTimeout, "ChainType: " + chainType + ' getErc20StoremanGroups timeout');
    })

    try {
      await Promise.all(getMultiStoremanEvent);
    } catch (err) {
      log.error("getErc20StoremanGroups", err);
      return Promise.reject(err);
    }
    return storemanGroup;
  }

  getRegErc20Tokens(crossChain) {
    let log = this.log;
    let chainType = this.chainType;
    let self = this;
    let abi = chainSCConfig.crossInfoDict[crossChain].ERC20.tokenManagerAbi;
    let contractAddr = chainSCConfig.crossInfoDict[crossChain].ERC20.tokenManagerAddr;

    return new TimeoutPromise((resolve, reject) => {
      self.getScEvent(contractAddr, [], 0, 'latest', async (err, logs) => {
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
          for (let i of parsedLogs) {
            if (i.event === 'TokenAddedLogger') {
              if (regTokenRecord.hasOwnProperty(i.args.tokenOrigAddr) && (regTokenRecord[i.args.tokenOrigAddr] < i.blockNumber)) {
                for (let index = 0; index < regEvents.length; index++) {
                  if (regEvents[index].tokenOrigAddr === i.args.tokenOrigAddr) {
                    regEvents.splice(index, 1);
                    break;
                  }
                }
              }
              regTokenRecord[i.args.tokenOrigAddr] = i.blockNumber;
              regEvents.push(i.args);
            }
          }
          for (let i of regEvents) {
            self.bigNumber2String(i, 10);
          }
          resolve(regEvents);
        }
      });
    }, chainSCConfig.promiseTimeout, "ChainType: " + chainType + ' getRegErc20Tokens timeout');
  }
}

module.exports = WanChain;
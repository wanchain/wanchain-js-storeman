const baseChain = require("chain/base.js");
const moduleConfig = require('conf/moduleConfig.js');
let Contract = require("contract/Contract.js");

class WanChain extends baseChain {
  constructor(log, web3) {
    super(log, web3);
    this.chainType = 'WAN';
  }

  getTokenScManagerFuncInterface(crossChain, tokenType, contractFunc) {
    let scAbi = moduleConfig.crossInfoDict[crossChain][tokenType]["tokenManagerAbi"];
    let contractAddr = moduleConfig.crossInfoDict[crossChain][tokenType]["tokenManagerAddr"];
    return this.getSolInferface(scAbi, contractAddr, contractFunc);
  }

  getStoremanQuota(crossChain, tokenType, address) {
    let getStoremanGroup = this.getTokenScManagerFuncInterface(crossChain, tokenType, 'getStoremanGroup');
    return new Promise((resolve, reject) => {
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
    let scAbi = moduleConfig.crossInfoDict[crossChain][tokenType]["quotaLedgerAbi"];
    let contractAddr = moduleConfig.crossInfoDict[crossChain][tokenType]["quotaLedgerAddr"];
    return this.getSolInferface(scAbi, contractAddr, contractFunc);
  }

  getErc20StoremanQuota(crossChain, tokenType, tokenOrigAccount, smgAddress) {
    let func = this.getQuotaLedgerFunc(crossChain, tokenType, 'queryStoremanGroupQuota');
    return new Promise((resolve, reject) => {
      func(tokenOrigAccount, smgAddress, function(err, result) {
        if (err) {
          return reject(err);
        } else {
          return resolve(result);
        }
      });
    });
  }

  getStoremanGroups(crossChain) {
    let log = this.log;
    let self = this;
    let abi = moduleConfig.crossInfoDict[crossChain].COIN.smgAdminAbi;
    let contractAddr = moduleConfig.crossInfoDict[crossChain].COIN.smgAdminAddr;
    let topic = [];

    return new Promise((resolve, reject) => {
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
                if ((storemanGroup[index].tokenOrigAccount === i.args.tokenOrigAccount && storemanGroup[index].smgWanAddr === i.args.smgWanAddr)) {
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

    });
  }

  async getErc20StoremanGroupsOfMutiTokens(crossChain, tokens) {
    let log = this.log;
    let self = this;
    let erc20StoremanGroups = [];

    let multiTokens = tokens.map((token) => {
      return new Promise(async (resolve, reject) => {
        let storeman;
        try {
          storeman = await self.getErc20StoremanGroups(crossChain, token.tokenOrigAccount);
        } catch (err) {
          reject(err);
        }
        erc20StoremanGroups = erc20StoremanGroups.concat(storeman);
        resolve();
      });
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
    let self = this;
    let abi = moduleConfig.crossInfoDict[crossChain].ERC20.smgAdminAbi;
    // let topic = [null, this.encodeTopic('address', tokenAddr)];
    let topic = [];

    let addrs;
    if (Array.isArray(moduleConfig.crossInfoDict[crossChain].ERC20.smgAdminAddr)) {
      addrs = moduleConfig.crossInfoDict[crossChain].ERC20.smgAdminAddr;
    } else {
      addrs = [moduleConfig.crossInfoDict[crossChain].ERC20.smgAdminAddr];
    }

    let storemanGroup = [];
    let getMultiStoremanEvent = addrs.map((contractAddr) => {
      return new Promise((resolve, reject) => {
        self.getScEvent(contractAddr, topic, 0, 'latest', async (err, logs) => {
          if (err) {
            log.error(err);
            reject(err);
          } else {
            let parsedLogs = [];
            if (logs !== null) {
              let contract = new Contract(abi, contractAddr);
              let sign = contract.getEventSignature("StoremanGroupRegistrationLogger");
              console.log("aaron debug here", sign);
              parsedLogs = contract.parseEvents(JSON.parse(JSON.stringify(logs)));
            }

            for (let i of parsedLogs) {
              if (i.event === 'StoremanGroupRegistrationLogger' && i.args.tokenOrigAccount === tokenAddr) {
                storemanGroup.push(i.args);
              }
            }
            for (let i of parsedLogs) {
              if (i.event === 'StoremanGroupApplyUnRegistrationLogger' && i.args.tokenOrigAccount === tokenAddr) {
                for (let index = 0; index < storemanGroup.length; index++) {
                  if ((storemanGroup[index].tokenOrigAccount === i.args.tokenOrigAccount && storemanGroup[index].smgWanAddr === i.args.smgWanAddr)) {
                    storemanGroup.splice(index, 1);
                    break;
                  }
                }
              }
            }
            resolve(storemanGroup);
          }
        })
      });
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
    let self = this;
    let abi = moduleConfig.crossInfoDict[crossChain].ERC20.tokenManagerAbi;
    let contractAddr = moduleConfig.crossInfoDict[crossChain].ERC20.tokenManagerAddr;

    return new Promise((resolve, reject) => {
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
              if (regTokenRecord.hasOwnProperty(i.args.tokenOrigAccount) && (regTokenRecord[i.args.tokenOrigAccount] < i.blockNumber)) {
                for (let index = 0; index < regEvents.length; index++) {
                  if (regEvents[index].tokenOrigAccount === i.args.tokenOrigAccount) {
                    regEvents.splice(index, 1);
                    break;
                  }
                }
              }
              regTokenRecord[i.args.tokenOrigAccount] = i.blockNumber;
              regEvents.push(i.args);
            }
          }
          for (let i of regEvents) {
            self.bigNumber2String(i, 10);
          }
          resolve(regEvents);
        }
      });
    });
  }
}

module.exports = WanChain;
const moduleConfig = require('conf/moduleConfig.js');
const configPath = 'conf/config.json';
// let config = loadConfig();
const fs = require('fs');

const Eos = require('eosjs');
// const Web3 = require("web3");
// const net = require('net');
const EthChain = require('chain/eth');
const WanChain = require('chain/wan');
const EosChain = require('chain/eos');
const crossChainAccount = require('utils/encrypt/crossAccountEncrypt');

function loadConfig() {
  let configJson = JSON.parse(fs.readFileSync('conf/config.json'));
  return global.testnet ? configJson.testnet : configJson.main;
}

function getChain(chainType) {
  try{
    config = loadConfig();
  } catch(err) {
    console.log(err);
  }
  if (chainType === 'ETH') {
    return new EthChain(global.syncLogger, config.crossTokens[chainType].CONF.nodeUrl);
  } else if (chainType === 'WAN') {
    return new WanChain(global.syncLogger, config.wanWeb3Url);
  } else if (chainType === 'EOS') {
    return new EosChain(global.syncLogger, config.crossTokens[chainType].CONF.nodeUrl);
  } else {
    return null;
  }
}

function initChain(chainType) {
  let chainName = chainType.toLowerCase() + "Chain";
  global[chainName] = getChain(chainType);
}

function getGlobalChain(chainType) {
  let chainName = chainType.toLowerCase() + "Chain";
  global[chainName] = getChain(chainType);
  return global[chainName];
}

async function initNonce(chainType) {
  return new Promise(async (resolve, reject) => {
    try {
      let config = loadConfig();
      global[chainType.toLowerCase() + 'NonceRenew'] = false;
      global[chainType.toLowerCase() + 'NoncePending'] = false;

      let chainNonce = chainType.toLowerCase() + 'LastNonce';
      let chainName = chainType.toLowerCase() + "Chain";
      let storemanAddress;
      if (chainType === 'WAN') {
        storemanAddress = config.storemanWan;
      } else {
        if (moduleConfig.crossInfoDict[chainType].CONF.nonceless) {
          resolve();
          return;
        }
        storemanAddress = config.crossTokens[chainType].CONF.storemanOri;
      }

      let nonce = await global[chainName].getNonceIncludePendingSync(storemanAddress);
      global[chainNonce] = parseInt(nonce, 16);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

async function initCrossTokens(chainType, storemanWan, storemanOri) {
  let wanChain = getGlobalChain('WAN');
  let crossTokens = {};
  let empty = true;

  return new Promise(async (resolve, reject) => {
    try {
      for (let crossChain in moduleConfig.crossInfoDict) {
        if (crossChain !== chainType) {
          continue;
        }
        if (!moduleConfig.crossInfoDict[crossChain].CONF.enable) {
          continue;
        }
        crossTokens[crossChain] = {};
        // console.log(crossChain);

        if (moduleConfig.crossInfoDict[crossChain].COIN) {
          let oriStoremanGroups = await wanChain.getStoremanGroups(crossChain);
          for (let storeman of oriStoremanGroups) {
            if (storeman.smgAddress === storemanWan && storeman.smgOriginalChainAddress === storemanOri) {
              crossTokens[crossChain]['0x'] = {
                "origHtlc": moduleConfig.crossInfoDict[crossChain].COIN.originalChainHtlcAddr,
                "wanHtlc": moduleConfig.crossInfoDict[crossChain].COIN.wanchainHtlcAddr,
                "tokenType": "COIN",
                "tokenSymbol": crossChain
              };
              empty = false;
              break;
            }
          }
        }

        if (moduleConfig.crossInfoDict[crossChain].TOKEN) {
          let oriTokens = await wanChain.getRegTokenTokens(crossChain);
          let oriTokenStoremanGroups = await wanChain.getTokenStoremanGroupsOfMutiTokens(crossChain, oriTokens);
          // console.log("oriTokenStoremanGroups", oriTokenStoremanGroups);

          for (let storeman of oriTokenStoremanGroups) {
            if (storeman.smgWanAddr === storemanWan && storeman.smgOrigAddr === storemanOri) {
            // if (storeman.smgWanAddr === storemanWan && storeman.smgOrigAccount === storemanOri) {
              for (let token of oriTokens) {
                if (token.tokenOrigAddr === storeman.tokenOrigAddr) {
                // if (token.tokenOrigAccount === storeman.tokenOrigAccount) {
                  let chain = getGlobalChain('WAN');
                  let tokenInfo = await chain.getTokenInfo(token.tokenWanAddr);
                  Object.assign(token, tokenInfo);
                  chain.bigNumber2String(token, 10);
                  crossTokens[crossChain][decodeAccount(crossChain, token.tokenOrigAddr)] = token;
                  // crossTokens[crossChain][decodeAccount(crossChain, token.tokenOrigAccount)] = token;
                  empty = false;
                  break;
                }
              }
            }
          }
        }
      }
      if (!empty) {
        resolve(crossTokens);
      } else {
        resolve(null);
      }
    } catch (err) {
      reject(err);
    }
  });
}

async function initConfig(chainType, storemanWan, storemanOri) {
  let storemanWanAddr = storemanWan.toLowerCase();
  let storemanOriAddr = encodeAccount(chainType, storemanOri.toLowerCase());
  console.log("aaron debug here, storemanOriAddr", storemanOri, storemanOriAddr)

  return new Promise(async (resolve, reject) => {
    try {
      let crossTokens = await initCrossTokens(chainType, storemanWanAddr, storemanOriAddr);
      if (crossTokens != null) {
        fs.readFile(configPath, (err, data) => {
          if (err) {
            reject(err);
          }

          var config = data.toString();
          config = JSON.parse(config);

          var net;
          if (global.testnet) {
            net = "testnet";
          } else {
            net = "main";
          }
          config[net].storemanWan = storemanWanAddr;
          config[net].crossTokens[chainType].CONF.storemanOri = storemanOriAddr;
          config[net].crossTokens[chainType].TOKEN = crossTokens[chainType];

          var str = JSON.stringify(config, null, 2);
          fs.writeFile(configPath, str, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(crossTokens);
            }
          })
        })
      } else {
        resolve(null);
      }
    } catch (err) {
      reject(err);
    }
  });
}



function backupIssueFile(issueCollectionPath) {
  let date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hour = date.getHours();
  let minute = date.getMinutes();
  let second = date.getSeconds();

  let issueCollection = issueCollectionPath + 'issueCollection' + year + '-' + month + '-' + day + '.txt';
  let newName = issueCollectionPath + 'issueCollection' + year + '-' + month + '-' + day + '-' + hour + minute + second + '.txt';

  fs.exists(issueCollection, (exists) => {
    if (exists) {
      fs.rename(issueCollection, newName, (err) => {
        if (err) {
          console.log(err);
        }
        console.log('backupIssueFile done!', issueCollection, 'to', newName);
      })
    }
  });
}

function decodeAccount(chain, account) {
  let crossAccount = new crossChainAccount(chain.toLowerCase());
  return crossAccount.decodeAccount(account).account;
  // if (account === "0x0f000101656f73696f2e746f6b656e0000000000" || account === "0x010003656f73696f2e746f6b656e") {
  //   return 'eosio.token';
  // } else if (account === "0x0b00010268746c63656f73000000000000000000" || account === "0x01000368746c63656f73") {
  //   return 'htlceos';
  // } else if (account === "0x0800010474657374000000000000000000000000") {
  //   return 'aaron';
  // }
}

function encodeAccount(chain, account) {
  let crossAccount = new crossChainAccount(chain.toLowerCase());
  return crossAccount.encodeAccount(account);
  // return '0x0c00010373746f72656d616e0000000000000000';
  return '0x010003656f73696f2e746f6b656e';
}

function eosToFloat(str) 
{ 
  const floatRegex = /[^\d.-]/g
  return parseFloat(str.replace(floatRegex, '')); 
}

function floatToEos(amount, symbol) {
  let DecimalPad = Eos.modules.format.DecimalPad;
  let precision = 4;
  return `${DecimalPad(amount, precision)} ${symbol}`
}

function sleep(time) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve();
    }, time);
  })
}

function writeConfigToFile(argv) {
  return new Promise(async (resolve, reject) => {
    fs.readFile(configPath, (err, data) => {
      if (err) {
        log.error("writeConfigToFile readFile ", err);
        resolve(false);
      }

      var config = data.toString();
      config = JSON.parse(config);

      var net;
      if (argv.testnet) {
        net = "testnet";
      } else {
        net = "main";
      }

      if (argv.leader) {

      } else {

      }
      let url = 'http://' + process.env.RPCIP + ':' + process.env.RPCPORT;
      let isLeader = process.env.IS_LEADER === 'true' ? true : false;
      config[net].wanWeb3Url = url;
      config[net].mpcUrl = url;
      config[net].isLeader = isLeader;

      var str = JSON.stringify(config, null, 2);
      fs.writeFile(filename, str, (err) => {
        if (err) {
          log.error("writeConfigToFile writeFile ", err);
          resolve(false);
        } else {
          log.info("Update done! mpcUrl %s", url);
          resolve(true);
        }
      })
    })
  });
};

exports.sleep = sleep;
exports.loadConfig = loadConfig;
exports.initChain = initChain;
exports.getGlobalChain = getGlobalChain;
exports.getChain = getChain;
exports.initNonce = initNonce;
exports.initConfig = initConfig;
exports.initCrossTokens = initCrossTokens;
exports.backupIssueFile = backupIssueFile;
exports.encodeAccount = encodeAccount;
exports.decodeAccount = decodeAccount;
exports.eosToFloat = eosToFloat;
exports.floatToEos = floatToEos;
exports.writeConfigToFile = writeConfigToFile;
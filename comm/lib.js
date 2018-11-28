const moduleConfig = require('conf/moduleConfig.js');
const configPath = 'conf/config.json';
let configJson = require('conf/config.json');
let config = moduleConfig.testnet?configJson.testnet:configJson.main;
const fs = require('fs');

const Web3 = require("web3");
const net = require('net');
const EthChain = require('chain/eth');
const WanChain = require('chain/wan');

function getChain(chainType) {
  let loadConfig = function() {
    configJson = JSON.parse(fs.readFileSync('conf/config.json'));
    config = moduleConfig.testnet?configJson.testnet:configJson.main;
  }
  try{
    loadConfig();
  } catch(err) {
    console.log(err);
  }
  let chain = chainType.toLowerCase();
  if (chain === 'eth') {
    if (config.ethWeb3Url.indexOf("http://") !== -1) {
      return new EthChain(global.syncLogger, new Web3(new Web3.providers.HttpProvider(config.ethWeb3Url)));
    } else {
      return new EthChain(global.syncLogger, new Web3(new Web3.providers.IpcProvider(config.ethWeb3Url, net)));
    }
  } else if (chain === 'wan') {
    if (config.wanWeb3Url.indexOf("http://") !== -1) {
      return new WanChain(global.syncLogger, new Web3(new Web3.providers.HttpProvider(config.wanWeb3Url)));
    } else {
      return new WanChain(global.syncLogger, new Web3(new Web3.providers.IpcProvider(config.wanWeb3Url, net)));
    }
  } else {
    return null;
  }
}

function initChain(chainType) {
  let chainName = chainType.toLowerCase() + "Chain";
  global[chainName] = getChain(chainType);
}

async function initNonce(chainType) {
  return new Promise(async (resolve, reject) => {
    try {
      let chainNonce = chainType.toLowerCase() + 'LastNonce';
      let chainName = chainType.toLowerCase() + "Chain";
      let storemanAddress;
      if (chainType.toLowerCase() === 'wan') {
        storemanAddress = config.storemanWan;
      } else if (chainType.toLowerCase() === 'eth') {
        storemanAddress = config.storemanEth;
      } else {
        return;
      }
      let nonce = await global[chainName].getNonceIncludePendingSync(storemanAddress);
      global[chainNonce] = parseInt(nonce, 16);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

async function initCrossTokens(storemanWan, storemanEth) {
  let wanChain = getGlobalChain('wan');
  let crossTokens = {};
  let empty = true;

  return new Promise(async (resolve, reject) => {
    try {
      for (let crossChain in moduleConfig.crossInfoDict) {
        crossTokens[crossChain] = {};
        let ethStoremanGroups = await wanChain.getStoremanGroups(crossChain);
        let ethErc20Tokens = await wanChain.getRegErc20Tokens(crossChain);
        let ethErc20StoremanGroups = await wanChain.getErc20StoremanGroupsOfMutiTokens(crossChain, ethErc20Tokens);

        for (let storeman of ethStoremanGroups) {
          if (storeman.smgAddress === storemanWan && storeman.smgOriginalChainAddress === storemanEth) {
            crossTokens[crossChain]['0x'] = {
              "tokenType": "COIN",
              "tokenSymbol": "ETH"
            };
            empty = false;
            break;
          }
        }

        for (let storeman of ethErc20StoremanGroups) {
          if (storeman.smgWanAddr === storemanWan && storeman.smgOrigAddr === storemanEth) {
            for (let token of ethErc20Tokens) {
              if (token.tokenOrigAddr === storeman.tokenOrigAddr) {
                let chain = getGlobalChain(crossChain.toLowerCase());
                let tokenInfo = await chain.getErc20Info(token.tokenOrigAddr);
                Object.assign(token, tokenInfo);
                chain.bigNumber2String(token, 10);
                crossTokens[crossChain][token.tokenOrigAddr] = token;
                empty = false;
                break;
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

async function initConfig(storemanWan, storemanEth) {
  let storemanWanAddr = storemanWan.toLowerCase();
  let storemanEthAddr = storemanEth.toLowerCase();

  return new Promise(async (resolve, reject) => {
    try {
      let crossTokens = await initCrossTokens(storemanWanAddr, storemanEthAddr);
      if (crossTokens != null) {
        fs.readFile(configPath, (err, data) => {
          if (err) {
            reject(err);
          }

          var config = data.toString();
          config = JSON.parse(config);

          var net;
          if (moduleConfig.testnet) {
            net = "testnet";
          } else {
            net = "main";
          }
          config[net].storemanWan = storemanWanAddr;
          config[net].storemanEth = storemanEthAddr;
          config[net].crossTokens = crossTokens;

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

function getGlobalChain(chainType) {
  let chainName = chainType.toLowerCase() + "Chain";
  global[chainName] = getChain(chainType);
  return global[chainName];
}

function backupIssueFile() {
  let date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hour = date.getHours();
  let minute = date.getMinutes();
  let second = date.getSeconds();

  let issueCollection = config.issueCollectionPath + 'issueCollection' + year + '-' + month + '-' + day + '.txt';
  let newName = config.issueCollectionPath + 'issueCollection' + year + '-' + month + '-' + day + '-' + hour + minute + second + '.txt';

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

function sleep(time) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve();
    }, time);
  })
}

exports.sleep = sleep;
exports.initChain = initChain;
exports.getGlobalChain = getGlobalChain;
exports.getChain = getChain;
exports.initNonce = initNonce;
exports.initConfig = initConfig;
exports.initCrossTokens = initCrossTokens;
exports.backupIssueFile = backupIssueFile;
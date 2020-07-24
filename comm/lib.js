const configPath = 'conf/config.json';
// let config = loadConfig();
const fs = require('fs');
const { Decimal } = require("decimal.js");
// const Web3 = require("web3");
// const net = require('net');
const BigNumber = require('bignumber.js');
const crypto = require('crypto');
const secp256k1 = require('secp256k1');

const EthChain = require('chain/eth');
const WanChain = require('chain/wan');
const EosChain = require('chain/eos');
const crossChainAccount = require('utils/encrypt/crossAccountEncrypt');

const chainConstants = require('bip44-constants')

function loadJsonFile(path) {
  let json = JSON.parse(fs.readFileSync(path));
  return json;
}

function loadConfig() {
  if (!global.configMutex) {
    let configJson = JSON.parse(fs.readFileSync('conf/config.json'));
    global.config = global.testnet ? configJson.testnet : configJson.main;
  }
  return global.config;
}

function getChain(chainType) {
  try{
    loadConfig();
  } catch(err) {
    console.log(err);
  }
  if (chainType === 'ETH') {
    return new EthChain(global.syncLogger, global.config.crossTokens[chainType].CONF.nodeUrl);
  } else if (chainType === 'WAN') {
    return new WanChain(global.syncLogger, global.config.wanWeb3Url);
  } else if (chainType === 'EOS') {
    return new EosChain(global.syncLogger, global.config.crossTokens[chainType].CONF.nodeUrl);
  } else {
    return null;
  }
}

function initChain(chainType) {
  let chainName = chainType.toLowerCase() + "Chain";
  global[chainName] = getChain(chainType.toUpperCase());
}

function getGlobalChain(chainType) {
  let chainName = chainType.toLowerCase() + "Chain";
  global[chainName] = getChain(chainType.toUpperCase());
  return global[chainName];
}

async function initNonce(chainType, address) {
  return new Promise(async (resolve, reject) => {
    if (global.storemanRenew) {
      resolve();
      return;
    }
    global.nonce = {};
    try {
      let chainName = chainType.toLowerCase() + "Chain";
      global[chainType.toLowerCase() + 'NonceRenew'] = {};
      global[chainType.toLowerCase() + 'NoncePending'] = {};
      global[chainType.toLowerCase() + 'Mutex'] = {};
      global[chainType.toLowerCase() + 'LastNonce'] = {};
      global[chainType.toLowerCase() + 'UsedNonce'] = {};

      global[chainType.toLowerCase() + 'NonceRenew'][address] = false;
      global[chainType.toLowerCase() + 'NoncePending'][address] = new Set();
      global[chainType.toLowerCase() + 'Mutex'][address] = false;
      global[chainType.toLowerCase() + 'UsedNonce'][address] = {};

      let nonce = await global[chainName].getNonceIncludePendingSync(address);
      global[chainType.toLowerCase() + 'LastNonce'][address] = parseInt(nonce, 16);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

async function initCrossTokens(crossChain, storemanWan, storemanOri, storemanPk) {
  let wanChain = getGlobalChain('WAN');
  let crossTokens = {};
  let empty = true;
  const moduleConfig = require('conf/moduleConfig.js');

  return new Promise(async (resolve, reject) => {
    try {
      // for (let chainType in moduleConfig.crossInfoDict) {
      //   if (chainType !== crossChain) {
      //     continue;
      //   }
        crossTokens[crossChain] = {};
        // if (!moduleConfig.crossInfoDict[crossChain].CONF.enable) {
        if (crossChain !== global.crossChain) {
          resolve(crossTokens);
          return;
          // continue;
        }

        if (moduleConfig.crossInfoDict[crossChain].CONF.schnorrMpc) {
          if (!storemanPk) {
            resolve(null);
            return;
          }

          if (moduleConfig.crossInfoDict[crossChain].TOKEN) {
            let oriTokens = await wanChain.getRegTokenTokens(crossChain);

            let multiTokens = oriTokens.map((token) => {
              return new Promise(async (resolve, reject) => {
                let tokenStoremanGroups;
                try {
                  tokenStoremanGroups = await wanChain.getTokenStoremanGroups(crossChain, token.tokenOrigAccount, storemanPk);
                  
                  // for (let storeman of tokenStoremanGroups) {
                  //   if (storeman.storemanGroup === storemanPk) {
                    if (tokenStoremanGroups.length > 0) {
                      token.name = wanChain.client.toAscii(token.name);
                      token.tokenSymbol = wanChain.client.toAscii(token.symbol);
                      token.tokenType = "TOKEN";
                      wanChain.bigNumber2String(token, 10);
                      crossTokens[crossChain][decodeAccount(crossChain, token.tokenOrigAccount)] = token;
                      empty = false;
                    }
                  // }
                  resolve(); 
                } catch (err) {
                  reject(err);
                }
              });
            })
            try {
              await Promise.all(multiTokens);
            } catch (err) {
              return await Promise.reject(err);
            }
          }
        } else {
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
                // break;
              }
            }
          }

          if (moduleConfig.crossInfoDict[crossChain].TOKEN) {
            let oriTokens = await wanChain.getRegTokenTokens(crossChain);

            let multiTokens = oriTokens.map((token) => {
              return new Promise(async (resolve, reject) => {
                let tokenStoremanGroups;
                try {
                  tokenStoremanGroups = await wanChain.getTokenStoremanGroups(crossChain, token.tokenOrigAddr, storemanWan, storemanOri);
       
                  // for (let storeman of tokenStoremanGroups) {
                  //   if (storeman.smgWanAddr === storemanWan && storeman.smgOrigAddr === storemanOri) {3
                  if (tokenStoremanGroups.length > 0) {
                    let chain = getGlobalChain('WAN');
                    let tokenInfo = await chain.getTokenInfo(token.tokenWanAddr);
                    Object.assign(token, tokenInfo);
                    chain.bigNumber2String(token, 10);
                    crossTokens[crossChain][decodeAccount(crossChain, token.tokenOrigAddr)] = token;
                    empty = false;
                  }
                  // }
                  resolve();
                } catch (err) {
                  reject(err);
                }
              });
            })
            try {
              await Promise.all(multiTokens);
            } catch (err) {
              return await Promise.reject(err);
            }
          }
        }

      // }
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

async function initConfig(crossChain, storemanWan, storemanOri, storemanPk) {
  let storemanWanAddr = storemanWan.toLowerCase();
  let storemanOriAddr = encodeAccount(crossChain, storemanOri.toLowerCase());
  const moduleConfig = require('conf/moduleConfig.js');
  let times = 0;
  let retryTimes = moduleConfig.web3RetryTimes;

  return new Promise(async (resolve, reject) => {
    let initTokens = async function() {
      try {
        let crossTokens = await initCrossTokens(crossChain, storemanWanAddr, storemanOriAddr, storemanPk);
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

            config[net].crossTokens[crossChain].CONF.storemanWan = storemanWanAddr;
            config[net].crossTokens[crossChain].CONF.storemanOri = storemanOri;
            config[net].crossTokens[crossChain].TOKEN = crossTokens[crossChain];
            if (moduleConfig.crossInfoDict[crossChain].CONF.schnorrMpc) {
              config[net].crossTokens[crossChain].CONF.storemanPk = storemanPk;
            }

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
        if (err) {
          if (times >= retryTimes) {
            console.log("initTokens failed", err);
            reject(err);
          } else {
            console.log("initTokens retry", times);
            times++;
            initTokens();
          }
        } else {
          reject(err);
        }
      }
    }

    try {
      initTokens();
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
}

function encodeAccount(chain, account) {
  let crossAccount = new crossChainAccount(chain.toLowerCase());
  return crossAccount.encodeAccount(account);
}

function eosToFloat(str) 
{ 
  const floatRegex = /[^\d.-]/g
  return parseFloat(str.replace(floatRegex, '')); 
}

function floatToEos(amount, symbol, decimals = 4) {
  let precision = parseInt(decimals);
  return `${new Decimal(amount).toFixed(precision)} ${symbol}`
}


function hexTrip0x(hexs) {
  if (0 == hexs.indexOf('0x')) {
      return hexs.slice(2);
  }
  return hexs;
}

function hexAdd0x(hexs) {
  if (0 != hexs.indexOf('0x')) {
      return '0x' + hexs;
  }
  return hexs;
}

function toBigNumber (n) {
  n = n || 0;

  if (typeof n === 'string' && (n.indexOf('0x') === 0 || n.indexOf('-0x') === 0)) {
      return new BigNumber(n.replace('0x', ''), 16);
  }

  return new BigNumber(n.toString(10), 10);
}

function tokenToWeiHex(token, decimals = 18) {
  let wei = toBigNumber(token).times('1e' + decimals).trunc();
  return '0x' + wei.toString(16);
}

function tokenToWei(token, decimals = 18) {
  let wei = toBigNumber(token).times('1e' + decimals).trunc();
  return wei.toString(10);
}

function weiToToken(tokenWei, decimals = 18) {
  return toBigNumber(tokenWei).dividedBy('1e' + decimals).toString(10);
}

function generateKey() {
  let randomBuf;
  do {
    randomBuf = crypto.randomBytes(32);
  } while (!secp256k1.privateKeyVerify(randomBuf));
  return '0x' + randomBuf.toString('hex');
}

function sha256(params) {
  let kBuf = new Buffer(params.slice(2), 'hex');
  let hash = crypto.createHash("sha256").update(kBuf);
  return '0x' + hash.digest("hex");
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
    if (global.storemanRenew) {
      resolve();
      return;
    }

    fs.readFile(configPath, (err, data) => {
      if (err) {
        console.log("writeConfigToFile readFile ", err);
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

      // let url = 'http://' + process.env.RPCIP + ':' + process.env.RPCPORT;
      // config[net].wanWeb3Url = url;
      // config[net].mpcUrl = url;


      let url;
      if (argv.mpcIP || argv.mpcipc) {
        if (!argv.mpcipc) {
          url = 'http://' + argv.mpcIP + ':' + argv.mpcPort;
        } else {
          url = argv.mpcipc;
        }
        config[net].mpcUrl = url;
        global.mpcUrl = url;
      }

      if (argv.c && argv.oriurl) {
        config[net].crossTokens[argv.c.toUpperCase()].CONF.nodeUrl = argv.oriurl;
      }

      if (argv.c && argv.oribpurl) {
        config[net].crossTokens[argv.c.toUpperCase()].CONF.bpNodeUrl = argv.oribpurl;
      }

      if (argv.wanurl) {
        config[net].wanWeb3Url = argv.wanurl;
      }

      let isLeader = argv.leader ? true : false
      config[net].isLeader = isLeader;

      var str = JSON.stringify(config, null, 2);
      fs.writeFile(configPath, str, (err) => {
        if (err) {
          console.log("writeConfigToFile writeFile ", err);
          resolve(false);
        } else {
          console.log("writeConfigToFile writeFile done!");
          resolve(true);
        }
      })
    })
  });
};

function getChainIdByChainSymbol(chainSymbol) {
  let chainConstant = chainConstants.filter(item => item[1] === chainSymbol);
  let chainIndex = chainConstant[0][0].toString(16);
  chainIndex = chainIndex.slice(1, chainIndex.length);
  return chainIndex;
}

function getChainInfoByChainIndex(chainIndex) {
  let chainInfo = chainConstants.filter(item => item[0] === Number('0x80000000'.toString(10)) + parseInt(chainIndex));
  return chainInfo[0];
}

function getChainInfoByChainId(chainId) {
  let chainInfo = chainConstants.filter(item => item[0] === Number(chainId));
  return chainInfo[0];
}

async function initCrossStoremanV2(wAddress) {
  let wanChain = getGlobalChain('WAN');

  // return new Promise(async (resolve, reject) => {
    try {
      // let storeman = await wanChain.getStoremanInfo(wAddress);
      // let groupID = storeman.groupId;
      let groupID = '0x111122223333444455556666777788889999AAAABBBBCCCCDDDDEEEEFFFFCCCC';
      let storemanGroupConfig = await wanChain.getStoremanGroupConfig(groupID);
      storemanGroupConfig.chain1 = '2153201998';
      storemanGroupConfig.chain2 = '2147483708';
      return storemanGroupConfig;
      // resolve(storemanGroupConfig);
    } catch (err) {
      throw (new Error(err));
      // reject(err);
    }
  // });
}

async function initCrossTokensV2(chainID1, chainID2) {
  let wanChain = getGlobalChain('WAN');
  let crossTokens = {};
  let empty = true;
  let self = this;
  const moduleConfig = require('conf/moduleConfig.js');

  // return new Promise(async (resolve, reject) => {
    try {
      let tokenPairs = await wanChain.getTokenPairsByChainPair(chainID1, chainID2);

      tokenPairs.map((tokenPair) => {
        let oriChain = getChainInfoByChainId(tokenPair.fromChainID)[1];
        crossTokens[oriChain][tokenPair.fromAccount] = {};
        crossTokens[oriChain][tokenPair.fromAccount].name = tokenPair.ancestorSymbol;
        crossTokens[oriChain][tokenPair.fromAccount].tokenSymbol = tokenPair.ancestorSymbol;
        crossTokens[oriChain][tokenPair.fromAccount].decimals = tokenPair.ancestorDecimals;

        let shadowChain = getChainInfoByChainId(tokenPair.toChainID)[1];
        crossTokens[shadowChain][tokenPair.tokenAddress] = {};
        crossTokens[shadowChain][tokenPair.tokenAddress].name = tokenPair.ancestorSymbol;
        crossTokens[shadowChain][tokenPair.tokenAddress].tokenSymbol = tokenPair.ancestorSymbol;
        crossTokens[shadowChain][tokenPair.tokenAddress].decimals = tokenPair.ancestorDecimals;

        if (tokenPair.fromAccount === "0x0000000000000000000000000000000000000000") {
          crossTokens[oriChain][tokenPair.fromAccount].tokenType = "COIN";
          crossTokens[shadowChain][tokenPair.tokenAddress].tokenType = "COIN";
        } else {
          crossTokens[oriChain][tokenPair.fromAccount].tokenType = "TOKEN";
          crossTokens[shadowChain][tokenPair.tokenAddress].tokenType = "TOKEN";
        }
      });
      return crossTokens;
      // resolve(crossTokens);
    } catch (err) {
      throw (new Error(err));
      // reject(err);
    }
  // });
}

async function initConfigV2(wAddress) {
  // let storemanGroupConfig = await initCrossStoremanV2(wAddress);
  // let crossTokens = await initCrossTokensV2(storemanGroupConfig.chain1, storemanGroupConfig.chain2);

  try {
    let wanChain = getGlobalChain('WAN');
    let groupID = '0x111122223333444455556666777788889999AAAABBBBCCCCDDDDEEEEFFFFCCCC';
    let storemanGroupConfig = await wanChain.getStoremanGroupConfig(groupID);
    storemanGroupConfig.chain1 = '2153201998';
    storemanGroupConfig.chain2 = '2147483708';
    let tokenPairs = await wanChain.getTokenPairsByChainPair(storemanGroupConfig.chain1, storemanGroupConfig.chain2);
    let tokenPairIDs = await wanChain.getTokenPairIDsByChainPair(storemanGroupConfig.chain1, storemanGroupConfig.chain2);

    fs.readFile(configPath, (err, data) => {
      if (err) {
        throw (new Error(err));
      }
  
      var config = data.toString();
      config = JSON.parse(config);
  
      var net;
      if (global.testnet) {
        net = "testnet";
      } else {
        net = "main";
      }
  
      config[net].storemanGroups[groupID] = storemanGroupConfig;
      config[net].tokenPairIDs = tokenPairIDs;
      config[net].tokenPairs = tokenPairs;
  
      let chain1 = getChainInfoByChainId(storemanGroupConfig.chain1)[1];
      if (!config[net].crossTokens[chain1]) {
        config[net].crossTokens[chain1] = {"CONF": {}};
      }
      config[net].crossTokens[chain1].CONF.curve = storemanGroupConfig.curve1;
      config[net].crossTokens[chain1].CONF.storemanPk = storemanGroupConfig.gpk1;
  
      let chain2 = getChainInfoByChainId(storemanGroupConfig.chain2)[1];
      if (!config[net].crossTokens[chain2]) {
        config[net].crossTokens[chain2] = {"CONF": {}};
      }
      config[net].crossTokens[chain2].CONF.curve = storemanGroupConfig.curve2;
      config[net].crossTokens[chain2].CONF.storemanPk = storemanGroupConfig.gpk2;
  
      var str = JSON.stringify(config, null, 2);
      fs.writeFile(configPath, str, (err) => {
        if (err) {
          throw (new Error(err));
        } else {
          return tokenPairs;
        }
      })
    })
  } catch (err) {
    throw (new Error(err));
  }

}

function getChainPairs(groupID) {
  let storemanGroupConfig = global.config.storemanGroups[groupID];
  
  let chain1 = getChainInfoByChainId(storemanGroupConfig.chain1)[1];
  let chain2 = getChainInfoByChainId(storemanGroupConfig.chain2)[1];
  return [chain1, chain2]
}

exports.sleep = sleep;
exports.loadJsonFile = loadJsonFile;
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
exports.hexTrip0x = hexTrip0x;
exports.hexAdd0x = hexAdd0x;
exports.tokenToWeiHex = tokenToWeiHex;
exports.tokenToWei = tokenToWei;
exports.weiToToken = weiToToken;
exports.generateKey = generateKey;
exports.sha256 = sha256;
exports.writeConfigToFile = writeConfigToFile;
exports.getChainIdByChainSymbol = getChainIdByChainSymbol;
exports.getChainInfoByChainIndex = getChainInfoByChainIndex;
exports.getChainInfoByChainId = getChainInfoByChainId;
exports.initConfigV2 = initConfigV2;
exports.getChainPairs = getChainPairs;
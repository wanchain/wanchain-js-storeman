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

      global[chainType.toLowerCase() + 'NonceRenew'][address] = false;
      global[chainType.toLowerCase() + 'NoncePending'][address] = false;
      global[chainType.toLowerCase() + 'Mutex'][address] = false;

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
        if (!moduleConfig.crossInfoDict[crossChain].CONF.enable) {
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
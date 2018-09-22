const fs = require('fs');
const config = JSON.parse(fs.readFileSync('conf/config.json'));

const Web3 = require("web3");
const net = require('net');
const EthChain = require('chain/eth');
const WanChain = require('chain/wan');

function getChain(chainType) {
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
      let chainNonce = chainType + 'LastNonce';
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

function getGlobalChain(chainType) {
  let chainName = chainType.toLowerCase() + "Chain";
  return global[chainName];
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
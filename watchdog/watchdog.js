"use strict";

const fs = require('fs');
const {
  getGlobalChain,
  sleep
} = require('comm/lib');

const Logger = require('comm/logger.js');
const config = require('watchdog/config.js');

let log = new Logger("watchdogLogger", "log/watchdog.log", "log/watchdog_error.log", 'debug');
let chainWeb3IpOpsDict = config.chainWeb3IpOpsDict;
let testnet = config.testNet;
let curEthWeb3Ip = config.curEthWeb3Ip;
let syncInterval = config.syncInterval;
let firstStart = true;

function checkTimeout(timeTicks,timeOutOfLastBlock,chainType){
  let nowTimeStamp = Math.round(new Date().getTime()/1000);   // ms->s
  log.info("nowTimeStamp: %s, inputTimeStamp: %s, timeOutOfLastBlock:%s, chainType:%s",
    nowTimeStamp,timeTicks,timeOutOfLastBlock,chainType);
  if(nowTimeStamp >= (timeTicks + timeOutOfLastBlock) ){
    return true;
  }else{
    return false;
  }
}

function watchdog(chainType) {
  let blockNumber;
  let blockTimeStamp;
  let timeOutOrNot;
  let nodeIpOps = chainWeb3IpOpsDict[chainType];
  let timeOutOfLastBlock = nodeIpOps.timeOutOfLastBlock;
  let currentOKWeb3IpIndex = nodeIpOps.currentOKWeb3IpIndex;
  let fileName = nodeIpOps.nextWeb3IpFileName;
  let web3Ips = nodeIpOps.web3Ips;

  if (firstStart && (web3Ips.indexOf(curEthWeb3Ip) !== -1)) {
    currentOKWeb3IpIndex = web3Ips.indexOf(curEthWeb3Ip);
    firstStart = false;
  }

  let chain = getGlobalChain('ETH');

  let updateWeb3Ip = async function() {
    try {
      let nextIp;
      let len = web3Ips.length;
      currentOKWeb3IpIndex = (currentOKWeb3IpIndex + 1) % len;
      nextIp = web3Ips[currentOKWeb3IpIndex];
      log.debug("nextOKWeb3IpIndex = %s nextIp = %s chainType = %s",
        currentOKWeb3IpIndex, nextIp, chainType);

      let update = await writeWeb3IpToFile(fileName, nextIp);
      if (update) {
        chainWeb3IpOpsDict[chainType].currentOKWeb3IpIndex = currentOKWeb3IpIndex;
      }
    } catch (err) {
      log.error(err);
    }
  }

  return new Promise(async (resolve, reject) => {
    try {
      chain.theWeb3.eth.getBlockNumber((err, result) => {
        if (err) {
          log.error("getBlockNumber " + err + " chainType= " + chainType);

          updateWeb3Ip();
          resolve();
        } else {
          log.debug("getBlockNumber,blockNumber= %s chainType = %s", result, chainType);
          blockNumber = result;

          chain.theWeb3.eth.getBlock(blockNumber, (err, block) => {
            if (err) {
              log.error("getBlockByNumber " + err + " chainType= " + chainType);
              updateWeb3Ip();
              resolve();
            } else {
              log.debug("getLatestBlockTime %s chainType = %s", block.timestamp, chainType);
              blockTimeStamp = block.timestamp;

              timeOutOrNot = false;
              timeOutOrNot = checkTimeout(blockTimeStamp, timeOutOfLastBlock, chainType);
              log.info("timeOutOrNot = %s chainType = %s", timeOutOrNot, chainType);

              if (timeOutOrNot) {
                updateWeb3Ip();
              }
              resolve();
            }
          });
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

function writeWeb3IpToFile(filename, nextIp) {
  return new Promise(async (resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) {
        log.error("writeWeb3IpToFile readFile ", err);
        resolve(false);
      }

      var config = data.toString();
      config = JSON.parse(config);

      var net;
      if (testnet) {
        net = "testnet";
      } else {
        net = "main";
      }

      if(nextIp === undefined) {
        resolve(true);
        return;
      }

      let curIp = config[net].ethWeb3Url;
      config[net].ethWeb3Url = nextIp;

      var str = JSON.stringify(config, null, 2);
      fs.writeFile(filename, str, (err) => {
        if (err) {
          log.error("writeWeb3IpToFile writeFile ", err);
          resolve(false);
        } else {
          log.info("Update done! curIp %s to nextIp %s", curIp, nextIp);
          resolve(true);
        }
      })
    })
  });
};

async function mainLoop() {
  while (1) {
    log.info("Watchdog loop begins...");
    await watchdog('ETH');
    await sleep(syncInterval);
  }
}

mainLoop();
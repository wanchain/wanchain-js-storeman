"use strict"

const Logger = require('comm/logger.js');

const mongoose = require('mongoose');
const ModelOps = require('db/modelOps');
const Erc20CrossAgent = require("agent/Erc20CrossAgent.js");
const StateAction = require("monitor/monitor.js");

const fs = require('fs');
const config = JSON.parse(fs.readFileSync('conf/config.json'));
const moduleConfig = require('conf/moduleConfig.js');

const {
  initChain,
  getGlobalChain,
  // getChain,
  sleep
} = require('comm/lib');

let handlingList = {};

let tokenList = {};

global.syncLogger = new Logger("syncLogger", "log/storemanAgent.log", "log/storemanAgent_error.log", 'debug');
global.monitorLogger = new Logger("monitorLogger", "log/storemanAgent.log", "log/storemanAgent_error.log", 'debug');

function init() {
  initChain('wan');
  tokenList.wanchainHtlcAddr = [];
  tokenList.supportTokenAddrs = [];
  for (let chain in moduleConfig.crossInfoDict) {
    initChain(chain);

    tokenList[chain] = {};

    tokenList[chain].originalChainHtlcAddr = [];
    tokenList[chain].supportTokens = {};

    for (let token in config["crossTokens"][chain]) {
      tokenList.supportTokenAddrs.push(token);
      tokenList[chain].supportTokens[token] = config["crossTokens"][chain][token].tokenSymbol;     
    }

    for (let tokenType in moduleConfig.crossInfoDict[chain]) {
      tokenList[chain][tokenType] = {};

      tokenList[chain][tokenType].wanchainHtlcAddr = moduleConfig.crossInfoDict[chain][tokenType].wanchainHtlcAddr;
      tokenList[chain][tokenType].originalChainHtlcAddr = moduleConfig.crossInfoDict[chain][tokenType].originalChainHtlcAddr;

      tokenList.wanchainHtlcAddr.push(moduleConfig.crossInfoDict[chain][tokenType].wanchainHtlcAddr);
      tokenList[chain].originalChainHtlcAddr.push(moduleConfig.crossInfoDict[chain][tokenType].originalChainHtlcAddr);

      tokenList[chain][tokenType].wanCrossAgent = new Erc20CrossAgent(chain, tokenType, 0);
      tokenList[chain][tokenType].originCrossAgent = new Erc20CrossAgent(chain, tokenType, 1);
    }
  }
  console.log(tokenList);
}

function splitData(string) {
  let index = 64;
  let arr = [];
  for (var i = 2; i < string.length;) {
    arr.push(string.substr(i, index));
    i = i + index;
  }
  return arr;
}

async function getScEvents(logger, chain, scAddr, topics, fromBlk, toBlk) {
  let events;
  let cntPerTime = 50;
  try {
    events = await chain.getScEventSync(scAddr, topics, fromBlk, toBlk);
    // console.log(events);
  } catch (err) {
    logger.error("getScEvents", err);
    return Promise.reject(err);
  }

  let i = 0;
  let end;
  console.log("events length: ", events.length);
  while (i < events.length) {
    // console.log(i);
    if ((i + cntPerTime) > events.length) {
      end = events.length;
    } else {
      end = i + cntPerTime;
    }
    let arr = events.slice(i, end);
    let multiEvents = [...arr].map((event) => {
      return new Promise((resolve, reject) => {
        chain.getBlockByNumber(event.blockNumber, function(err, block) {
          if (err) {
            reject(err);
          } else {
            event.timestamp = block.timestamp;
            resolve();
          }
        });
      });
    });

    try {
      await Promise.all(multiEvents);
    } catch (err) {
      logger.error("getScEvents", err);
      return Promise.reject(err);
    }
    i += cntPerTime;
  }
  return events;
}

async function splitEvent(chainType, events) {
  // let modelOps = modelOps;
  let multiEvents = [...events].map((event) => {
    return new Promise((resolve, reject) => {
      try {
        for (let chain in moduleConfig.crossInfoDict) {
          if (chainType !== 'wan' && chainType !== chain.toLowerCase()) {
            continue;
          } 
          for (let tokenType in moduleConfig.crossInfoDict[chain]) {
            let tokenTypeHandler = tokenList[chain][tokenType];

            let content = {};
            let hashX = '0x';
            let data = [];
            let tokenAddr;
            // console.log(event);
            if ((event.topics[0] === tokenTypeHandler.originCrossAgent.depositLockEvent && chainType !== 'wan') ||
              (event.topics[0] === tokenTypeHandler.wanCrossAgent.withdrawLockEvent && chainType === 'wan')) {
              console.log("********************************** 1: found new wallet lock transaction ********************************** hashX", event.topics[3]);
              hashX = event.topics[3].toLowerCase();
              data = splitData(event.data);
              // console.log(data);
              tokenAddr = (chainType !== 'wan') ? '0x' + data[2].substr(-40, 40) : '0x' + data[3].substr(-40, 40);
              console.log(data);
              content = {
                hashX: event.topics[3].toLowerCase(),
                direction: (chainType !== 'wan') ? 0 : 1,
                crossChain: chain.toLowerCase(),
                tokenType: tokenType,
                tokenAddr: tokenAddr,
                tokenSymbol: config["crossTokens"][chain][tokenAddr].tokenSymbol,
                originChain: chainType,
                from: '0x' + event.topics[1].substr(-40, 40),
                crossAddress: '0x' + data[1].substr(-40, 40),
                toHtlcAddr: event.address.toLowerCase(),
                storeman: '0x' + event.topics[2].substr(-40, 40),
                value: parseInt(data[0], 16),
                // status: (chainType !== 'wan') ? 'waitingCross' : 'checkApprove',
                blockNumber: event.blockNumber,
                timestamp: event.timestamp * 1000,
                suspendTime: (1000 * Number(moduleConfig.lockedTime) + Number(event.timestamp) * 1000).toString(),
                HTLCtime: (1000 * Number(moduleConfig.lockedTime) + Number(event.timestamp) * 1000).toString(),
                walletLockEvent: event
              };
            } else if ((event.topics[0] === tokenTypeHandler.wanCrossAgent.depositLockEvent && chainType === 'wan') ||
              (event.topics[0] === tokenTypeHandler.originCrossAgent.withdrawLockEvent && chainType !== 'wan')) {
              console.log("********************************** 2: found storeman lock transaction ********************************** hashX", event.topics[3]);
              hashX = event.topics[3].toLowerCase();
              content = {
                // status: 'waitingX',
                HTLCtime: (1000 * Number(moduleConfig.lockedTime) + Number(event.timestamp) * 1000).toString(),
                storemanLockTxHash: event.transactionHash.toLowerCase(),
                storemanLockEvent: event
              };
            } else if ((event.topics[0] === tokenTypeHandler.wanCrossAgent.depositRefundEvent && chainType === 'wan') ||
              (event.topics[0] === tokenTypeHandler.originCrossAgent.withdrawRefundEvent && chainType !== 'wan')) {
              console.log("********************************** 3: found wallet refund transaction ********************************** hashX", event.topics[3]);
              hashX = event.topics[3].toLowerCase();
              data = splitData(event.data);
              content = {
                x: '0x' + data[0],
                walletRefundEvent: event,
                // status: 'receivedX',
              };
            } else if ((event.topics[0] === tokenTypeHandler.originCrossAgent.depositRefundEvent && chainType !== 'wan') ||
              (event.topics[0] === tokenTypeHandler.wanCrossAgent.withdrawRefundEvent && chainType === 'wan')) {
              console.log("********************************** 4: found storeman refund transaction ********************************** hashX", event.topics[3]);
              hashX = event.topics[3].toLowerCase();
              content = {
                // status: 'refundFinished',
                storemanRefundTxHash: event.transactionHash.toLowerCase(),
                storemanRefundEvent: event
              };
            } else if ((event.topics[0] === tokenTypeHandler.originCrossAgent.depositRevokeEvent && chainType !== 'wan') ||
              (event.topics[0] === tokenTypeHandler.wanCrossAgent.withdrawRevokeEvent && chainType === 'wan')) {
              console.log("********************************** 5: found wallet revoke transaction ********************************** hashX", event.topics[3]);
              hashX = event.topics[2].toLowerCase();
              content = {
                walletRevokeEvent: event,
                // status: 'waitingRevoke',
              };
            } else if ((event.topics[0] === tokenTypeHandler.wanCrossAgent.depositRevokeEvent && chainType === 'wan') ||
              (event.topics[0] === tokenTypeHandler.originCrossAgent.withdrawRevokeEvent && chainType !== 'wan')) {
              console.log("********************************** 6: found storeman revoke transaction ********************************** hashX", event.topics[3]);
              hashX = event.topics[2].toLowerCase();
              content = {
                // status: 'revokeFinished',
                storemanRevokeTxHash: event.transactionHash.toLowerCase(),
                storemanRevokeEvent: event
              };
            }
            if (hashX !== '0x') {
              try {
                modelOps.saveScannedEvent(hashX, content);
              } catch (err) {
                console.log("********************************** saveScannedEvent faild, try another time **********************************", err);
                modelOps.saveScannedEvent(hashX, content);
              }

            }
          }
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });

  try {
    await Promise.all(multiEvents);
    console.log("********************************** splitEvent done **********************************");
  } catch (err) {
    global.syncLogger.error("splitEvent", err);
    return Promise.reject(err);
  }
}

async function syncChain(chainType, scAddr, logger, db) {
  console.log("********************************** syncChain **********************************", chainType);
  let blockNumber = 0;
    try {
      blockNumber = await modelOps.getScannedBlockNumberSync(chainType);
      if (blockNumber > moduleConfig.SAFE_BLOCK_NUM) {
        blockNumber -= moduleConfig.SAFE_BLOCK_NUM;
      } else {
        console.log("++++++++++++++++++++++++++++++++++++++=", blockNumber);
        blockNumber = moduleConfig.startSyncBlockNum[chainType.toUpperCase()];
      }
      logger.info("Current blockNumber in db is:", blockNumber, chainType);
    } catch (err) {
      logger.error(err);
      return;
    }

    let chain = getGlobalChain(chainType);
    let from = blockNumber;
    let curBlock = 0;
    let topics = [];
    let events;
    
    try {
      curBlock = await chain.getBlockNumberSync();
      logger.info("Current block is:", curBlock, chainType);
    } catch (err) {
      logger.error("getBlockNumberSync from :", chainType, err);
      return;
    }
    if (curBlock > moduleConfig.CONFIRM_BLOCK_NUM) {
      let to = curBlock - moduleConfig.CONFIRM_BLOCK_NUM;
      try {
        events = await getScEvents(logger, chain, scAddr, topics, from, to);
        console.log("events: ", events.length);
        await splitEvent(chainType, events);
        modelOps.saveScannedBlockNumber(chainType, to);
        console.log("********************************** saveState **********************************", chainType);
      } catch (err) {
        logger.error("getScEvents from :", chainType, err);
        return;
      }
    }

}

async function syncMain(logger, db) {
  let ethBlockNumber, wanBlockNumber;

  while (1) {
    try {
      for (let chain in moduleConfig.crossInfoDict) {
        syncChain(chain.toLowerCase(), tokenList[chain].originalChainHtlcAddr, logger, db);
      }

      syncChain('wan', tokenList.wanchainHtlcAddr, logger, db);
    } catch (err) {
      logger.error("syncMain failed:", err);
      await sleep(moduleConfig.INTERVAL_TIME);
      continue;
    }

    await sleep(moduleConfig.INTERVAL_TIME);
  }
}

function monitorRecord(record) {
  let stateAction = new StateAction(record, global.monitorLogger, db);
  stateAction.takeAction()
    .then(result => {
      if (handlingList[record.hashX]) {
        console.log("handlingList delete already handled hashX", record.hashX);
        delete handlingList[record.hashX];
      }
    })
    .catch(err => global.monitorLogger.error(err));
}

async function handlerMain(logger, db) {
  while (1) {
    console.log("********************************** handlerMain start **********************************");

    try {
      let option = {
        // hashX : "0x5509ebd015bf950152d6f5a1b798134ee5b077f88c59e69227a44a0dd8dee949",
        tokenAddr: {
          $in: [...tokenList.supportTokenAddrs]
        },
        storeman: {
          $in: [config.storemanEth, config.storemanWan]
        },
        status: {
          $nin: ['refundFinished', 'revokeFinished', 'transIgnored', 'waitingIntervention', 'interventionPending']
        }
      }
      let history = await modelOps.getEventHistory(option);
      logger.debug('history length is ', history.length);
      logger.debug('handlingList length is ', Object.keys(handlingList).length);

      for (let i = 0; i < history.length; i++) {
        let record = history[i];

        let cur = Date.now();
        if (handlingList[record.hashX]) {
          continue;
        }
        handlingList[record.hashX] = cur;

        try {
          monitorRecord(record);
        } catch (error) {
          logger.error("monitorRecord error:", error);
        }
      }
    } catch (err) {
      logger.error("handlerMain error:", error);
    }
    await sleep(moduleConfig.INTERVAL_TIME);
  }
}

// let logger = new Logger("storemanAgent", "log/storemanAgent.log", "log/storemanAgent_error.log", level = 'info');
let db = mongoose.createConnection(moduleConfig.crossEthDbUrl, {
  useNewUrlParser: true
});
db.on('connected', function(err) {
  if (err) {
    global.syncLogger.error('Unable to connect to database(' + dbUrl + ')：' + err);
    global.syncLogger.error('Aborting');
    process.exit();
  } else {
    global.syncLogger.info('Connecting to database is successful!');
  }
});

let modelOps = new ModelOps(global.syncLogger, db);

init();
syncMain(global.syncLogger, db);
handlerMain(global.monitorLogger, db);
"use strict"

const Web3 = require("web3");
const Logger = require('comm/logger.js');
const EthChain = require('chain/eth');
const WanChain = require('chain/wan');
const config = require('conf/config');
const mongoose = require('mongoose');
const ModelOps = require('db/modelOps');
let Erc20CrossAgent = require("agent/Erc20CrossAgent.js");

const {
  sleep
} = require('comm/lib');

global.crossToken = 'WCT';
global.lastEthNonce = 0;
global.lastWanNonce = 0;
global.wanGasPrice = 180;
global.wanGasLimit = 1000000;
global.ethGasLimit = 1000000;
global.password = process.env.KEYSTORE_PWD;

let wanCrossContract = new Erc20CrossAgent(crossToken, 0);
let origenCrossContract = new Erc20CrossAgent(crossToken, 1);

function getChain(chainType) {
  let chain = chainType.toLowerCase();
  if (chain === 'eth') {
    return new EthChain(syncLogger, new Web3(new Web3.providers.HttpProvider(config.ethWeb3Url)));
  }
  else if (chain === 'wan') {
    return new WanChain(syncLogger, new Web3(new Web3.providers.HttpProvider(config.wanWeb3Url)));
  } else {
    return null;
  }
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
    console.log(i);
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
        let content = {};
        let hashX = '0x';
        let data = [];
        // console.log(event);
        if ((event.topics[0] === origenCrossContract.depositLockEvent && chainType === 'eth') ||
          (event.topics[0] === destCrossContract.withdrawLockEvent && chainType === 'wan')) {
          console.log("********************************** 1: found new transaction ********************************** hashX", event.topics[3]);
          hashX = event.topics[3].toLowerCase();
          data = splitData(event.data);
          content = {
            hashX: event.topics[3].toLowerCase(),
            direction: (chainType !== 'wan') ? 0 : 1,
            originChain: chainType,
            tokenSymbol: origenCrossContract.tokenSymbol,
            tokenAddr: origenCrossContract.tokenAddr.toLowerCase(),
            from: '0x' + event.topics[1].substr(-40, 40),
            toHtlcAddr: event.address.toLowerCase(),
            storeman: '0x' + event.topics[2].substr(-40, 40),
            value: parseInt(data[1], 16),
            crossAddress: '0x' + data[2].substr(-40, 40),
            status: (chainType !== 'wan') ? 'waitingCross' : 'waitingApprove',
            blockNumber: event.blockNumber,
            timestamp: event.timestamp * 1000,
            suspendTime: (1000 * Number(global.lockedTime) + Number(event.timestamp) * 1000).toString(),
            HTLCtime: (100000 + 2 * 1000 * Number(global.lockedTime) + Number(event.timestamp) * 1000).toString(),
            walletLockEvent: event
          };
        } else if ((event.topics[0] === destCrossContract.depositLockEvent && chainType === 'wan') ||
          (event.topics[0] === origenCrossContract.withdrawLockEvent && chainType === 'eth')) {
          console.log("********************************** 2: found storeman lock transaction ********************************** hashX", event.topics[3]);
          hashX = event.topics[3].toLowerCase();
          content = {
            // status: 'waitingX',
            storemanLockTxHash: event.transactionHash.toLowerCase(),
            storemanLockEvent: event
          };
        } else if ((event.topics[0] === destCrossContract.depositRefundEvent && chainType === 'wan') ||
          (event.topics[0] === origenCrossContract.withdrawRefundEvent && chainType === 'eth')) {
          console.log("********************************** 3: found wallet refund transaction ********************************** hashX", event.topics[3]);
          hashX = event.topics[3].toLowerCase();
          data = splitData(event.data);
          content = {
            x: '0x' + data[1],
            walletRefundEvent: event,
            // status: 'receivedX',
          };
        } else if ((event.topics[0] === origenCrossContract.depositRefundEvent && chainType === 'eth') ||
          (event.topics[0] === destCrossContract.withdrawRefundEvent && chainType === 'wan')) {
          console.log("********************************** 4: found storeman refund transaction ********************************** hashX", event.topics[3]);
          hashX = event.topics[3].toLowerCase();
          content = {
            // status: 'refundFinished',
            storemanRefundTxHash: event.transactionHash.toLowerCase(),
            storemanRefundEvent: event
          };
        } else if ((event.topics[0] === origenCrossContract.depositRevokeEvent && chainType === 'eth') ||
          (event.topics[0] === destCrossContract.withdrawRevokeEvent && chainType === 'wan')) {
          console.log("********************************** 5: found wallet revoke transaction ********************************** hashX", event.topics[3]);
          hashX = event.topics[3].toLowerCase();
          content = {
            walletRevokeEvent: event,
            // status: 'waitingRevoke',
          };
        } else if ((event.topics[0] === destCrossContract.depositRevokeEvent && chainType === 'wan') ||
          (event.topics[0] === origenCrossContract.withdrawRevokeEvent && chainType === 'eth')) {
          console.log("********************************** 6: found storeman revoke transaction ********************************** hashX", event.topics[3]);
          hashX = event.topics[3].toLowerCase();
          content = {
            // status: 'revokeFinished',
            storemanRevokeTxHash: event.transactionHash.toLowerCase(),
            storemanRevokeEvent: event
          };
        }
        if (hashX !== '0x') {
          modelOps.saveScannedEvent(hashX, content);
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
    syncLogger.error("splitEvent", err);
    return Promise.reject(err);
  }
}

async function syncMain(logger, db) {
  // let modelOps = new ModelOps(logger, db);
  let ethBlockNumber, wanBlockNumber;


  while (1) {
    let topics = [];
    let events;

    try {
      ethBlockNumber = await modelOps.getScannedBlockNumberSync('eth');
      if (ethBlockNumber > SAFE_BLOCK_NUM) {
        ethBlockNumber -= SAFE_BLOCK_NUM;
      } else {
        ethBlockNumber = 0;
      }

      wanBlockNumber = await modelOps.getScannedBlockNumberSync('wan');
      if (wanBlockNumber > SAFE_BLOCK_NUM) {
        wanBlockNumber -= SAFE_BLOCK_NUM;
      } else {
        wanBlockNumber = 0;
      }
    } catch (err) {
      logger.error(err);
      continue;
    }
    let chainType = 'eth';
    let chain = getChain(chainType);
    let from = ethBlockNumber;
    let scAddr = origenCrossContract.contractAddr;
    let curBlock;

    try {
      curBlock = await chain.getBlockNumberSync();
      logger.info("Current block is:", curBlock);
    } catch (err) {
      logger.error("getBlockNumberSync from ethereum:", err);
    }

    if (curBlock > CONFIRM_BLOCK_NUM) {
      let to = curBlock - CONFIRM_BLOCK_NUM;
      try {
        events = await getScEvents(logger, chain, scAddr, topics, from, to);
        console.log("events: ", events.length);
        await splitEvent('eth', events);
        console.log("********************************** saveEthState **********************************");
        modelOps.saveScannedBlockNumber(chainType, to);
      } catch (err) {
        logger.error("getScEvents from ethereum:", err);
      }
    }

    chainType = 'wan';
    chain = getChain(chainType);
    from = wanBlockNumber;
    scAddr = destCrossContract.contractAddr;

    try {
      curBlock = await chain.getBlockNumberSync();
    } catch (err) {
      logger.error("getBlockNumberSync from wanchain:", err);
    }
    if (curBlock > CONFIRM_BLOCK_NUM) {
      let to = curBlock - CONFIRM_BLOCK_NUM;
      try {
        events = await getScEvents(logger, chain, scAddr, topics, from, to);
        console.log("events: ", events.length);
        await splitEvent('wan', events);
        modelOps.saveScannedBlockNumber(chainType, to);
        console.log("********************************** saveWanState **********************************");
      } catch (err) {
        logger.error("getScEvents from wanchain:", err);
      }
    }

    await sleep(INTERVAL_TIME);
  }
}


let logger = new Logger("storemanAgent", "log/storemanAgent.log", "log/storemanAgent_error.log", level = 'info');
db = mongoose.createConnection(config.crossEthDbUrl, { useNewUrlParser: true });
db.on('connected', function(err) {
  if (err) {
    syncLogger.error('Unable to connect to database(' + dbUrl + ')：' + err);
    syncLogger.error('Aborting');
    process.exit();
  } else {
    syncLogger.info('Connecting to database is successful!');
  }
});
modelOps = new ModelOps(syncLogger, db);

global.ethChain = getChain('eth');
global.wanChain = getChain('wan');
global.syncLogger = new Logger("storemanAgent", "log/storemanAgent.log", "log/storemanAgent_error.log", level = 'debug');
global.monitorLogger = new Logger("storemanAgent", "log/storemanAgent.log", "log/storemanAgent_error.log", level = 'debug');

syncMain(syncLogger, db);
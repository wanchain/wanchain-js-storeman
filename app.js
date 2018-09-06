"use strict"

const Web3 = require("web3");
const Logger = require('comm/logger.js');
const EthChain = require('chain/eth');
const WanChain = require('chain/wan');
const config = require('conf/config');
const mongoose = require('mongoose');
const ModelOps = require('db/modelOps');
let Erc20CrossAgent = require("agent/Erc20CrossAgent.js");
const StateAction = require("monitor/monitor.js");

const {
  sleep
} = require('comm/lib');

const SAFE_BLOCK_NUM = 5;
const CONFIRM_BLOCK_NUM = 2;
const INTERVAL_TIME = 15 * 1000;

global.crossToken = 'WCT';
global.lastEthNonce = 0;
global.lastWanNonce = 0;
global.wanGasPrice = 180;
global.wanGasLimit = 1000000;
global.ethGasLimit = 100000;
global.lockedTime = 3600;
global.password = process.env.KEYSTORE_PWD;

let wanCrossContract = new Erc20CrossAgent(global.crossToken, 0);
let originCrossContract = new Erc20CrossAgent(global.crossToken, 1);
console.log(wanCrossContract.contractAddr);
console.log(wanCrossContract.transChainType);
console.log(originCrossContract.contractAddr);
console.log(originCrossContract.transChainType);

global.storemanEth = "0xc27ecd85faa4ae80bf5e28daf91b605db7be1ba8";
global.storemanWan = "0x55ccc7a38f900a1e00f0a4c1e466ec36e7592024";

global.syncLogger = new Logger("syncLogger", "log/storemanAgent.log", "log/storemanAgent_error.log", 'debug');
global.monitorLogger = new Logger("monitorLogger", "log/storemanAgent.log", "log/storemanAgent_error.log", 'debug');

function getChain(chainType) {
  let chain = chainType.toLowerCase();
  if (chain === 'eth') {
    return new EthChain(global.syncLogger, new Web3(new Web3.providers.HttpProvider(config.ethWeb3Url)));
  } else if (chain === 'wan') {
    return new WanChain(global.syncLogger, new Web3(new Web3.providers.HttpProvider(config.wanWeb3Url)));
  } else {
    return null;
  }
}

async function init() {
  global.ethGasPrice = await global.ethChain.getGasPriceSync();
  global.ethNonce = await global.ethChain.getNonceSync(global.storemanEth);
  global.wanNonce = await global.wanChain.getNonceSync(global.storemanWan);
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
        let content = {};
        let hashX = '0x';
        let data = [];
        // console.log(event);
        if ((event.topics[0] === originCrossContract.depositLockEvent && chainType === 'eth') ||
          (event.topics[0] === wanCrossContract.withdrawLockEvent && chainType === 'wan')) {
          console.log("********************************** 1: found new transaction ********************************** hashX", event.topics[3]);
          hashX = event.topics[3].toLowerCase();
          data = splitData(event.data);
          console.log(data);
          content = {
            hashX: event.topics[3].toLowerCase(),
            direction: (chainType !== 'wan') ? 0 : 1,
            originChain: chainType,
            tokenSymbol: originCrossContract.tokenSymbol,
            tokenAddr: originCrossContract.tokenAddr.toLowerCase(),
            from: '0x' + event.topics[1].substr(-40, 40),
            toHtlcAddr: event.address.toLowerCase(),
            storeman: '0x' + event.topics[2].substr(-40, 40),
            value: parseInt(data[1], 16),
            crossAddress: '0x' + data[2].substr(-40, 40),
            // status: (chainType !== 'wan') ? 'waitingCross' : 'checkApprove',
            blockNumber: event.blockNumber,
            timestamp: event.timestamp * 1000,
            suspendTime: (1000 * Number(global.lockedTime) + Number(event.timestamp) * 1000).toString(),
            HTLCtime: (1000 * Number(global.lockedTime) + Number(event.timestamp) * 1000).toString(),
            walletLockEvent: event
          };
        } else if ((event.topics[0] === wanCrossContract.depositLockEvent && chainType === 'wan') ||
          (event.topics[0] === originCrossContract.withdrawLockEvent && chainType === 'eth')) {
          console.log("********************************** 2: found storeman lock transaction ********************************** hashX", event.topics[3]);
          hashX = event.topics[3].toLowerCase();
          content = {
            // status: 'waitingX',
            HTLCtime: (1000 * Number(global.lockedTime) + Number(event.timestamp) * 1000).toString(),
            storemanLockTxHash: event.transactionHash.toLowerCase(),
            storemanLockEvent: event
          };
        } else if ((event.topics[0] === wanCrossContract.depositRefundEvent && chainType === 'wan') ||
          (event.topics[0] === originCrossContract.withdrawRefundEvent && chainType === 'eth')) {
          console.log("********************************** 3: found wallet refund transaction ********************************** hashX", event.topics[3]);
          hashX = event.topics[3].toLowerCase();
          data = splitData(event.data);
          content = {
            x: '0x' + data[1],
            walletRefundEvent: event,
            // status: 'receivedX',
          };
        } else if ((event.topics[0] === originCrossContract.depositRefundEvent && chainType === 'eth') ||
          (event.topics[0] === wanCrossContract.withdrawRefundEvent && chainType === 'wan')) {
          console.log("********************************** 4: found storeman refund transaction ********************************** hashX", event.topics[3]);
          hashX = event.topics[3].toLowerCase();
          content = {
            // status: 'refundFinished',
            storemanRefundTxHash: event.transactionHash.toLowerCase(),
            storemanRefundEvent: event
          };
        } else if ((event.topics[0] === originCrossContract.depositRevokeEvent && chainType === 'eth') ||
          (event.topics[0] === wanCrossContract.withdrawRevokeEvent && chainType === 'wan')) {
          console.log("********************************** 5: found wallet revoke transaction ********************************** hashX", event.topics[3]);
          hashX = event.topics[3].toLowerCase();
          content = {
            walletRevokeEvent: event,
            // status: 'waitingRevoke',
          };
        } else if ((event.topics[0] === wanCrossContract.depositRevokeEvent && chainType === 'wan') ||
          (event.topics[0] === originCrossContract.withdrawRevokeEvent && chainType === 'eth')) {
          console.log("********************************** 6: found storeman revoke transaction ********************************** hashX", event.topics[3]);
          hashX = event.topics[3].toLowerCase();
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
    let scAddr = originCrossContract.contractAddr;
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
    scAddr = wanCrossContract.contractAddr;

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

function monitorRecord(record) {
  let stateAction = new StateAction(record, global.monitorLogger, db);
  stateAction.takeAction().catch(err => global.monitorLogger.error(err));

}

async function handlerMain(logger, db) {
  // let modelOps = new ModelOps(logger, db);
  await init();
  while (1) {
    // await sleep(INTERVAL_TIME);

    console.log("********************************** handlerMain start **********************************");
    let option = {
      hashX : "0xafa04cc3796c4109e5a8d974f0326ee961ea13a8994e49695e7624060269b4ff",
      tokenAddr: config.crossTokenDict[global.crossToken].tokenAddr,
      storeman: {
        $in: [global.storemanEth, global.storemanWan]
      },
      status: {
        $nin: ['refundFinished', 'revokeFinished', '1transIgnored', 'interventionPending']
      }
    }
    let history = await modelOps.getEventHistory(option);
    logger.debug('history length is ', history.length);

    for (let i = 0; i < history.length; i++) {
      let record = history[i];
      try {
        monitorRecord(record);
      } catch (error) {
        logger.error("monitorRecord error:", error);
      }
    }

    await sleep(INTERVAL_TIME);
  }
}

// let logger = new Logger("storemanAgent", "log/storemanAgent.log", "log/storemanAgent_error.log", level = 'info');
let db = mongoose.createConnection(config.crossEthDbUrl, {
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

global.ethChain = getChain('eth');
global.wanChain = getChain('wan');

syncMain(global.syncLogger, db);
handlerMain(global.monitorLogger, db);
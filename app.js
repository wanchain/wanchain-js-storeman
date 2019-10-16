"use strict"

const optimist = require('optimist');

let argv = optimist
  .usage("Usage: $0  -i [index] -pk [PK] -ip [mpcIP] -port [mpcPort] -c [chainType] -w [storemanWanAddr] -o [storemanOriAddr] [--testnet] [--dev] [--leader] [--init] [--renew]")
  .alias('h', 'help')
  .alias('i', 'index')
  .describe('h', 'display the usage')
  .describe('i', 'identify storemanAgent index')
  .describe('pk', 'identify storemanGroup public key')
  .describe('ip', 'identify mpc ip')
  .describe('port', 'identify mpc port')
  .describe('c', 'identify chainType')
  .describe('w', 'identify storemanWanAddr')
  .describe('o', 'identify storemanOriAddr')
  .describe('testnet', 'identify whether using testnet or not, if no "--testnet", using mainnet as default')
  .describe('dev', 'identify whether production env or development env, if no "--dev", production env as default')
  .describe('leader', 'identify whether is leader agent, only leader can send the transaction')
  .describe('init', 'identify whether to init after startup')
  .describe('renew', 'identify whether to renew the storemanAgent in cycle')
  .default('i', 0)
  .string('pk')
  .string('ip')
  .string('c')
  .string('w')
  .string('o')
  .boolean('testnet', 'dev', 'leader', 'init', 'renew')
  .argv;

if (argv.help) {
  optimist.showHelp();
  process.exit(0);
}

global.argv = argv;

global.pk = argv.pk;
global.testnet = argv.testnet ? true : false;
global.dev = argv.dev ? true : false;
global.isLeader = argv.leader ? true : false;

const Logger = require('comm/logger.js');

const mongoose = require('mongoose');
const ModelOps = require('db/modelOps');
// const TokenCrossAgent = require("agent/Erc20CrossAgent.js");
// const EthCrossAgent = require("agent/EthCrossAgent.js");
// const EosCrossAgent = require("agent/EosCrossAgent.js");

const EthAgent = require("agent/EthAgent.js");
const EosAgent = require("agent/EosAgent.js");
const WanAgent = require("agent/WanAgent.js");
const StateAction = require("monitor/monitor.js");


const {
  loadConfig,
  initChain,
  initConfig,
  initNonce,
  getGlobalChain,
  backupIssueFile,
  sleep
} = require('comm/lib');
const moduleConfig = require('conf/moduleConfig.js');
const config = loadConfig();

let handlingList = {};

let tokenList = {};

global.storemanRestart = false;

global.agentDict = {
  // ETH: {
  //   COIN: EthCrossAgent,
  //   Token: TokenCrossAgent
  // },
  ETH: EthAgent,
  EOS: EosAgent,
  WAN: WanAgent
}

global.syncLogger = new Logger("syncLogger", "log/storemanAgent.log", "log/storemanAgent_error.log", 'debug');
global.monitorLogger = new Logger("storemanAgent", "log/storemanAgent.log", "log/storemanAgent_error.log", 'debug');

async function init() {
  try {
    initChain('WAN');
    await initNonce('WAN');
 
    global.storemanRestart = true;
    backupIssueFile(config.issueCollectionPath);

    tokenList.supportTokenAddrs = [];
    tokenList.wanchainHtlcAddr = [];
    tokenList.originalChainHtlcAddr = [];
    tokenList.storemanWan = config.storemanWan;
    tokenList.storemanAddress = [config.storemanWan];

    for (let crossChain in config.crossTokens) {
      initChain(crossChain);
      await initNonce(crossChain);

      tokenList[crossChain] = {};
      tokenList[crossChain].storemanOri = config.crossTokens[crossChain].CONF.storemanOri;
      tokenList.storemanAddress.push(tokenList[crossChain].storemanOri);
      tokenList[crossChain].supportTokens = {};

      for (let token in config["crossTokens"][crossChain]["TOKEN"]) {
        tokenList.supportTokenAddrs.push(token);
        tokenList[crossChain].supportTokens[token] = config["crossTokens"][crossChain]["TOKEN"][token].tokenSymbol;
      }

      for (let tokenType in moduleConfig.crossInfoDict[crossChain]) {
        if (tokenType === 'CONF') {
          continue;
        }
        tokenList[crossChain][tokenType] = {};

        tokenList[crossChain][tokenType].wanchainHtlcAddr = moduleConfig.crossInfoDict[crossChain][tokenType].wanchainHtlcAddr;
        tokenList[crossChain][tokenType].originalChainHtlcAddr = moduleConfig.crossInfoDict[crossChain][tokenType].originalChainHtlcAddr;

        tokenList.wanchainHtlcAddr.push(moduleConfig.crossInfoDict[crossChain][tokenType].wanchainHtlcAddr);
        tokenList.originalChainHtlcAddr.push(moduleConfig.crossInfoDict[crossChain][tokenType].originalChainHtlcAddr);

        tokenList[crossChain][tokenType].wanCrossAgent = new global.agentDict['WAN'](crossChain, tokenType);
        tokenList[crossChain][tokenType].originCrossAgent = new global.agentDict[crossChain](crossChain, tokenType);
        tokenList[crossChain][tokenType].lockedTime = await tokenList[crossChain][tokenType].wanCrossAgent.getLockedTime();
      }
    }
    monitorLogger.info(tokenList);

    for (let crossChain in moduleConfig.crossInfoDict) {
      if (!moduleConfig.crossInfoDict[crossChain].CONF.nonceless) {
        syncLogger.debug("Nonce of chain:", crossChain, global[crossChain.toLowerCase() + 'LastNonce']);
      }
    }
    syncLogger.debug("Nonce of chain:", 'WAN', global['wanLastNonce']);
  } catch (err) {
    console.log("init error ", err);
    process.exit();
  }
}

async function update() {
  let storemanWan = config.storemanWan;
  let storemanOri;
  for (let crossChain in config.crossTokens) {
    try {
      // if (Object.keys(config["crossTokens"][crossChain].TOKEN).length === 0) {
      //   continue;
      // }
      if (config["crossTokens"][crossChain].CONF.storemanOri) {
        storemanOri = config["crossTokens"][crossChain].CONF.storemanOri;
        let crossTokens = await initConfig(crossChain, storemanWan, storemanOri);
        if (crossTokens === null) {
          console.log("Couldn't find any tokens that the storeman is in charge of. ", crossChain, storemanWan, storemanOri);
        }
        console.log(crossTokens);
      } else {
        console.log("Storeman agent should be initialized with storemanWanAddr storemanOriAddr at the first time!");
      }
    } catch (err) {
      console.log("Storeman agent update error, plz check the config and try again.", err);
    }
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
    events = await chain.getScEventSync(scAddr, topics, fromBlk, toBlk, moduleConfig.web3RetryTimes);
  } catch (err) {
    logger.error("getScEvents", err);
    return Promise.reject(err);
  }

  let i = 0;
  let end;
  logger.info("events length: ", events.length);
  while (i < events.length) {
    if ((i + cntPerTime) > events.length) {
      end = events.length;
    } else {
      end = i + cntPerTime;
    }
    let arr = events.slice(i, end);
    let multiEvents = [...arr].map((event) => {
      return new Promise((resolve, reject) => {
        if(event === null) {
          logger.debug("event is null")
          resolve();
        }
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

async function splitEvent(chainType, crossChain, tokenType, events) {
  let multiEvents = [...events].map((event) => {
    return new Promise(async (resolve, reject) => {
      try {
        let tokenTypeHandler = tokenList[crossChain][tokenType];
        let lockedTime = tokenList[crossChain][tokenType].lockedTime; 
        let crossAgent;
        if (chainType === 'WAN') {
          crossAgent = tokenTypeHandler.wanCrossAgent;
        } else {
          crossAgent = tokenTypeHandler.originCrossAgent;
        }

        let decodeEvent;
        if (crossAgent.contract) {
          decodeEvent = crossAgent.contract.parseEvent(event);
        } else {
          decodeEvent = event;
        }
        console.log("aaron debug here decodeEvent", decodeEvent.args);
        let content;
        if (decodeEvent === null) {
          resolve();
          return;
        } else {
          content = crossAgent.getDecodeEventDbData(chainType, crossChain, tokenType, decodeEvent, event, lockedTime);
        }

        console.log("aaron debug here content", content);

        if (content !== null) {
          if(content[1].hasOwnProperty("walletRevokeEvent")) {
            let option = {
              hashX : content[0]
            };
            let result = await modelOps.getEventHistory(option);
            if (result.length === 0) {
              resolve();
              return;
            }
          }
          modelOps.saveScannedEvent(...content);
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });

  try {
    await Promise.all(multiEvents);
    syncLogger.debug("********************************** splitEvent done **********************************");
  } catch (err) {
    global.syncLogger.error("splitEvent", err);
    return Promise.reject(err);
  }
}

async function syncChain(chainType, crossChain, tokenType, scAddr, logger, db) {
  logger.debug("********************************** syncChain **********************************", chainType, crossChain, tokenType);

  let blockNumber = 0;
  let chain = getGlobalChain(chainType);
  try {
    blockNumber = await modelOps.getScannedBlockNumberSync(chainType);
    if (blockNumber > chain.safe_block_num) {
      blockNumber -= chain.safe_block_num;
    } else {
      blockNumber = moduleConfig.startSyncBlockNum[chainType];
    }
    logger.info("Current blockNumber in db is:", blockNumber, chainType);
  } catch (err) {
    logger.error(err);
    return;
  }

  let from = blockNumber;
  let curBlock = 0;
  let topics = [];
  let events = [];

  try {
    curBlock = await chain.getBlockNumberSync();
    logger.info("Current block is:", curBlock, chainType);
  } catch (err) {
    logger.error("getBlockNumberSync from :", chainType, err);
    return;
  }
  if (curBlock > chain.confirm_block_num) {
    let to = curBlock - chain.confirm_block_num;
    try {
      if (from <= to) {
        events = await getScEvents(logger, chain, scAddr, topics, from, to);
      }
      logger.info("events: ", chainType, events.length);
      if (events.length > 0) {
        await splitEvent(chainType, crossChain, tokenType, events);
      }
      modelOps.saveScannedBlockNumber(chainType, to);
      logger.info("********************************** saveState **********************************", chainType, crossChain, tokenType);
    } catch (err) {
      logger.error("getScEvents from :", chainType, err);
      return;
    }
  }
}

async function syncMain(logger, db) {

  while (1) {
    try {
      for (let crossChain in moduleConfig.crossInfoDict) {
        for (let tokenType in moduleConfig.crossInfoDict[crossChain]) {
          if (tokenType === 'CONF') {
            continue;
          }
          if (moduleConfig.crossInfoDict[crossChain].CONF.enable) {
            syncChain(crossChain, crossChain, tokenType, tokenList[crossChain][tokenType].originalChainHtlcAddr, logger, db);
            syncChain('WAN', crossChain, tokenType, tokenList[crossChain][tokenType].wanchainHtlcAddr, logger, db);
          }
        }
      }
    } catch (err) {
      logger.error("syncMain failed:", err);
    }

    await sleep(moduleConfig.INTERVAL_TIME);
  }
}

/* When storeman restart, change all waitingIntervention state to interventionPending, to auto retry the test*/
async function updateRecordAfterRestart(logger) {
  let option = {
    status: {
      $in: ['waitingIntervention']
    }
  }
  let changeList = await modelOps.getEventHistory(option);
  let content = {
    status: 'interventionPending'
  }
  logger.debug('changeList length is ', changeList.length);
  for (let i = 0; i < changeList.length; i++) {
    let record = changeList[i];
    await modelOps.syncSave(record.hashX, content);
  }
  logger.debug('updateRecordAfterRestart finished!');
}

function monitorRecord(record) {
  let stateAction = new StateAction(record, global.monitorLogger, db);
  stateAction.takeAction()
    .then(result => {
      if (handlingList[record.hashX]) {
        monitorLogger.debug("handlingList delete already handled hashX", record.hashX);
        delete handlingList[record.hashX];
      }
    })
    .catch(err => global.monitorLogger.error(err));
}

async function handlerMain(logger, db) {
  while (1) {
    logger.info("********************************** handlerMain start **********************************");

    try {
      let htlcAddrFilter = tokenList.wanchainHtlcAddr.concat(tokenList.originalChainHtlcAddr);
      let option = {
        tokenAddr: {
          $in: [...tokenList.supportTokenAddrs]
        },
        toHtlcAddr: {
          $in: [...htlcAddrFilter]
        },
        // hashX: {
        //   $in: ['0x9f2d25cbc77f4d3bf42b4949f9c2485e68611586d72c7a85c281b3483c295207']
        // },
        storeman: {
          $in: tokenList.storemanAddress
        }
      }
      if (global.storemanRestart) {
        option.status = {
          $nin: ['redeemFinished', 'revokeFinished', 'transIgnored1', 'fundLostFinished']
        }
        global.storemanRestart = false;
      } else {
        option.status = {
          $nin: ['redeemFinished', 'revokeFinished', 'transIgnored', 'fundLostFinished', 'interventionPending']
        }
      }
      console.log("aaron debug here handlerMain option", option);
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

let db = mongoose.createConnection(moduleConfig.crossDbUrl, {
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

async function main() {
  if (global.argv.init && global.argv.c && global.argv.w && global.argv.o) {
    await initConfig(global.argv.c, global.argv.w, global.argv.o);
  }

  global.syncLogger.info("start storeman agent");
  if (Object.keys(config["crossTokens"]).length === 0) {
    global.syncLogger.error("./init.sh storemanWanAddr storemanOriAddr");
    global.syncLogger.error("To start storeman agent at the first time, you need to run init.sh with storemanWanAddr storemanOriAddr as paras!");
    process.exit();
  }
  await init();

  syncMain(global.syncLogger, db);
  // await updateRecordAfterRestart(global.monitorLogger);
  // handlerMain(global.monitorLogger, db);
}

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error.message);
});


main();
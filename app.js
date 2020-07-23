"use strict"

const optimist = require('optimist');
const CronJob = require("cron").CronJob;


let argv = optimist
  .usage("Usage: $0  -i [index] -pk [PK] -mpcip [mpcIP] -mpcport [mpcPort] -mpcipc [mpcIpc] -dbip [dbIp] -dbport [dbPort] -dbuser [dbUser] -c [chainType] -w [storemanWanAddr] -o [storemanOriAddr] \
  [--testnet] [--replica] [--dev] [--leader] [--init] [--renew] -period [period] \
  [--mpc] [--schnorr] [--keosd] -k [keosdUrl] --wallet [wallet] --password [password] --keystore [keystore] \
  [--doDebt] --chain [chain] --token [token] --debtor [debtor] --debt [debt] \
  [--withdraw] [--metric] --[grpInfo] --chain [chain] --token [token] --wanReceiver [wanReceiver] --oriReceiver [oriReceiver]\
  --oriurl [oriurl] --oribpurl [oribpurl] --wanurl [wanurl]\
  --loglevel [loglevel] -wa [workingAddr]\
   ")
  .alias('h', 'help')
  .alias('i', 'index')
  .alias('mpcip', 'mpcIP')
  .alias('mpcport', 'mpcPort')
  .alias('dbip', 'dbIp')
  .alias('dbport', 'dbPort')
  .alias('c', 'chainType')
  .alias('w', 'storemanWanAddr')
  .alias('o', 'storemanOriAddr')
  .alias('k', 'keosdUrl')
  .describe('h', 'display the usage')
  .describe('i', 'identify storemanAgent index')
  .describe('pk', 'identify storemanGroup public key')
  .describe('mpcip', 'identify mpc ip')
  .describe('mpcPort', 'identify mpc port')
  .describe('mpcipc', 'identify mpc ipc')
  .describe('dbip', 'identify db ip')
  .describe('dbport', 'identify db port')
  .describe('dbuser', 'identify db user')
  .describe('c', 'identify chainType')
  .describe('w', 'identify storemanWanAddr')
  .describe('o', 'identify storemanOriAddr')
  .describe('testnet', 'identify whether using testnet or not, if no "--testnet", using mainnet as default')
  .describe('replica', 'identify whether use replica set , if no "--replica", one mongo db as default')
  .describe('dev', 'identify whether production env or development env, use different log server, if no "--dev", production env as default')
  .describe('leader', 'identify whether is leader agent, only leader can send the transaction')
  .describe('init', 'identify whether to init after startup')
  .describe('renew', 'identify whether to renew the storemanAgent in cycle')
  .describe('mpc', 'identify whether to use mpc')
  .describe('schnorr', 'identify whether to use schnorr mpc or normal/old mpc')
  .describe('keosd', 'identify whether to use keosd to manager wallet when cross EOS')
  .describe('keosdUrl', 'identify EOS keosd Url if keosd enable')
  .describe('wallet', 'identify EOS keosd wallet name if keosd enable')
  .describe('password', 'identify password path(file)')
  .describe('keystore', 'identify keystore path(dir)')
  .describe('doDebt', 'debug whether to doDebt')
  .describe('withdraw', 'debug whether to withdraw')
  .describe('metric', 'start metric agent(agent for leader write incentive and slash metric data, leader only)')
  .describe('grpInfo', 'start grpInfo agent(agent to build storeman group info. dynamically,configuration file for mpc, every node.)')
  .describe('chain', 'identify debt chain or withdrawFee chain')
  .describe('token', 'identify debt token or withdrawFee token')
  .describe('debt', 'identify debt amount')
  .describe('debtor', 'identify debt debtor')
  .describe('wanReceiver', 'identify withdrawFee wanReceiver')
  .describe('oriReceiver', 'identify withdrawFee oriReceiver')
  .describe('oriurl', 'identify ori chain url')
  .describe('oribpurl', 'identify ori chain BP url')
  .describe('wanurl', 'identify wan chain url')
  .describe('loglevel', 'identify agent loglevel')
  .describe('wa', 'identify agent working address')
  .default('i', 0)
  .default('period', '2')
  .default('loglevel', 'debug')
  .string('pk')
  .string('mpcip')
  .string('mpcipc')
  .string('dbip')
  .string('c')
  .string('w')
  .string('o')
  .string('period')
  .string('keosdUrl')
  .string('wallet')
  .string('password')
  .string('keystore')
  .string('debt')
  .string('chain')
  .string('token')
  .string('debtor')
  .string( 'wanReceiver')
  .string('oriReceiver')
  .string('oriurl')
  .string('oribpurl')
  .string('wanurl')
  .string('loglevel')
  .string('wa')
  .boolean('testnet', 'replica', 'dev', 'leader', 'init', 'renew', 'mpc', 'schnorr', 'keosd', 'doDebt', 'withdraw')
  .argv;

let pass = true;

if ((argv.mpc && ((!argv.mpcIP || !argv.mpcPort) && (!argv.mpcipc)))
  || (argv.doDebt && (!argv.chain && !argv.token))
  || (argv.withdraw && (!argv.chain && !argv.token && !argv.wanReceiver))
  || (argv.withdraw && (!argv.chain && !argv.token && !argv.oriReceiver))
  // || (argv.init && (!argv.c))) {
  || (!argv.c)) {
  pass = false;
}

if (argv.init && (!argv.c || !argv.w || !argv.o)) {
  pass = false;
}

if (argv.leader) {
  if ( (argv.schnorr && (!argv.password || !argv.keystore))
    || (argv.keosd && (!argv.keosdUrl || !argv.wallet || !argv.password))
    || (argv.doDebt && (!argv.chain && !argv.token && !argv.debtor && !argv.debt))
    || (argv.withdraw && (!argv.chain && !argv.token && !argv.wanReceiver))
    || (argv.withdraw && (!argv.chain && !argv.token && !argv.oriReceiver))
    || (argv.init && (!argv.c || !argv.w || !argv.o))) {
    pass = false;
  }
}

if (!argv.wa) {
  pass = false;
}

if (argv.leader) {
    if ( !argv.metric){
        pass = false;
    }
}

if (!argv.grpInfo) {
    pass = false;
}

if (argv.help || !pass) {
  optimist.showHelp();
  process.exit(0);
}

global.argv = argv;

if (argv.index) {
  global.index = argv.index;
} else {
  global.index = '';
}

global.crossChain = argv.c;
global.storemanPk = argv.pk;
global.mpcIP = argv.mpcIP;
global.mpcPort = argv.mpcPort;
global.dbIp = argv.dbIp;
global.dbPort = argv.dbPort;
global.testnet = argv.testnet ? true : false;
global.replica = argv.replica ? true : false;
global.dev = argv.dev ? true : false;
global.isLeader = argv.leader ? true : false;
global.keosd = argv.keosd ? true : false;
global.wallet = argv.wallet;
global.configMutex = false;
global.workingAddress = argv.wa;
global.metric = argv.metric ? true:false;
global.grpInfo = argv.grpInfo ? true:false;

const {
  loadJsonFile,
  loadConfig,
  initChain,
  initConfig,
  initNonce,
  getGlobalChain,
  backupIssueFile,
  writeConfigToFile,
  sleep
} = require('comm/lib');

try {
  global.keystore = global.argv.keystore;
  if (global.argv.password) {
    global.secret = loadJsonFile(global.argv.password);
  }
  if (global.isLeader) {
    if (global.keosd) {
      global.keosdUrl = global.argv.keosdUrl;
    }
  }
} catch (err) {
  // process.exit(0);
}

const moduleConfig = require('conf/moduleConfig.js');
global.config = loadConfig();

let dbOption = {
  useNewUrlParser: true
}
let dbUrl = moduleConfig.crossDbUrl + global.index;
if (global.replica) {
  const awsDBOption = {
    // used for mongo replicaSet
    replicaSet: "s0",
    readPreference: "secondaryPreferred" //readPreference must be either primary/primaryPreferred/secondary/secondaryPreferred/nearest
  }
  Object.assign(dbOption, awsDBOption);
  // dbUrl = dbUrl + "?authSource=admin";
}
dbUrl = dbUrl + "?authSource=admin";

global.dbUrl = dbUrl;
global.dbOption = dbOption;

const mongoose = require('mongoose');
const ModelOps = require('db/modelOps');

const EthAgent = require("agent/EthAgent.js");
const EosAgent = require("agent/EosAgent.js");
const WanAgent = require("agent/WanAgent.js");

const NormalCross = require("monitor/normalCross.js");
const Debt = require("monitor/debt.js");
<<<<<<< HEAD
=======
//const {handlerOpenStoreman} = require("monitor/openStoreman.js");
>>>>>>> 00199272123ce61440eb6b68718aac136213fcb7
const WithdrawFee = require("monitor/withdrawFee.js");

let handlingList = {};

let tokenList = {};

global.storemanRestart = false;
global.storemanRenew = false;
let firstSyncDone = false;

global.agentDict = {
  ETH: EthAgent,
  EOS: EosAgent,
  WAN: WanAgent
}

const Logger = require('comm/logger.js');

global.syncLogger = new Logger("storemanAgent-sync-" + global.argv.c, "log/storemanAgent.log", "log/storemanAgent_error.log", global.argv.loglevel);
global.monitorLogger = new Logger("storemanAgent-action-" + global.argv.c, "log/storemanAgent.log", "log/storemanAgent_error.log", global.argv.loglevel);
global.mpcLogger = new Logger("storemanAgent-mpc-" + global.argv.c, "log/storemanAgent.log", "log/storemanAgent_error.log", global.argv.loglevel);
global.osmLogger = new Logger("openStoreman-" + global.argv.c, "log/openStoreman.log", "log/openStoreman_error.log", global.argv.loglevel);
global.metricLogger = new Logger("storemanAgent-metric-" + global.argv.c, "log/storemanAgent.log", "log/storemanAgent_error.log", global.argv.loglevel);
global.grpInfoLogger = new Logger("storemanAgent-metric-" + global.argv.c, "log/storemanAgent.log", "log/storemanAgent_error.log", global.argv.loglevel);

async function init() {
  try {
    global.config = loadConfig();
    let tempTokenList = {};
    initChain('WAN');
 
    global.storemanRestart = true;
    backupIssueFile(global.config.issueCollectionPath);

    tempTokenList.supportTokenAddrs = [];
    tempTokenList.wanchainHtlcAddr = [];
    tempTokenList.originalChainHtlcAddr = [];
    tempTokenList.storemanAddress = [];

    for (let crossChain in global.config.crossTokens) {
      // if (!moduleConfig.crossInfoDict[crossChain].CONF.enable) {
      if (crossChain !== global.crossChain) {
        continue;
      }

      initChain(crossChain);

      tempTokenList[crossChain] = {};
      tempTokenList[crossChain].storemanOri = global.config.crossTokens[crossChain].CONF.storemanOri;
      tempTokenList[crossChain].storemanWan = global.config.crossTokens[crossChain].CONF.storemanWan;

      // if (global.isLeader) {
        if (!moduleConfig.crossInfoDict[crossChain].CONF.nonceless) {
          await initNonce(crossChain, tempTokenList[crossChain].storemanOri);
          syncLogger.info("CrossChain:" , crossChain, ", Nonce of chain", crossChain, tempTokenList[crossChain].storemanOri, global[crossChain.toLowerCase() + 'LastNonce'][tempTokenList[crossChain].storemanOri]);
        }
        await initNonce('WAN', tempTokenList[crossChain].storemanWan);
        syncLogger.info("CrossChain:" , crossChain, ", Nonce of chain", 'WAN', tempTokenList[crossChain].storemanWan,  global['wanLastNonce'][tempTokenList[crossChain].storemanWan]);
      // }

      if (moduleConfig.crossInfoDict[crossChain].CONF.schnorrMpc) {
        tempTokenList.storemanAddress.push(global.config.crossTokens[crossChain].CONF.storemanPk);
      } else {
        tempTokenList.storemanAddress.push(tempTokenList[crossChain].storemanWan);
        tempTokenList.storemanAddress.push(tempTokenList[crossChain].storemanOri);
      }

      tempTokenList[crossChain].supportTokens = {};

      for (let token in global.config["crossTokens"][crossChain]["TOKEN"]) {
        tempTokenList.supportTokenAddrs.push(token);
        tempTokenList[crossChain].supportTokens[token] = global.config["crossTokens"][crossChain]["TOKEN"][token].tokenSymbol;
      }

      for (let tokenType in moduleConfig.crossInfoDict[crossChain]) {
        if (tokenType === 'CONF') {
          continue;
        }
        tempTokenList[crossChain][tokenType] = {};

        tempTokenList[crossChain][tokenType].wanchainHtlcAddr = moduleConfig.crossInfoDict[crossChain][tokenType].wanchainHtlcAddr;
        tempTokenList[crossChain][tokenType].originalChainHtlcAddr = moduleConfig.crossInfoDict[crossChain][tokenType].originalChainHtlcAddr;

        tempTokenList.wanchainHtlcAddr.push(moduleConfig.crossInfoDict[crossChain][tokenType].wanchainHtlcAddr);
        tempTokenList.originalChainHtlcAddr.push(moduleConfig.crossInfoDict[crossChain][tokenType].originalChainHtlcAddr);

        tempTokenList[crossChain][tokenType].wanCrossAgent = new global.agentDict['WAN'](crossChain, tokenType);
        tempTokenList[crossChain][tokenType].originCrossAgent = new global.agentDict[crossChain](crossChain, tokenType);
        tempTokenList[crossChain][tokenType].lockedTime = await tempTokenList[crossChain][tokenType].wanCrossAgent.getLockedTime();
      }
    }
    // monitorLogger.info(tokenList);
    tokenList = tempTokenList;
    global.syncLogger.info("storeman agent init done!", tokenList);
  } catch (err) {
    console.log("init error ", err);
    process.exit();
  }
}

async function update() {
  let storemanWan;
  let storemanOri;
  global.storemanRenew = true;
  global.configMutex = true;

  global.syncLogger.info("Storeman agent renew config begin");

  for (let crossChain in global.config.crossTokens) {
    try {
      // if (Object.keys(global.config["crossTokens"][crossChain].TOKEN).length === 0) {
      //   continue;
      // }
      if (global.config["crossTokens"][crossChain].CONF.storemanOri) {
        storemanOri = global.config["crossTokens"][crossChain].CONF.storemanOri;
        storemanWan = global.config["crossTokens"][crossChain].CONF.storemanWan;
        let crossTokens, storemanPk;
        if (moduleConfig.crossInfoDict[crossChain].CONF.schnorrMpc) {
          storemanPk = global.config["crossTokens"][crossChain].CONF.storemanPk;
        }
        crossTokens = await initConfig(crossChain, storemanWan, storemanOri, storemanPk);
        if (crossTokens === null) {
          global.syncLogger.error("Storeman agent renew config: couldn't find any tokens that the storeman is in charge of. ", crossChain, storemanWan, storemanOri, storemanPk);
        }
      } else {
        global.syncLogger.error("Storeman agent should be initialized with storemanWanAddr storemanOriAddr at the first time!");
      }
    } catch (err) {
      global.syncLogger.error("Storeman agent update error, plz check the global.config and try again.", err);
    }
  }

  global.configMutex = false;
  await init();

  // global.storemanRenew = false;

  global.syncLogger.info("Storeman agent renew config end. ");
}

async function getScEvents(logger, chain, scAddr, topics, fromBlk, toBlk) {
  let events;
  let cntPerTime = 50;
  try {
    events = await chain.getScEventSync(scAddr, topics, fromBlk, toBlk, moduleConfig.web3RetryTimes);
  } catch (err) {
    logger.error("getScEvents", err);
    return await Promise.reject(err);
  }

  let i = 0;
  let end;
  logger.info("events length: ", chain.chainType, events.length);

  if (chain.chainType === 'EOS') {
    return events; // EOS has timestamp already
  }

  while (i < events.length) {
    if ((i + cntPerTime) > events.length) {
      end = events.length;
    } else {
      end = i + cntPerTime;
    }
    let arr = events.slice(i, end);
    let multiEvents = [...arr].map((event) => {
      return new Promise(async (resolve, reject) => {
        if(event === null) {
          logger.debug("event is null")
          resolve();
        }
        try {
          let block = await chain.getBlockByNumberSync(event.blockNumber);
          event.timestamp = block.timestamp;
          resolve();
        } catch (err) {
          reject(err);
        }

        // chain.getBlockByNumber(event.blockNumber, function(err, block) {
        //   if (err) {
        //     reject(err);
        //   } else {
        //     event.timestamp = block.timestamp;
        //     resolve();
        //   }
        // });
      });
    });

    try {
      await Promise.all(multiEvents);
    } catch (err) {
      logger.error("getScEvents", err);
      return await Promise.reject(err);
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
        if (chainType === crossChain) {
          crossAgent = tokenTypeHandler.originCrossAgent;
        } else {
          crossAgent = tokenTypeHandler.wanCrossAgent;
        }

        let decodeEvent;
        if (crossAgent.contract) {
          decodeEvent = crossAgent.contract.parseEvent(event);
        } else {
          decodeEvent = event;
        }

        let content;
        if (decodeEvent === null) {
          resolve();
          return;
        } else {
          crossAgent.setModelOps(modelOps);
          content = await crossAgent.getDecodeEventDbData(chainType, crossChain, tokenType, decodeEvent, event, lockedTime);
        }

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
          } else if (content[1].hasOwnProperty("withdrawFeeEvent")) {
            let option = {
              "withdrawFeeTxHash": content[0]
            };
            let result = await modelOps.getEventHistory(option);
            if (result.length === 0) {
              resolve();
              return;
            } else {
              content = [result[0].hashX, content[1]];
            }
          }
          if (crossAgent.chain.checkIrreversible) {
            let irreversible = await crossAgent.chain.checkTransIrreversibleSync(decodeEvent.transactionHash);
            if (irreversible) {
              syncLogger.debug("The txHash %s is irreversible for record %s, this trans will be saved!", decodeEvent.transactionHash, content[0]);
            } else {
              syncLogger.debug("The txHash %s still is not irreversible or executed for record %s", decodeEvent.transactionHash, content[0]);
              resolve();
              return;
            }
          }
          await modelOps.syncSave(...content);
          // modelOps.saveScannedEvent(...content);
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });

  try {
    await Promise.all(multiEvents);
    syncLogger.debug("********************************** splitEvent done **********************************", chainType, crossChain, tokenType);
  } catch (err) {
    global.syncLogger.error("splitEvent", err);
    return await Promise.reject(err);
  }
}

async function syncChain(chainType, crossChain, logger) {
  logger.info("********************************** syncChain **********************************", chainType, crossChain);

  let blockNumber = 0;
  let chain = getGlobalChain(chainType);
  try {
    blockNumber = await modelOps.getScannedBlockNumberSync(crossChain, chainType);
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
        let blkIndex = from;
        let blkEnd;
        let range = to - from;
        let cntPerTime = 20000;

        while (blkIndex < to) {
          if ((blkIndex + cntPerTime) > to) {
            blkEnd = to;
          } else {
            blkEnd = blkIndex + cntPerTime;
          }

          for (let tokenType in moduleConfig.crossInfoDict[crossChain]) {
            if (tokenType === 'CONF') {
              continue;
            }
            logger.info("blockSync range: From ", from, " to ", to, " remain ", range, ", FromBlk:", blkIndex, ", ToBlk:", blkEnd, chainType, crossChain, tokenType);
            let scAddr;

            while (global.configMutex) {
              await sleep(3);
            }

            if (chainType.toLowerCase() === crossChain.toLowerCase()) {
              scAddr = tokenList[crossChain][tokenType].originalChainHtlcAddr;
            } else {
              scAddr = tokenList[crossChain][tokenType].wanchainHtlcAddr;
            }

            events = await getScEvents(logger, chain, scAddr, topics, blkIndex, blkEnd);

            logger.info("events:", chainType, crossChain, tokenType, events.length);
            if (events.length > 0) {
              await splitEvent(chainType, crossChain, tokenType, events);
            }
            events = [];
          }
          await modelOps.syncSaveScannedBlockNumber(crossChain, chainType, blkEnd);
          logger.info("********************************** saveState **********************************", chainType, crossChain, blkEnd);

          blkIndex += cntPerTime;
          range -= cntPerTime;
        }
      }
    } catch (err) {
      logger.error("syncChain from :", chainType, crossChain, err);
      return;
    }
  }
}

async function syncMain(logger, db) {

  while (1) {
    try {
      for (let crossChain in moduleConfig.crossInfoDict) {
        // for (let tokenType in moduleConfig.crossInfoDict[crossChain]) {
        //   if (tokenType === 'CONF') {
        //     continue;
        //   }
          // if (moduleConfig.crossInfoDict[crossChain].CONF.enable) {
          if (crossChain === global.crossChain) {
            await Promise.all([
              syncChain(crossChain, crossChain, logger),
              syncChain('WAN', crossChain, logger)
            ]);
          }
        // }
      }
      if (!firstSyncDone) {
        firstSyncDone = true;
        logger.info("syncMain firstSyncDone!", firstSyncDone);
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
  let StateAction;
  // debt and withdraw will use leader-monitor and follower-apply mode
  if (record.isDebt) {
    if (tokenList.storemanAddress.includes(record.storeman)) {
      StateAction = NormalCross;
    } else {
      StateAction = Debt;
    }
  } else if (record.isFee) {
    StateAction = WithdrawFee;
  } else {
    StateAction = NormalCross;
  }

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

    while (global.configMutex || !firstSyncDone) {
      // await sleep(3);
      await sleep(moduleConfig.INTERVAL_TIME);
      continue;
    }

    try {
      let htlcAddrFilter = tokenList.wanchainHtlcAddr.concat(tokenList.originalChainHtlcAddr);
      let option = {
        tokenAddr: {
          $in: [...tokenList.supportTokenAddrs]
        },
        toHtlcAddr: {
          $in: [...htlcAddrFilter]
        },
        hashX: {
          $nin: Object.keys(handlingList)
        },
        // storeman: {
        //   $in: tokenList.storemanAddress
        // }
      }
      if (global.storemanRestart) {
        option.status = {
          $nin: ['redeemFinished', 'revokeFinished', 'withdrawFeeFinished', 'transIgnored', 'fundLostFinished']
        }
        global.storemanRestart = false;
      } else {
        option.status = {
          $nin: ['redeemFinished', 'revokeFinished', 'withdrawFeeFinished', 'transIgnored', 'fundLostFinished', 'interventionPending']
        }
      }
      if (!global.argv.doDebt) {
        option.storeman = {
          $in: tokenList.storemanAddress
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

async function syncMpcRequest(logger, db) {
  while (1) {
    try {
      let SchnorrMPC = require("mpc/schnorrMpc.js");
      let mpc = new SchnorrMPC();

      let mpcApproveDatas = [];
      mpcApproveDatas = await mpc.getDataForApprove();
      logger.info("********************************** syncMpcRequest start **********************************");

      let multiDataApproves = [...mpcApproveDatas].map((approveData) => {
        return new Promise(async (resolve, reject) => {
          try {
            if (!tokenList.storemanAddress.includes(approveData.pk) || !approveData.Extern) {
              // only manager the approve request only the storemanPK same
              resolve();
              return;
            }
            // approveData extern should be "cross:debt:EOS:tokenType:EOS"  /"cross:withdraw:EOS:tokenType:EOS"  /"cross:withdraw:EOS:tokenType:WAN"  / "cross:normal:EOS:tokenType:EOS" /"cross:normal:EOS:tokenType:WAN"
            let extern = approveData.Extern.split(':');
            if (extern.length === 6 && extern[0] === 'cross') {
              let crossChain = extern[2];
              let tokenType = extern[3];
              let transOnChain = extern[4];
              let tokenTypeHandler = tokenList[crossChain][tokenType];
              let crossAgent;
              if (crossChain === transOnChain) {
                crossAgent = tokenTypeHandler.originCrossAgent;
                } else {
                  crossAgent = tokenTypeHandler.wanCrossAgent;
                }

                let option = {
                  hashX : extern[5]
                };
                let result = await modelOps.getEventHistory(option);
                if (result.length === 0) {
                  logger.info("********************************** syncMpcRequest get one valid data **********************************", approveData);
                  let content = crossAgent.decodeSignatureData(approveData);
                  if (content !== null) {
                    await modelOps.syncSave(...content);
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
        if (mpcApproveDatas !== null) {
          await Promise.all(multiDataApproves);
        }
        logger.info("********************************** syncMpcRequest done **********************************");
      } catch (err) {
        logger.error("splitEvent", err);
        return await Promise.reject(err);
      }
    } catch (err) {
      logger.error("syncMpcRequest failed:", err);
    }

    await sleep(moduleConfig.MPCREQUEST_TIME);
  }
}

async function updateDebtRecordAfterRestart(logger) {
  let option = {
    isDebt: {
      $in: [true]
    },
    status: {
      $in: [null, 'init', 'waitingDebtApproveLock', 'waitingDebtLock']
    }
  }
  let changeList = await modelOps.getEventHistory(option);
  let content = {
    status: 'transIgnored'
  }
  logger.debug('changeList length is ', changeList.length);
  for (let i = 0; i < changeList.length; i++) {
    let record = changeList[i];
    await modelOps.syncSave(record.hashX, content);
  }
  logger.debug('updateDebtRecordAfterRestart finished!');
}

async function updateWithdrawRecordAfterRestart(logger) {
  let option = {
    isFee: {
      $in: [true]
    },
    status: {
      $nin: ['transIgnored', 'transFailed', 'withdrawFeeFinished', 'waitingWithdrawFeeConfirming', "interventionPending"]
    }
  }
  let changeList = await modelOps.getEventHistory(option);
  let content = {
    status: 'transIgnored'
  }
  logger.debug('changeList length is ', changeList.length);
  for (let i = 0; i < changeList.length; i++) {
    let record = changeList[i];
    await modelOps.syncSave(record.hashX, content);
  }
  logger.debug('updateWithdrawRecordAfterRestart finished!');
}

async function doDebt(logger) {
  try {
    if (global.argv.leader && global.argv.doDebt && global.argv.debtor && global.argv.debt) {
      let crossChain = global.argv.chain;
      let tokenAddr = global.argv.token;
      let tokenType;
      let debtor = global.argv.debtor;
      let debt = global.argv.debt;

      for (let token in global.config["crossTokens"][crossChain]["TOKEN"]) {
        if (token !== tokenAddr) {
          continue;
        } else {
          tokenType = global.config["crossTokens"][crossChain]["TOKEN"][token].tokenType;
          break;
        }
      }

      if (!tokenType) {
        logger.error("withdrawFee error:", "The tokenAddr can not be found!", tokenAddr);
        return;
      }
  
      if (moduleConfig.crossInfoDict[crossChain].CONF.schnorrMpc && moduleConfig.crossInfoDict[crossChain].CONF.debtOptEnable) {
        let tokenTypeHandler = tokenList[crossChain][tokenType];
        let crossAgent;
  
        crossAgent = tokenTypeHandler.originCrossAgent;
        let content = crossAgent.createDebtData(crossChain, crossChain, tokenType, tokenAddr, debtor, debt);
        logger.info("doDebt request:",
        "at chain ", crossChain, " about crossChain ", crossChain, " about tokenType ", tokenType, " tokenAddr ", tokenAddr, " with debtor is ", debtor, " and debt ", debt);
        await modelOps.syncSave(...content);
      }
    } else if (global.argv.doDebt) {
      logger.error("doDebt error:", "Only the leader can launch the debt trans request");
    }
  } catch (err) {
    logger.error("doDebt error:", err);
  }
}

async function withdrawFee(logger) {
  try {
    if (global.argv.leader && global.argv.withdraw && (global.argv.wanReceiver || global.argv.oriReceiver)) {
      let crossChain = global.argv.chain;
      let tokenAddr = global.argv.token;
      let tokenType;
      let receiver;
      let timestamp = parseInt(new Date().getTime() / 1000);

      for (let token in global.config["crossTokens"][crossChain]["TOKEN"]) {
        if (token !== tokenAddr) {
          continue;
        } else {
          tokenType = global.config["crossTokens"][crossChain]["TOKEN"][token].tokenType;
        }
      }
      if (!tokenType) {
        logger.error("withdrawFee error:", "The tokenAddr can not be found!", tokenAddr);
        return;
      }
  
      if (moduleConfig.crossInfoDict[crossChain].CONF.schnorrMpc && moduleConfig.crossInfoDict[crossChain].CONF.debtOptEnable) {
        let tokenTypeHandler = tokenList[crossChain][tokenType];
        let crossAgent;
  
        if (global.argv.wanReceiver) {
          receiver = global.argv.wanReceiver;
          crossAgent = tokenTypeHandler.wanCrossAgent;
          let wanContent = crossAgent.createWithdrawFeeData('WAN', crossChain, tokenType, tokenAddr, receiver, timestamp);
          logger.info("withdrawFee request:",
          "at chain ", "WAN", " about crossChain ", crossChain, " about tokenType ", tokenType, " tokenAddr ", tokenAddr, " with receiver is ", receiver, " and timestamp ", timestamp);
          await modelOps.syncSave(...wanContent);
        }
        if (global.argv.oriReceiver) {
          receiver = global.argv.oriReceiver;
          crossAgent = tokenTypeHandler.originCrossAgent;
          let oriContent = crossAgent.createWithdrawFeeData(crossChain, crossChain, tokenType, tokenAddr, receiver, timestamp);
          logger.info("withdrawFee request:",
          "at chain ", crossChain, " about crossChain ", crossChain, " about tokenType ", tokenType, " tokenAddr ", tokenAddr, " with receiver is ", receiver, " and timestamp ", timestamp);
          await modelOps.syncSave(...oriContent);
        }
      }
    } else if (global.argv.doDebt) {
      logger.error("withdrawFee error:", "Only the leader can launch the withdrawFee trans request");
    }
  } catch (err) {
    logger.error("withdrawFee error:", err);
  }
}

let db = mongoose.createConnection(dbUrl, dbOption);

db.on('connected', function(err) {
  if (err) {
    global.syncLogger.error('Unable to connect to database(' + moduleConfig.crossDbUrl.split('/')[3] + global.index + ')：' + err);
    global.syncLogger.error('Aborting');
    process.exit();
  } else {
    global.syncLogger.info('Connecting to database ' + moduleConfig.crossDbUrl.split('/')[3] + global.index + ' is successful!');
  }
});

let modelOps = new ModelOps(global.syncLogger, db);

const {handlerOpenStoreman} = require("agent/osm/src/openStoreman");
const gpk = require('agent/osm/src/gpk/agent');
const {getGrpInfoInst} = require('agent/osm/src/grpInfo/grpInfo');
const {getIncntSlshWriter} = require('agent/osm/src/metric/incntSlshWriter');

async function main() {
  global.syncLogger.info("storeman agent start!", global.argv);
  await writeConfigToFile(global.argv)

  if (global.argv.init && global.argv.c && global.argv.w && global.argv.o) {
    global.syncLogger.info("storeman agent begin to initialize!");
    await initConfig(global.argv.c, global.argv.w, global.argv.o, global.argv.pk);
    global.config = loadConfig();
  }

  global.syncLogger.info("start storeman agent");
  if (Object.keys(global.config["crossTokens"]).length === 0) {
    global.syncLogger.error("./init.sh storemanWanAddr storemanOriAddr");
    global.syncLogger.error("To start storeman agent at the first time, you need to run init.sh with storemanWanAddr storemanOriAddr as paras!");
    process.exit();
  }
  await init();

  if (global.argv.renew) {
    var renewJob = new CronJob({
      cronTime: '0 0 */' + global.argv.period + ' * * *',
      onTick: update,
      start: false,
      timeZone: 'Asia/Shanghai'
    });
    renewJob.start();
  }

  // syncMain(global.syncLogger, db);

  await updateRecordAfterRestart(global.monitorLogger);

  if (global.argv.doDebt || global.argv.withdraw) {
    if (global.argv.leader) {
      if (global.argv.doDebt) {
        await updateDebtRecordAfterRestart(global.monitorLogger);
        await doDebt(global.monitorLogger);
      }

      if (global.argv.withdraw) {
        await updateWithdrawRecordAfterRestart(global.monitorLogger);
        await withdrawFee(global.monitorLogger);
      }
    } else {
      if (moduleConfig.mpcSignature) {
        syncMpcRequest(global.mpcLogger, db);
      }
    }
  }

  handlerMain(global.monitorLogger, db);

  startOsmAgent();
}

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  global.syncLogger.error('unhandledRejection', error.message, error);
});

function startOsmAgent() {
  handlerOpenStoreman(global.monitorLogger)
  gpk.run();
  if(global.metric){
      getIncntSlshWriter().run();
  }
  if(global.grpInfo){
      getGrpInfoInst().run();
  }
}

main();

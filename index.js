"use strict"

const optimist = require('optimist')

let argv = optimist
  .usage("Usage: $0 -i [index] \
  --waddress [waddress] \
  --groupid [groupID] \
  --chain1 [chain1] --add1 [add1] --url1 [url1] \
  --chain2 [chain2] --add2 [add2] --url2 [url2] \
  [--replica] --dbip [dbIp] --dbport [dbPort] --dbuser [dbUser] \
  [--mpc] --mpcip [mpcIp] --mpcport [mpcPort] --mpcipc [mpcIpc] \
  [--testnet] [--dev] [--leader] [--init] [--renew] --period [period] \
  --loglevel [loglevel] \
  ")
  .alias({ 'h': 'help', 'i': 'index' })
  .describe({
    'h': 'display the usage',
    'i': 'identify storemanAgent index',
    'waddress': 'identify storeman work address',
    'groupid': 'identify storeman group unique identification',
    'chain1': 'identify cross chain-pair chain1 unique identification',
    'add1': 'identify the address at chain1: which is used for execute the transaction',
    'url1': 'identify the endpoint for chain1',
    'chain2': 'identify cross chain-pair chain2 unique identification',
    'add2': 'identify the address at chain2: which is used for execute the transaction',
    'url2': 'identify the endpoint for chain2',
    'replica': 'identify whether use replica set , if no "--replica", one mongo db as default',
    'dbip': 'identify db ip',
    'dbport': 'identify db port',
    'dbuser': 'identify db user',
    'mpc': 'identify whether to use mpc',
    'mpcip': 'identify mpc ip',
    'mpcPort': 'identify mpc port',
    'mpcipc': 'identify mpc ipc',
    'testnet': 'identify whether using testnet or not, if no "--testnet", using mainnet as default',
    'dev': 'identify whether production env or development env, use different log server, if no "--dev", production env as default',
    'leader': 'identify whether is leader agent, only leader will send the cross transaction',
    'init': 'identify whether to init after startup',
    'renew': 'identify whether to renew the storemanAgent config in cycle',
    'period': 'identify the renew period if renew is true'
  })
  .boolean(['testnet', 'dev', 'leader', 'init', 'renew', 'mpc', 'replica'])
  .string(['groupid', 'chain1', 'add1', 'url1', 'chain2', 'add2', 'url2', 'dbip', 'dbuser', 'mpcip', 'mpcipc', 'period', 'loglevel'])
  .default({ 'period': '2', 'loglevel': 'debug' })
  // .demand(['groupid'])
  .check(function (argv) {
    // if((argv.mpc && ((!argv.mpcIP || !argv.mpcPort) && (!argv.mpcipc)))) {
    //   return false;
    // }
    return true;
  })
  .argv;

if (argv.help) {
  optimist.showHelp();
}

global.argv = argv;
global.testnet = argv.testnet ? true : false;
global.dev = argv.dev ? true : false;
global.mpcIP = argv.mpcIP;
global.mpcPort = argv.mpcPort;
global.dbIp = argv.dbIp;
global.dbPort = argv.dbPort;
global.replica = argv.replica ? true : false;
global.dev = argv.dev ? true : false;
global.isLeader = argv.leader ? true : false;
global.keosd = argv.keosd ? true : false;
global.wallet = argv.wallet;
global.configMutex = false;

if (argv.index && argv.index !== true) {
  global.index = argv.index;
} else {
  global.index = '';
}

const {
  loadConfig,
  initNonce,
  initConfigV2,
  getChainPairs,
  getTokenPairIDsByChainPair
} = require('comm/lib');
// let modelOps = require('db/index.js');

const moduleConfig = require('conf/moduleConfig.js');

async function init(groupID) {
  try {
    global.config = loadConfig();
    let tempTokenList = {};
    tempTokenList.storemanPk = [];
    let storemanGroup = global.config.storemanGroups[groupID];
    let chainPairs = getChainPairs(groupID);

    for (let chainType of chainPairs) {
      tempTokenList[chainType] = {};
      tempTokenList[chainType].storemanAddr = global.config.crossTokens[chainType].CONF.storemanAddr;
      if (!moduleConfig.crossInfoDict[chainType].CONF.nonceless) {
        // await initNonce(chainType, tempTokenList[chainType].storemanAddr);
        // syncLogger.info("CrossChain:" , chainType, ", Nonce of chain", tempTokenList[chainType].storemanAddr, global[chainType.toLowerCase() + 'LastNonce'][tempTokenList[chainType].storemanAddr]);
      }
      tempTokenList[chainType].crossScAddr = moduleConfig.crossInfoDict[chainType].CONTRACT.crossScAddr;
      tempTokenList.storemanPk.push(global.config.crossTokens[chainType].CONF.storemanPk);
    }

    tempTokenList.supportTokenPairs = global.config.tokenPairIDs;

    console.log(tempTokenList); 
  } catch (err) {
    console.log("init error ", err);
    process.exit();
  }
}

function main() {
  console.log(argv);
  initConfigV2();

  init("0x111122223333444455556666777788889999aaaabbbbccccddddeeeeffffcccc");
}

main();



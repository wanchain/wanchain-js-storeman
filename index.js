"use strict"

const optimist = require('optimist')

let argv = optimist
  .usage("Usage: $0 -i [index] \
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
  .demand(['groupid'])
  .check(function (argv) {
    if((argv.mpc && ((!argv.mpcIP || !argv.mpcPort) && (!argv.mpcipc)))) {
      return false;
    }
  })
  .argv;

if (argv.help) {
  optimist.showHelp();
}

function main() {
  console.log(argv);
}

main();



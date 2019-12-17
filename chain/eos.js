"use strict"

const moduleConfig = require('conf/moduleConfig.js');
const TimeoutPromise = require('utils/timeoutPromise.js')
const baseChain = require("chain/base.js");

const { Api, JsonRpc, RpcError } = require('eosjs');
const fetch = require('node-fetch');
const { TextEncoder, TextDecoder } = require('util');

class EosChain extends baseChain {
  constructor(log, nodeUrl) {
    super(log, nodeUrl);
    this.chainType = 'EOS';
  }

  getClient(nodeUrl) {
    if (nodeUrl.indexOf("http://") !== -1 || nodeUrl.indexOf("https://") !== -1) {
      this.nodeUrl = nodeUrl;
      const rpc = new JsonRpc(nodeUrl, { fetch });
      const api = new Api({ rpc, authorityProvider: rpc, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

      return api;
    } else {
      return null;
    }
  }

  async get_info() {
    let eos = this.client;
    return new TimeoutPromise(async (resolve, reject) => {
      try {
        let result = await eos.rpc.get_info();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' get_info timeout')
  }

  getNetworkId() {
    let log = this.log;
    let chainType = this.chainType;
    let eos = this.client;
    let self = this;

    return new TimeoutPromise(async (resolve, reject)=> {
      try {
        if (self.chainId) {
          resolve(self.chainId);
          return;
        }
        let chain_id = await eos.rpc.get_info();
        log.debug("ChainType:", chainType, "getNetWork result is", chain_id);
        self.chainId = chain_id;
        resolve(chain_id);
      } catch (err) {
        reject(err);
      };
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getNetworkId timeout');
  }

  encodeToken(account, quantity) {
    let symbol = quantity.split(' ')[1];
    // let decimals = quantity.split(' ')[0].split('.')[1] ? quantity.split(' ')[0].split('.')[1].length : 0;
    return account + ':' + symbol;
  }

  actionDecode(actions) {
    let self = this;
    let chainType = this.chainType;
    const trx = [];
    actions.map(action => {
      try{
        const { account, name, authorization, data } = action.action_trace.act;
        let obj = {
          address: account,
          blockNumber: action.block_num,
          transactionHash: action.action_trace.trx_id,
          authorization: authorization,
          // timestamp: action.block_time
          event: name
        }
        if (name === 'transfer') {
          if (action.action_trace.act.data.memo.split(':').length === 4 && action.action_trace.act.data.memo.split(':')[0] === 'inlock') {
            const { from, to, quantity, memo } = action.action_trace.act.data;
            obj = {
              ...obj,
              args: {
                user: from,
                toHtlcAddr: to,
                storeman: '0x' + memo.split(':')[3],
                value: quantity,
                xHash: '0x' + memo.split(':')[1],
                wanAddr: '0x' + memo.split(':')[2],
                tokenOrigAccount: self.encodeToken(account, quantity)
              }
            };
          } else {
            return;
          }
        } else {
          if (data) {
            // if (data.value) {
            //   data.value = this.toFloat(data.value);
            // };
            if (data.xHash) {
              data.xHash = '0x' + data.xHash;
            }          
            if (data.x) {
              data.x = '0x' + data.x;
            };
            obj = {
              ...obj,
              args: data
            };
          } else {
            return;
          }
        }
        trx.push(obj);
      } catch (err) {
        log.error("ChainType:", chainType, "something wrong happened during actionDecode", err, actions);
      }
    })
    return trx;
  }

  getScEventSync(accountName, topics, fromBlk, toBlk, retryTimes = 0) {
    let times = 0;
    let chainType = this.chainType;
    let log = this.log;
    let eos = this.client;
    let self = this;
    return new TimeoutPromise(async function (resolve, reject) {
      let filter = action => action.block_num >= fromBlk && action.block_num <= toBlk && (['transfer', 'inredeem', 'inrevoke', 'outlock', 'outredeem', 'outrevoke'].includes(action.action_trace.act.name));

      let filterGet = async function (filter) {
        try {
          let result = await eos.rpc.history_get_actions(accountName);
          let actions = result.actions.filter(filter);
          const trx = self.actionDecode(actions);
          resolve(trx);
        } catch (err) {
          if (times >= retryTimes) {
            log.error("ChainType:", chainType, "getScEventSync", err);
            reject(err);
          } else {
            log.debug("ChainType:", chainType, "getScEventSync retry", times);
            times++;
            filterGet(filter);
          }
        }
      }
      try {
        filterGet(filter);
      } catch (err) {
        log.error("ChainType:", chainType, "getScEventSync", err);
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getScEventSync timeout');
  }

  getBlockNumberSync() {
    let chainType = this.chainType;
    let eos = this.client;
    let self = this;
    let log = this.log;
    return new TimeoutPromise(async (resolve, reject) => {
      try {
        let result = await eos.rpc.get_info();
        let blockNumber = result.head_block_num;
        log.debug("ChainType:", chainType, 'getBlockNumberSync successfully with result: ', self.chainType, blockNumber);
        resolve(blockNumber);
      } catch (err) {
        reject(err);
      };
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getBlockNumberSync timeout')
  }

  getIrreversibleBlockNumberSync() {
    let chainType = this.chainType;
    let eos = this.client;
    let self = this;
    let log = this.log;
    return new TimeoutPromise(async (resolve, reject) => {
      try {
        let result = await eos.rpc.get_info();
        let blockNumber = result.last_irreversible_block_num;
        log.debug("ChainType:", chainType, 'getIrreversibleBlockNumberSync successfully with result: ', self.chainType, blockNumber);
        resolve(blockNumber);
      } catch (err) {
        reject(err);
      };
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getIrreversibleBlockNumberSync timeout')
  }

  async getBlockByNumber(blockNumber, callback) {
    let eos = this.client;
    try {
      let result = await eos.rpc.get_block(blockNumber);
      let date = new Date(result.timestamp + 'Z'); // "Z" is a zero time offset
      result.timestamp = date.getTime()/1000;
      callback(null, result);
    } catch (err) {
      callback(err, null);
    }
  }

  getBlockByNumberSync(blockNumber) {
    let eos = this.client;
    let chainType = this.chainType;

    return new TimeoutPromise(async function (resolve, reject) {
      try {
        let result = await eos.rpc.get_block(blockNumber);
        let date = new Date(result.timestamp + 'Z'); // "Z" is a zero time offset
        result.timestamp = date.getTime()/1000;
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getBlockByNumberSync timeout');
  }

  getTransactionReceiptSync(txHash) {
    let chainType = this.chainType;
    let eos = this.client;
    
    return new TimeoutPromise(async (resolve, reject) => {
      try {
        let result = await eos.rpc.history_get_transaction(txHash);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getTransactionReceiptSync timeout')
  }
  
  getTransactionConfirmSync(txHash, waitBlocks) {
    let chainType = this.chainType;
    let log = this.log;
    let self = this;
    let receipt = null;
    let curBlockNum = 0;
    let sleepTime = 30;

    return new TimeoutPromise(async (resolve, reject) => {
      try {
        receipt = await self.getTransactionReceiptSync(txHash);
        if (receipt === null) {
          resolve(receipt);
          return;
        }

        curBlockNum = await self.getBlockNumberSync();
        let receiptBlockNumber = receipt.block_num;

        while (receiptBlockNumber + waitBlocks > curBlockNum) {
          log.info("ChainType:", chainType, "getTransactionConfirmSync was called at block: ", receipt.block_num, 'curBlockNumber is ', curBlockNum, 'while ConfirmBlocks should after ', waitBlocks, ', wait some time to re-get');
          await sleep(sleepTime * 1000);
          receipt = await self.getTransactionReceiptSync(txHash);
          curBlockNum = await self.getBlockNumberSync();
          receiptBlockNumber = receipt.block_num;
        }
        if (receipt.trx.receipt.status === 'executed') {
          receipt.status = '0x1';
        }
        resolve(receipt);
      } catch (err) {
        log.error(err);
        resolve(null);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getTransactionConfirmSync timeout')
  }

  async packTrans(actions) {
    let chainType = this.chainType;
    let eos = this.client;

    return new TimeoutPromise(async (resolve, reject) => {
      try {
        let trans = {
          actions: actions
        }
        let packed_tx = await eos.transact(trans, {
          blocksBehind: 3,
          expireSeconds: 30,
          broadcast: false,
          sign: false
        });
  
        console.log("packed_tx is", JSON.stringify(packed_tx, null, 4));
        resolve (packed_tx);
      } catch (err) {
        reject(new Error(err));
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' packTrans timeout')   
  }

  async serializeActions(actions) {
    let chainType = this.chainType;
    let eos = this.client;

    return new TimeoutPromise(async (resolve, reject) => {
      try {
        let result = await eos.serializeActions(actions);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' serializeActions timeout')
  }

  async serializeTransaction(trans) {
    let chainType = this.chainType;
    let eos = this.client;

    return new TimeoutPromise(async (resolve, reject) => {
      try {
        let result = await eos.serializeTransaction(trans);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' serializeTransaction timeout')
  }

  async get_rawabi_and_abi(account) {
    let chainType = this.chainType;

    return new TimeoutPromise(async (resolve, reject) => {
      try {
        let eos = this.client;

        let rawAbi = (await eos.abiProvider.getRawAbi(account)).abi;
        let abi = (await eos.abiProvider.get_abi(account)).abi;
        console.log("==================get_rawabi_and_abi==================");
        console.log(rawAbi);
        console.log(abi);

        let result = {
          accountName: account,
          rawAbi: rawAbi,
          abi: abi
        }
        resolve(result);
      } catch (err) {
        console.log(err);
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' get_rawabi_and_abi timeout')
  }

  async getRequiredKeys(transaction, available_keys) {
    let chainType = this.chainType;
    let eos = this.client;
    return new TimeoutPromise(async (resolve, reject) => {
      try {
        let result = await eos.rpc.getRequiredKeys({transaction: transaction, availableKeys: available_keys});
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getRequiredKeys timeout')
  }

  async sendRawTransaction(signedTx, callback) {
    let log = this.log;
    try {
      let nodeUrl = "http://jungle2.cryptolions.io:80";
      const rpc = new JsonRpc(nodeUrl, { fetch });
      const api = new Api({ rpc, authorityProvider: rpc, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
      let eos = this.client;
      eos = api;
      let result = await eos.pushSignedTransaction(signedTx);
      log.debug("sendRawTransaction result is", result)
      callback(null, result.transaction_id);
    } catch (err) {
      callback(err, null);
    }
  }

  async sendRawTransactionSync(signedTx) {
    let log = this.log;
    let chainType = this.chainType;
    return new TimeoutPromise(async (resolve, reject) => {
      try {
        let nodeUrl = "http://jungle2.cryptolions.io:80";
        const rpc = new JsonRpc(nodeUrl, { fetch });
        const api = new Api({ rpc, authorityProvider: rpc, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
        let eos = this.client;
        eos = api;
        let result = await eos.pushSignedTransaction(signedTx);
        log.debug("sendRawTransaction result is", result)
        resolve(result.transaction_id);
      } catch (err) {
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' sendRawTransactionSync timeout')
  }

}

module.exports = EosChain;
"use strict"

const baseChain = require("chain/base.js");

const Eos = require('eosjs');

class EosChain extends baseChain {
  constructor(log, nodeUrl) {
    super(log, nodeUrl);
    this.chainType = 'EOS';
  }

  getNetworkId() {

  }

  getClient(nodeUrl) {
    if (nodeUrl.indexOf("http://") !== -1 || nodeUrl.indexOf("https://") !== -1) {
      let eosConfig = {
        // keyProvider: ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'], // 配置私钥字符串
        
        // httpEndpoint: 'http://192.168.1.58:8888'
        // httpEndpoint: 'http://junglehistory.cryptolions.io:18888'
        keyProvider: [], // 配置私钥字符串
        httpEndpoint: nodeUrl
      }
  
      return Eos(eosConfig);
    } else {
      return null;
    }
  }

  eosToFloat(str) 
  { 
    const floatRegex = /[^\d.-]/g
    return parseFloat(str.replace(floatRegex, '')); 
  }

  actionDecode(actions) {
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
          if (action.action_trace.act.data.memo.split(':').length === 2) {
            const { from, to, quantity, memo } = action.action_trace.act.data;
            obj = {
              ...obj,
              args: {
                user: from,
                toHtlcAddr: to,
                storemanGroup: to,
                value: quantity,
                xHash: '0x' + memo.split(':')[0],
                wanAddr: memo.split(':')[1],
                tokenOrigAccount: account
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
    return new Promise(async function (resolve, reject) {
      let filter = action => action.block_num >= fromBlk && action.block_num <= toBlk && (['transfer', 'inredeem', 'inrevoke', 'outlock', 'outredeem', 'outrevoke'].includes(action.action_trace.act.name));

      let filterGet = function (filter) {
        eos.getActions(accountName, (err, result) => {
          if (err) {
            if (times >= retryTimes) {
              log.error("ChainType:", chainType, "getScEventSync", err);
              reject(err);
            } else {
              log.debug("ChainType:", chainType, "getScEventSync retry", times);
              times++;
              filterGet(filter);
            }
          } else {
            let actions = result.actions.filter(filter);
            const trx = self.actionDecode(actions);
            resolve(trx);
          }
        });
      }
      try {
        filterGet(filter);
      } catch (err) {
        log.error("ChainType:", chainType, "getScEventSync", err);
        reject(err);
      }
    });
  }

  getBlockNumberSync() {
    let chainType = this.chainType;
    let eos = this.client;
    let self = this;
    let log = this.log;
    return new Promise((resolve, reject) => {

      eos.getInfo({}, (err, result) => {
        if (err) {
          reject(err);
        } else {
          let blockNumber = result.head_block_num;
          log.debug("ChainType:", chainType, 'getBlockNumberSync successfully with result: ', self.chainType, blockNumber);
          resolve(blockNumber);
        }
      })
    })
  }

  getIrreversibleBlockNumberSync() {
    let chainType = this.chainType;
    let eos = this.client;
    let self = this;
    let log = this.log;
    return new Promise((resolve, reject) => {
      eos.getInfo({}, (err, result) => {
        if (err) {
          reject(err);
        } else {
          let blockNumber = result.last_irreversible_block_num;
          log.debug("ChainType:", chainType, 'getIrreversibleBlockNumberSync successfully with result: ', self.chainType, blockNumber);
          resolve(blockNumber);
        }
      })
    })
  }

  getBlockByNumber(blockNumber, callback) {
    this.client.getBlock(blockNumber, (err, result) => {
      if (err) {
        callback(err, null);
      } else {
        let date = new Date(result.timestamp);
        result.timestamp = date.getTime()/1000;
        callback(null, result);
      }
    });
  }

  getTransactionReceiptSync(id) {
    let eos = this.client;
    return new Promise(function(resolve, reject) {
      eos.getTransaction(id, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    })
  }
  
  getTransactionConfirmSync(txHash, waitBlocks) {
    let chainType = this.chainType;
    let log = this.log;
    let self = this;
    let receipt = null;
    let curBlockNum = 0;
    let sleepTime = 30;

    return new Promise(async (resolve, reject) => {
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
        resolve(receipt);
      } catch (err) {
        log.error(err);
        resolve(null);
      }
    })
  }

  getSignatureSync(from, to, quantity, memo = '') {
    let eos = this.client;
    return new Promise((resolve, reject) => {
      eos.transfer(from, to, quantity, memo, { broadcast: false }, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result.transaction.signatures[0]);
        }
      });
    })
  }

  sign(from, to, quantity, memo = '') {
    let eos = this.client;
    let self = this;
    return new Promise(async (resolve, reject) => {
      try{
        // let tr = await eos.transfer(from, to, quantity, memo, { broadcast: false, sign: false });
        // let sig = await self.getSignature(from, to, quantity, memo);
        // tr.transaction.signatures.push(sig);
        let tr = await eos.transfer(from, to, quantity, memo, { broadcast: false});
        resolve(tr);
      } catch(err) {
        reject(err);
      }
    })
  }

  sendRawTransaction(signedTx, callback) {
    this.client.pushTransaction(signedTx, callback);
  }

  getTokenInfo(tokenScAddr) {

  }

}

module.exports = EosChain;
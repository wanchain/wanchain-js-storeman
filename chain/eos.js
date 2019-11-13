"use strict"

const baseChain = require("chain/base.js");

const Eos = require('eosjs');

class EosChain extends baseChain {
  constructor(log, nodeUrl) {
    super(log, nodeUrl);
    this.chainType = 'EOS';
  }

  getClient(nodeUrl) {
    if (nodeUrl.indexOf("http://") !== -1 || nodeUrl.indexOf("https://") !== -1) {
      this.nodeUrl = nodeUrl;
      let eosConfig = {
        // keyProvider: [''], // 配置私钥字符串
        httpEndpoint: nodeUrl,
        // chainId: "e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473", 
        expireInSeconds: 60,
        verbose: false, 
        // broadcast: true,
        // sign: true
      }
      return Eos(eosConfig);
    } else {
      return null;
    }
  }

  getNetworkId() {
    let log = this.log;
    let chainType = this.chainType;
    let eos = this.client;
    let self = this;

    return new Promise((resolve, reject)=> {
      try {
        if (this.chainId) {
          resolve(this.chainId);
          return;
        }
        eos.getInfo((err, result) => {
          if(!err) {
            log.debug("ChainType:", chainType, "getNetWork result is", result);
            self.chainId = result.chain_id;
            resolve(result.chain_id);
          } else {
            reject(err);
          }
        })
      } catch (err) {
        reject(err);
      };
    });
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
          if (action.action_trace.act.data.memo.split(':').length === 4 && action.action_trace.act.data.memo.split(':')[0] === 'inlock') {
            const { from, to, quantity, memo } = action.action_trace.act.data;
            obj = {
              ...obj,
              args: {
                user: from,
                toHtlcAddr: to,
                storemanGroup: '0x' + memo.split(':')[3],
                value: quantity,
                xHash: '0x' + memo.split(':')[1],
                wanAddr: '0x' + memo.split(':')[2],
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
        let date = new Date(result.timestamp + 'Z'); // "Z" is a zero time offset
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

  async packTrans(actions) {
    let eos = this.client;

    try {
      let packed_tx = await eos.transaction({
        actions: actions
      }, {
          broadcast: false,
          sign: false
        });
      console.log("packed_tx is", JSON.stringify(packed_tx, null, 4));
      return packed_tx.transaction.transaction;
    } catch (err) {
      throw new Error(err);
    }
  }

  async getRequiredKeys(transaction, available_keys) {
    let eos = this.client;
    return eos.getRequiredKeys(transaction, available_keys);
  }

  async sendRawTransaction(signedTx, callback) {
    // try {
    //   let result = await this.client.pushTransaction(signedTx);
    //   callback(null, result.transaction_id);
    // } catch (err) {
    //   callback(err, null);
    // }

    this.client.pushTransaction(signedTx, (err, result) => {
      if(!err) {
        callback(null, result.transaction_id);
      } else {
        callback(err, null);
      }
    });
  }

  getTokenInfo(tokenScAddr) {

  }

}

module.exports = EosChain;
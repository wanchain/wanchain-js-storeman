const {
  sleep
} = require('comm/lib');

class baseChain {
  constructor(log, theWeb3) {
    this.log = log;
    this.theWeb3 = theWeb3;
  }

  getScEvent(address, topics, fromBlk, toBlk, callback) {
    let filterValue = {
      fromBlock: fromBlk,
      toBlock: toBlk,
      topics: topics,
      address: address
    };
    let filter = this.theWeb3.eth.filter(filterValue);
    filter.get(function(err, events) {
      callback(err, events);
    });
  }

  getScEventSync(address, topics, fromBlk, toBlk) {
    let baseChain = this;
    return new Promise(function (resolve, reject) {
      let filterValue = {
        fromBlock: fromBlk,
        toBlock: toBlk,
        topics: topics,
        address: address
      };
      console.log(filterValue);
      let filter = baseChain.theWeb3.eth.filter(filterValue);
      filter.get(function(err, events) {
        if (err) {
          baseChain.log.error("getScEventSync", err);
          reject(err);
        } else {
          resolve(events);
        }
      });
    });
  }

  getGasPrice(callback) {
    let log = this.log;
    let theWeb3 = this.theWeb3;
    let gasPrice = null;
    try {
      theWeb3.eth.getGasPrice(function(err, result) {
        if (!err) {
          gasPrice = result.toString(10);
          log.debug('getGasPrice ', gasPrice, ' successfully');
        }
        callback(err, gasPrice);
      });
    } catch (err) {
      callback(err, gasPrice);
    }
  }

  getGasPriceSync() {
    let log = this.log;
    let theWeb3 = this.theWeb3;
    let gasPrice = null;

    return new Promise(function (resolve, reject) {
      try {
        theWeb3.eth.getGasPrice(function(err, result) {
          if (err) {
            reject(err);
          } else {
            gasPrice = result.toString(10);
            log.debug('getGasPrice ', gasPrice, ' successfully');
            resolve(gasPrice);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  getNonce(address, callback) {
    let log = this.log;
    let theWeb3 = this.theWeb3;
    let nonce = null;
    try {
      theWeb3.eth.getTransactionCount(address, function(err, result) {
        if (!err) {
          nonce = '0x' + result.toString(16);
          log.debug('getNonce ', nonce, ' successfully on address ', address);
        }
        callback(err, nonce);
      });
    } catch (err) {
      callback(err, nonce);
    }
  }

  getNonceSync(address) {
    let log = this.log;
    let theWeb3 = this.theWeb3;
    let nonce = null;

    return new Promise(function (resolve, reject) {
      try {
        theWeb3.eth.getTransactionCount(address, function(err, result) {
          if (err) {
            reject(err);
          } else {
            nonce = '0x' + result.toString(16);
            log.debug('getNonce ', nonce, ' successfully on address ', address);
            resolve(nonce);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  getNonceIncludePending(address, optional, callback) {
    let log = this.log;
    let theWeb3 = this.theWeb3;
    let nonce = null;

    try {
      theWeb3.eth.getTransactionCount(address, optional, function(err, result) {
        if (!err) {
          nonce = '0x' + result.toString(16);
          log.debug('getNonceIncludePending ', nonce, ' successfully on address ', address);
        }
        callback(err, nonce);
      });
    } catch (err) {
      callback(err, nonce);
    }
  }

  getBlockNumber(callback) {
    let log = this.log;
    let theWeb3 = this.theWeb3;
    let blockNumber = null;
    try {
      theWeb3.eth.getBlockNumber(function(err, blockNumber) {
        if (!err) {
          log.debug('getBlockNumber successfully with result: ', blockNumber);
        } else {
          log.error("getBlockNumber", err);
        }
        callback(err, blockNumber);
      });
    } catch (err) {
      log.error("getBlockNumber", err);
      callback(err, blockNumber);
    }
  }

  getBlockNumberSync() {
    let log = this.log;
    let theWeb3 = this.theWeb3;

    return new Promise(function (resolve, reject) {
      try {
        theWeb3.eth.getBlockNumber(function(err, blockNumber) {
          if (err) {
            reject(err);
          } else {
            log.debug('getBlockNumber successfully with result: ', blockNumber);
            resolve(blockNumber);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  sendRawTransaction(signedTx, callback) {
    this.theWeb3.eth.sendRawTransaction(signedTx, callback);
  }

  sendRawTransactionSync(signedTx) {
    let log = this.log;
    let theWeb3 = this.theWeb3;
    return new Promise(function (resolve, reject) {
      try {
        theWeb3.eth.sendRawTransaction(signedTx, function(err, txHash) {
          if (err) {
            log.error("sendRawTransactionSync error: ", err);
            reject(err);
          } else{
            log.debug('sendRawTransaction successfully with signedTx: ', signedTx);
            resolve(txHash);
          }
        });
      } catch (err) {
        log.error("sendRawTransactionSync error: ", err);
        reject(err);
      }
    });
  }

  getTxInfo(txHash, callback) {
    this.theWeb3.eth.getTransaction(txHash, callback);
  }

  getBlockByNumber(blockNumber, callback) {
    this.theWeb3.eth.getBlock(blockNumber, callback);
  }

  getBlockByHash(blockHash, callback) {
    this.theWeb3.eth.getBlock(blockHash, callback);
  }

  getBlockTransactionCount(keyValue, callback) {
    this.theWeb3.eth.getBlockTransactionCount(keyValue, callback);
  }

  async getTransactionConfirm(txHash, waitBlocks, callback) {
    let log = this.log;
    let sleepTime = 30;

    let receipt = null;
    let curBlockNum = 0;

    try {
      receipt = await this.getTransactionReceiptSync(txHash);
      if (receipt.length !== null) {
        callback(null, receipt);
        return;
      }

      let numResult = await this.getBlockNumberSync();
      curBlockNum = numResult.blockNumber;
      let receiptBlockNumber = receipt.blockNumber;

      while (receiptBlockNumber + waitBlocks > curBlockNum) {
        log.info("getTransactionReceipt was called at block: ", receipt.blockNumber, 'curBlockNumber is ', curBlockNum, 'while ConfirmBlocks should after ', waitBlocks, ', wait some time to re-get');
        await sleep(sleepTime * 1000);
        receipt = await this.getTransactionReceiptSync(txHash);
        numResult = await this.getBlockNumberSync();
        curBlockNum = numResult.blockNumber;
        receiptBlockNumber = receipt.blockNumber;
      }
      callback(null, receipt);
    } catch (err) {
      callback(err, null);
    }
  }

  getTransactionConfirmSync(txHash, waitBlocks) {
    let log = this.log;
    let theWeb3 = this.theWeb3;
    let self = this;
    let receipt = null;
    let curBlockNum = 0;

    return new Promise(async function(resolve, reject) {
      try {
        receipt = await self.getTransactionReceiptSync(txHash);
        if (receipt === null) {
          resolve(receipt);
        }

        let numResult = await self.getBlockNumberSync();
        curBlockNum = numResult.blockNumber;
        let receiptBlockNumber = receipt.blockNumber;

        while (receiptBlockNumber + waitBlocks > curBlockNum) {
          log.info("getTransactionReceipt was called at block: ", receipt.blockNumber, 'curBlockNumber is ', curBlockNum, 'while ConfirmBlocks should after ', waitBlocks, ', wait some time to re-get');
          await sleep(sleepTime * 1000);
          receipt = await self.getTransactionReceiptSync(txHash);
          numResult = await self.getBlockNumberSync();
          curBlockNum = numResult.blockNumber;
          receiptBlockNumber = receipt.blockNumber;
        }
        resolve(receipt);
      } catch (err) {
        log.error(err);
        resolve(null);
      }
    })
  }

  getTransactionReceipt(txHash, callback) {
    this.theWeb3.eth.getTransactionReceipt(txHash, callback);
  }

  getTransactionReceiptSync(txHash) {
    let theWeb3 = this.theWeb3;

    return new Promise(function(resolve, reject) {
      theWeb3.eth.getTransactionReceipt(txHash, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    })
  }

}

module.exports = baseChain;
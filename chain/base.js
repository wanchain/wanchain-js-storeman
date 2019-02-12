const chainSCConfig = require('conf/moduleConfig.js');
const coder = require('web3/lib/solidity/coder');

function sleep(time) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve();
    }, time);
  })
}

class baseChain {
  constructor(log, theWeb3) {
    this.log = log;
    this.theWeb3 = theWeb3;
  }

  /**
   * Change all bigNumber fields in a json to string.
   * @param {object} json .
   * @param {number} num: 10 - Decimal; 16 - Hex
   */
  bigNumber2String(json, num) {
    for (let i in json) {
      if (json[i].constructor.name === 'BigNumber') {
        json[i] = json[i].toString(num);
      }
    }
  }

  /**
   * Should be used to encode plain param to topic
   *
   * @method encodeTopic
   * @param {String} type
   * @param {Object} param
   * @return {String} encoded plain param
   */
  encodeTopic(type, param) {
    return '0x' + coder.encodeParam(type, param);
  }

  getNetworkId() {
    let log = this.log;

    return new Promise((resolve, reject)=> {
      try {
        this.theWeb3.version.getNetwork((err, result) => {
          if(!err) {
            log.debug("getNetWork result is", result);
            resolve(result);
          } else {
            reject(err);
          }
        })
      } catch (err) {
        reject(err);
      };
    });
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

  getScEventSync(address, topics, fromBlk, toBlk, retryTimes = 0) {
    let baseChain = this;
    let times = 0;
    return new Promise(function(resolve, reject) {
      let filterValue = {
        fromBlock: fromBlk,
        toBlock: toBlk,
        topics: topics,
        address: address
      };
      let filter = baseChain.theWeb3.eth.filter(filterValue);
      let filterGet = function(filter) {
        filter.get(function(err, events) {
          if (err) {
            if (times >= retryTimes) {
              baseChain.log.error("getScEventSync", err);
              reject(err);
            } else {
              baseChain.log.debug("getScEventSync retry", times);
              // baseChain.log.error("getScEventSync retry", times, err);
              times++;
              filterGet(filter);
            }
          } else {
            resolve(events);
          }
        });
      }
      try{
        filterGet(filter);
      } catch(err) {
        baseChain.log.error("getScEventSync", err);
        reject(err);
      }

    });
  }

  getGasPrice(callback) {
    let log = this.log;
    let theWeb3 = this.theWeb3;
    let gasPrice = null;
    try {
      theWeb3.eth.getGasPrice(function(err, result) {
        if (!err) {
          gasPrice = result;
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
            gasPrice = result;
            log.debug('getGasPriceSync ', gasPrice, ' successfully');
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
            log.debug('getNonceSync ', nonce, ' successfully on address ', address);
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

  getNonceIncludePendingSync(address) {
    let log = this.log;
    let theWeb3 = this.theWeb3;
    let nonce = null;

    return new Promise(function (resolve, reject) {
      try {
        theWeb3.eth.getTransactionCount(address, 'pending', function(err, result) {
          if (err) {
            reject(err);
          } else {
            nonce = '0x' + result.toString(16);
            log.debug('getNonceIncludePendingSync ', nonce, ' successfully on address ', address);
            resolve(nonce);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
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
    let chainType = this.chainType;

    return new Promise(function (resolve, reject) {
      try {
        theWeb3.eth.getBlockNumber(function(err, blockNumber) {
          if (err) {
            reject(err);
          } else {
            log.debug('getBlockNumberSync successfully with result: ', chainType, blockNumber);
            resolve(blockNumber);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  sendRawTransaction(signedTx, callback) {
    this.log.debug("======================================== sendRawTransaction ====================================", this.chainType)
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
      if (receipt === null) {
        callback(null, receipt);
        return;
      }

      curBlockNum = await this.getBlockNumberSync();
      let receiptBlockNumber = receipt.blockNumber;

      while (receiptBlockNumber + waitBlocks > curBlockNum) {
        log.info("getTransactionReceipt was called at block: ", receipt.blockNumber, 'curBlockNumber is ', curBlockNum, 'while ConfirmBlocks should after ', waitBlocks, ', wait some time to re-get');
        await sleep(sleepTime * 1000);
        receipt = await this.getTransactionReceiptSync(txHash);
        curBlockNum = await this.getBlockNumberSync();
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
    let sleepTime = 30;

    return new Promise(async (resolve, reject) => {
      try {
        receipt = await self.getTransactionReceiptSync(txHash);
        if (receipt === null) {
          resolve(receipt);
          return;
        }

        curBlockNum = await self.getBlockNumberSync();
        let receiptBlockNumber = receipt.blockNumber;

        while (receiptBlockNumber + waitBlocks > curBlockNum) {
          log.info("getTransactionReceipt was called at block: ", receipt.blockNumber, 'curBlockNumber is ', curBlockNum, 'while ConfirmBlocks should after ', waitBlocks, ', wait some time to re-get');
          await sleep(sleepTime * 1000);
          receipt = await self.getTransactionReceiptSync(txHash);
          curBlockNum = await self.getBlockNumberSync();
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

  getSolInferface(abi, contractAddr, contractFunc) {
    let contract = this.theWeb3.eth.contract(abi);
    let conInstance = contract.at(contractAddr);
    return conInstance[contractFunc];
  }

  getSolVar(abi, contractAddr, varName) {
    let contract = this.theWeb3.eth.contract(abi);
    let conInstance = contract.at(contractAddr);
    return conInstance[varName];
  }

  getTokenBalance(address, tokenScAddr, abi, callback) {
    let log = this.log;
    try {
      let balanceOf = this.getSolInferface(abi, tokenScAddr, 'balanceOf');
      balanceOf(address, function(err, balance) {
        if (err) {
          log.debug('getTokenBalance at tokenScAddr', tokenScAddr, 'on address ', address, 'failed, and error is ', err);
          callback(err, null);
        } else {
          let tokenBalance = balance.toString();
          log.debug('getTokenBalance at tokenScAddr', tokenScAddr, 'on address ', address, 'the result is ',tokenBalance);
        }
        callback(null, tokenBalance);
      });
    } catch (err) {
      log.debug('getTokenBalance at tokenScAddr', tokenScAddr, 'on address ', address, 'failed, and error is ', err);
      callback(err, null);
    }
  }

  getTokenAllowance(tokenScAddr, owner, spender, abi) {
    return new Promise((resolve, reject) =>{
    let log = this.log;
    try {
      let allowance = this.getSolInferface(abi, tokenScAddr, 'allowance');
      allowance(owner, spender, function(err, allowance) {
        if (err) {
          log.debug('getTokenAllowance at tokenScAddr', tokenScAddr, 'with owner ', owner, 'spender', spender, 'failed, and error is ', err);
          reject(err);
        } else {
          let tokenAllowance = allowance.toString();
          log.debug('getTokenAllowance at tokenScAddr', tokenScAddr, 'with owner ', owner, 'spender', spender, 'the result is ',tokenAllowance);
          resolve(tokenAllowance);
        }
      });
    } catch (err) {
      log.debug('getTokenAllowance at tokenScAddr', tokenScAddr, 'with owner ', owner, 'spender', spender, 'failed, and error is ', err);
    }      
    });
  }

  getErc20Info(tokenScAddr) {
    let log = this.log;
    let self = this;
    let erc20Abi = chainSCConfig.erc20Abi;
    let symbol = 'symbol';
    let decimals = 'decimals';

    let token = {};
    token.tokenType = "ERC20";

    if (chainSCConfig.informalErc20.hasOwnProperty(tokenScAddr)) {
      let informalErc20 = chainSCConfig.informalErc20[tokenScAddr];
      if (informalErc20.hasOwnProperty('implementation')) {
        let implTokenScAddr = self.getSolVar(informalErc20.abi, tokenScAddr, informalErc20.implementation)();
        tokenScAddr = implTokenScAddr;
      } else {
        erc20Abi = informalErc20.abi;
        symbol = informalErc20.symbol;
        decimals = informalErc20.decimals;
      }
    }

    return new Promise((resolve, reject) => {
      try {
        token.tokenSymbol = self.getSolVar(erc20Abi, tokenScAddr, symbol)();
        token.decimals = self.getSolVar(erc20Abi, tokenScAddr, decimals)().toString(10);
        resolve(token);
      } catch (err) {
        if (err.hasOwnProperty("message") && (err.message === "new BigNumber() not a base 16 number: ")) {
          try {
            let unusualErc20Abi = chainSCConfig.unusualErc20Abi;
            token.tokenSymbol = self.theWeb3.toAscii(self.getSolVar(unusualErc20Abi, tokenScAddr, 'symbol')()).replace(/\u0000/g, '');
            token.decimals = self.getSolVar(erc20Abi, tokenScAddr, 'decimals')().toString(10);
            resolve(token);
          } catch (err) {
            log.error(err);
            reject(err);
          }
        } else {
          log.error(err);
          reject(err);
        }
      }
    });
  }

}

module.exports = baseChain;
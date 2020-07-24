const moduleConfig = require('conf/moduleConfig.js');
const coder = require('web3/lib/solidity/coder');
const TimeoutPromise = require('utils/timeoutPromise.js')
const Web3 = require("web3");
const Web3_v2 = require('web3_1.2');
const net = require('net');

function sleep(time) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve();
    }, time);
  })
}

class baseChain {
  constructor(log, nodeUrl) {
    this.log = log;
    this.nodeUrl = nodeUrl;
    this.setChainType();
    this.getConfig();
    this.client = this.getClient(nodeUrl);
  }

  getConfig() {
    this.safe_block_num = (moduleConfig.crossInfoDict[this.chainType] && moduleConfig.crossInfoDict[this.chainType].CONF.SAFE_BLOCK_NUM)
    ? moduleConfig.crossInfoDict[this.chainType].CONF.SAFE_BLOCK_NUM
    : moduleConfig.SAFE_BLOCK_NUM;
    this.confirm_block_num = (moduleConfig.crossInfoDict[this.chainType] && moduleConfig.crossInfoDict[this.chainType].CONF.CONFIRM_BLOCK_NUM)
    ? moduleConfig.crossInfoDict[this.chainType].CONF.CONFIRM_BLOCK_NUM
    : moduleConfig.CONFIRM_BLOCK_NUM;
    this.checkIrreversible = (moduleConfig.crossInfoDict[this.chainType] && moduleConfig.crossInfoDict[this.chainType].CONF.checkIrreversible)
    ? moduleConfig.crossInfoDict[this.chainType].CONF.checkIrreversible
    : false;
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

  getClient(nodeUrl) {
    if (nodeUrl.indexOf("http://") !== -1) {
      return new Web3(new Web3.providers.HttpProvider(nodeUrl));
    } else {
      return new Web3(new Web3.providers.IpcProvider(nodeUrl, net));
    }
  }

  getClientV2(nodeUrl) {
    if (nodeUrl.indexOf("http://") !== -1) {
      return new Web3_v2(new Web3_v2.providers.HttpProvider(nodeUrl));
    } else {
      return new Web3_v2(new Web3_v2.providers.IpcProvider(nodeUrl, net));
    }
  }

  getNetworkId() {
    let log = this.log;
    let chainType = this.chainType;

    return new TimeoutPromise((resolve, reject)=> {
      try {
        this.client.version.getNetwork((err, result) => {
          if(!err) {
            log.debug("ChainType:", chainType, "getNetWork result is", result);
            resolve(result);
          } else {
            reject(err);
          }
        })
      } catch (err) {
        reject(err);
      };
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getNetworkId timeout');
  }

  getScEvent(address, topics, fromBlk = 0, toBlk = 'latest', retryTimes = 0, callback) {
    let baseChain = this;
    let chainType = this.chainType;
    let times = 0;

    let filterValue = {
      fromBlock: fromBlk,
      toBlock: toBlk,
      topics: topics,
      address: address
    };
    let filter = this.client.eth.filter(filterValue);
    let filterGet = function (filter) {
      filter.get(function (err, events) {
        if (err) {
          if (times >= retryTimes) {
            baseChain.log.error("ChainType:", chainType, "getScEvent", err);
            callback(err, events);
          } else {
            baseChain.log.debug("ChainType:", chainType, "getScEvent retry", times);
            times++;
            filterGet(filter);
          }
        } else {
          callback(err, events);
        }
      });
    }
    try {
      filterGet(filter);
    } catch (err) {
      baseChain.log.error("ChainType:", chainType, "getScEvent", err);
      callback(err, null);
    }
  }

  getScEventSync(address, topics, fromBlk = 0, toBlk = 'latest', retryTimes = 0) {
    let baseChain = this;
    let chainType = this.chainType;
    let times = 0;

    return new TimeoutPromise(function (resolve, reject) {
      let filterValue = {
        fromBlock: fromBlk,
        toBlock: toBlk,
        topics: topics,
        address: address
      };
      let filter = baseChain.client.eth.filter(filterValue);
      let filterGet = function (filter) {
        filter.get(function (err, events) {
          if (err) {
            if (times >= retryTimes) {
              baseChain.log.error("ChainType:", chainType, "getScEventSync", err);
              reject(err);
            } else {
              baseChain.log.debug("ChainType:", chainType, "getScEventSync retry", times);
              // baseChain.log.error("getScEventSync retry", times, err);
              times++;
              filterGet(filter);
            }
          } else {
            resolve(events);
          }
        });
      }
      try {
        filterGet(filter);
      } catch (err) {
        baseChain.log.error("ChainType:", chainType, "getScEventSync", err);
        reject(err);
      }

    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getScEventSync timeout');
  }

  getGasPrice(callback) {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;
    let gasPrice = null;
    try {
      client.eth.getGasPrice(function(err, result) {
        if (!err) {
          gasPrice = result;
          log.debug("ChainType:", chainType, 'getGasPrice ', gasPrice, ' successfully');
        }
        callback(err, gasPrice);
      });
    } catch (err) {
      callback(err, gasPrice);
    }
  }

  getGasPriceSync() {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;
    let gasPrice = null;

    return new TimeoutPromise(function (resolve, reject) {
      try {
        client.eth.getGasPrice(function(err, result) {
          if (err) {
            reject(err);
          } else {
            gasPrice = result;
            log.debug("ChainType:", chainType, 'getGasPriceSync ', gasPrice, ' successfully');
            resolve(gasPrice);
          }
        });
      } catch (err) {
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getGasPriceSync timeout');
  }

  getNonce(address, callback) {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;
    let nonce = null;
    try {
      client.eth.getTransactionCount(address, function(err, result) {
        if (!err) {
          nonce = '0x' + result.toString(16);
          log.debug("ChainType:", chainType, 'getNonce ', result, nonce, ' successfully on address ', address);
        }
        callback(err, nonce);
      });
    } catch (err) {
      callback(err, nonce);
    }
  }

  getNonceSync(address) {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;
    let nonce = null;

    return new TimeoutPromise(function (resolve, reject) {
      try {
        client.eth.getTransactionCount(address, function(err, result) {
          if (err) {
            reject(err);
          } else {
            nonce = '0x' + result.toString(16);
            log.debug("ChainType:", chainType, 'getNonceSync ', result, nonce, ' successfully on address ', address);
            resolve(nonce);
          }
        });
      } catch (err) {
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getNonceSync timeout');
  }

  getNonceIncludePending(address, optional, callback) {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;
    let nonce = null;

    try {
      client.eth.getTransactionCount(address, optional, function(err, result) {
        if (!err) {
          nonce = '0x' + result.toString(16);
          log.debug("ChainType:", chainType, 'getNonceIncludePending ', result, nonce, ' successfully on address ', address);
        }
        callback(err, nonce);
      });
    } catch (err) {
      callback(err, nonce);
    }
  }

  getNonceIncludePendingSync(address) {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;
    let nonce = null;

    return new TimeoutPromise(function (resolve, reject) {
      try {
        client.eth.getTransactionCount(address, 'pending', function(err, result) {
          if (err) {
            reject(err);
          } else {
            nonce = '0x' + result.toString(16);
            log.debug("ChainType:", chainType, 'getNonceIncludePendingSync ', result, nonce, ' successfully on address ', address);
            resolve(nonce);
          }
        });
      } catch (err) {
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getNonceIncludePendingSync timeout');
  }

  getBlockNumber(callback) {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;
    let blockNumber = null;
    try {
      client.eth.getBlockNumber(function(err, blockNumber) {
        if (!err) {
          log.debug("ChainType:", chainType, 'getBlockNumber successfully with result: ', blockNumber);
        } else {
          log.error("ChainType:", chainType, "getBlockNumber", err);
        }
        callback(err, blockNumber);
      });
    } catch (err) {
      log.error("ChainType:", chainType, "getBlockNumber", err);
      callback(err, blockNumber);
    }
  }

  getBlockNumberSync() {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;

    return new TimeoutPromise(function (resolve, reject) {
      try {
        client.eth.getBlockNumber(function(err, blockNumber) {
          if (err) {
            reject(err);
          } else {
            log.debug("ChainType:", chainType, 'getBlockNumberSync successfully with result: ', blockNumber);
            resolve(blockNumber);
          }
        });
      } catch (err) {
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getBlockNumberSync timeout');
  }

  sendRawTransaction(signedTx, callback) {
    this.log.debug("======================================== sendRawTransaction ====================================", this.chainType)
    this.client.eth.sendRawTransaction(signedTx, callback);
  }

  sendRawTransactionSync(signedTx) {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;
    return new TimeoutPromise(function (resolve, reject) {
      try {
        client.eth.sendRawTransaction(signedTx, function(err, txHash) {
          if (err) {
            log.error("ChainType:", chainType, "sendRawTransactionSync error: ", err);
            reject(err);
          } else{
            log.debug("ChainType:", chainType, 'sendRawTransactionSync successfully with signedTx: ', signedTx);
            resolve(txHash);
          }
        });
      } catch (err) {
        log.error("ChainType:", chainType, "sendRawTransactionSync error: ", err);
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' sendRawTransactionSync timeout');
  }

  getTxInfo(txHash, callback) {
    this.client.eth.getTransaction(txHash, callback);
  }

  getBlockByNumber(blockNumber, callback) {
    this.client.eth.getBlock(blockNumber, callback);
  }

  getBlockByNumberSync(blockNumber) {
    // let log = this.log;
    let client = this.client;
    let chainType = this.chainType;

    return new TimeoutPromise(function (resolve, reject) {
      try {
        client.eth.getBlock(blockNumber, function(err, result) {
          if (err) {
            reject(err);
          } else {
            // log.debug("ChainType:", chainType, 'getBlockByNumberSync successfully with result: ', result);
            resolve(result);
          }
        });
      } catch (err) {
        reject(err);
      }
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getBlockByNumberSync timeout');
  }

  getBlockByHash(blockHash, callback) {
    this.client.eth.getBlock(blockHash, callback);
  }

  getBlockTransactionCount(keyValue, callback) {
    this.client.eth.getBlockTransactionCount(keyValue, callback);
  }

  async getTransactionConfirm(txHash, waitBlocks, callback) {
    let log = this.log;
    let sleepTime = 30;
    let chainType = this.chainType;
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
        log.debug("ChainType:", chainType, "getTransactionReceipt was called at block: ", receipt.blockNumber, 'curBlockNumber is ', curBlockNum, 'while ConfirmBlocks should after ', waitBlocks, ', wait some time to re-get');
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

  getTransactionConfirmSync(txHash, waitBlocks, block_num) {
    let log = this.log;
    let client = this.client;
    let chainType = this.chainType;
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
        let receiptBlockNumber = receipt.blockNumber;

        while (receiptBlockNumber + waitBlocks > curBlockNum) {
          log.debug("ChainType:", chainType, "getTransactionReceipt was called at block: ", receipt.blockNumber, 'curBlockNumber is ', curBlockNum, 'while ConfirmBlocks should after ', waitBlocks, ', wait some time to re-get');
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
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getTransactionConfirmSync timeout')
  }

  getTransactionReceipt(txHash, callback) {
    this.client.eth.getTransactionReceipt(txHash, callback);
  }

  getTransactionReceiptSync(txHash) {
    let client = this.client;
    let chainType = this.chainType;

    return new TimeoutPromise(function(resolve, reject) {
      client.eth.getTransactionReceipt(txHash, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getTransactionReceiptSync timeout')
  }

  getSolInferface(abi, contractAddr, contractFunc) {
    let contract = this.client.eth.contract(abi);
    let conInstance = contract.at(contractAddr);
    return conInstance[contractFunc];
  }

  getSolInterfaceV2(abi, contractAddr, contractFunc) {
    let clientV2 = this.getClientV2(this.nodeUrl);
    let contract = new clientV2.eth.Contract(abi, contractAddr);
    return contract.methods[contractFunc];
  }

  getSolVar(abi, contractAddr, varName) {
    let contract = this.client.eth.contract(abi);
    let conInstance = contract.at(contractAddr);
    return conInstance[varName];
  }

  getTokenBalance(address, tokenScAddr, abi, callback) {
    let log = this.log;
    let chainType = this.chainType;
    try {
      let balanceOf = this.getSolInferface(abi, tokenScAddr, 'balanceOf');
      balanceOf(address, function(err, balance) {
        if (err) {
          log.debug("ChainType:", chainType, 'getTokenBalance at tokenScAddr', tokenScAddr, 'on address ', address, 'failed, and error is ', err);
          callback(err, null);
        } else {
          let tokenBalance = balance.toString();
          log.debug("ChainType:", chainType, 'getTokenBalance at tokenScAddr', tokenScAddr, 'on address ', address, 'the result is ',tokenBalance);
        }
        callback(null, tokenBalance);
      });
    } catch (err) {
      log.debug("ChainType:", chainType, 'getTokenBalance at tokenScAddr', tokenScAddr, 'on address ', address, 'failed, and error is ', err);
      callback(err, null);
    }
  }

  getTokenAllowance(tokenScAddr, owner, spender, abi) {
    let chainType = this.chainType;
    return new TimeoutPromise((resolve, reject) =>{
    let log = this.log;
    try {
      let allowance = this.getSolInferface(abi, tokenScAddr, 'allowance');
      allowance(owner, spender, function(err, allowance) {
        if (err) {
          log.debug("ChainType:", chainType, 'getTokenAllowance at tokenScAddr', tokenScAddr, 'with owner ', owner, 'spender', spender, 'failed, and error is ', err);
          reject(err);
        } else {
          let tokenAllowance = allowance.toString();
          log.debug("ChainType:", chainType, 'getTokenAllowance at tokenScAddr', tokenScAddr, 'with owner ', owner, 'spender', spender, 'the result is ',tokenAllowance);
          resolve(tokenAllowance);
        }
      });
    } catch (err) {
      log.debug("ChainType:", chainType, 'getTokenAllowance at tokenScAddr', tokenScAddr, 'with owner ', owner, 'spender', spender, 'failed, and error is ', err);
      reject(err);
    }      
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getTokenAllowance timeout');
  }

  getTokenInfo(tokenScAddr) {
    let log = this.log;
    let self = this;
    let chainType = this.chainType;
    let tokenAbi = moduleConfig.tokenAbi;
    let symbol = 'symbol';
    let decimals = 'decimals';

    let token = {};
    token.tokenType = "TOKEN";

    return new TimeoutPromise((resolve, reject) => {
      try {

        if (moduleConfig.informalToken.hasOwnProperty(tokenScAddr)) {
          let informalToken = moduleConfig.informalToken[tokenScAddr];
          if (informalToken.hasOwnProperty('implementation')) {
            let implTokenScAddr = self.getSolVar(informalToken.abi, tokenScAddr, informalToken.implementation)();
            tokenScAddr = implTokenScAddr;
          } else {
            tokenAbi = informalToken.abi;
            symbol = informalToken.symbol;
            decimals = informalToken.decimals;
          }
        }

        token.tokenSymbol = self.getSolVar(tokenAbi, tokenScAddr, symbol)();
        token.decimals = self.getSolVar(tokenAbi, tokenScAddr, decimals)().toString(10);
        resolve(token);
      } catch (err) {
        if (err.hasOwnProperty("message") && (err.message === "new BigNumber() not a base 16 number: ")) {
          try {
            let unusualTokenAbi = moduleConfig.unusualTokenAbi;
            token.tokenSymbol = self.client.toAscii(self.getSolVar(unusualTokenAbi, tokenScAddr, 'symbol')()).replace(/\u0000/g, '');
            token.decimals = self.getSolVar(tokenAbi, tokenScAddr, 'decimals')().toString(10);
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
    }, moduleConfig.promiseTimeout, "ChainType: " + chainType + ' getTokenInfo timeout');
  }

  checkTransIrreversibleSync(txHash) {
    return true;
  }

}

module.exports = baseChain;
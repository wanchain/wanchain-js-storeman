"use strict";

const fs = require('fs');
const solc = require('solc');
let Web3 = require('web3');
let web3 = new Web3(null);
// let SolidityEvent = require("web3/lib/web3/event.js");
// let SolidityFunction = require("web3/lib/web3/function.js");
let wanUtil = require('wanchain-util');

module.exports = class Contract {
  constructor(abi, contractAddr) {
    this.abi = abi;
    if (contractAddr) {
      this.setContractAddr(contractAddr);
    }
  }

  setContractAddr(contractAddr) {
    if (/^0x[0-9a-f]{40}$/i.test(contractAddr)) {
      this.contractAddr = contractAddr;
    }
  }

  compileSol(tokenFile) {
    let content = fs.readFileSync(tokenFile, 'utf8');
    return solc.compile(content, 1);
  }

  getAbiFromSol(compileSol, tokenName) {
    return JSON.parse(compileSol.contracts[':' + tokenName].interface);
  }

  setAbiFromFile(tokenFile, tokenName) {
    let compilesol = this.compileSol(tokenFile);
    this.abi = this.getAbiFromSol(compilesol, tokenName);
  }

  getSolInferface(contractFunc) {
    let contract = web3.eth.contract(this.abi);
    let conInstance = contract.at(this.contractAddr);
    return conInstance[contractFunc];
  }

  getcommandString(funcName) {
    for (var i = 0; i < this.abi.length; ++i) {
      let item = this.abi[i];
      if (item.name == funcName) {
        let command = funcName + '(';
        for (var j = 0; j < item.inputs.length; ++j) {
          if (j != 0) {
            command = command + ',';
          }
          command = command + item.inputs[j].type;
        }
        command = command + ')';
        return command;
      }
    }
  }

  commandSha3(command) {
    return wanUtil.sha3(command, 256);
  }

  getFuncSignature(funcName) {
    return this.commandSha3(this.getcommandString(funcName)).slice(0, 4).toString('hex');
  }
  getEventSignature(funcName) {
    return '0x' + this.commandSha3(this.getcommandString(funcName)).toString('hex');
  }

  // getFuncSignature(funcName) {
  //   return this.abi.filter((json) => {
  //     return json.type === 'funciton' && json.name === funcName;
  //   }).map((json) => {
  //     return new SolidityFunction(null, json, null);
  //   }).map((func) => {
  //     return func.signature();
  //   })
  // }

  // getEventSignature(eventName) {
  //   return this.abi.filter((json) => {
  //     return json.type === 'event' && json.name === eventName;
  //   }).map((json) => {
  //     return new SolidityEvent(null, json, null);
  //   }).map((event) => {
  //     return event.signature();
  //   })
  // }


  parseEvent(log) {

  }

  constructData(funcName, ...para) {
    let funcInterface = this.getSolInferface(funcName);

    if (funcInterface) {
      return funcInterface.getData(...para);
    } else {
      return null;
    }
  }
}
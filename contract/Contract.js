"use strict";

const fs = require('fs');
const solc = require('solc');
let Web3 = require('web3');
let web3 = new Web3(null);
let SolidityEvent = require("web3/lib/web3/event.js");
let SolidityFunction = require("web3/lib/web3/function.js");

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

  getFuncSignature(funcName) {
    return this.abi.filter((json) => {
      return json.type === 'funciton' && json.name === funcName;
    }).map((json) => {
      return new SolidityFunction(null, json, null);
    }).map((func) => {
      return func.signature();
    })
  }

  getEventSignature(eventName) {
    return this.abi.filter((json) => {
      return json.type === 'event' && json.name === eventName;
    }).map((json) => {
      return new SolidityFunction(null, json, null);
    }).map((event) => {
      return event.signature();
    })
  }

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
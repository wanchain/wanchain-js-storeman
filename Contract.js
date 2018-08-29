"use strict";

const fs = require('fs');
const solc = require('solc');
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

  getAbiFromSol(compileSol, tokenName){
  	return JSON.parse(compileSol.contracts[':'+tokenName].interface);
  }

  setAbiFromFile(tokenFile, tokenName) {
  	let compilesol = this.compileSol(tokenFile);
  	this.abi = this.getAbiFromSol(compilesol, tokenName);
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

  parseData(trans) {

  }

  constructData(funcName, para...) {

  }

  
}
"use strict";

const fs = require('fs');
const solc = require('solc');

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

  
}
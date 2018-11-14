"use strict";

const solc = require('solc');
let Web3 = require('web3');
let web3 = new Web3(null);
let SolidityEvent = require("web3/lib/web3/event.js");
let SolidityFunction = require("web3/lib/web3/function.js");
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
      return new SolidityEvent(null, json, null);
    }).map((event) => {
      return event.signature();
    })
  }

  parseEvents(events) {
    if (events === null || !Array.isArray(events)) {
      return events;
    }
    return events.map((event) => {
      return this.parseEvent(event);
    });
  }

  parseEvent(event) {
    if (event === null) {
      return event;
    }
    let decoders = this.abi.filter((json) => {
      return json.type === 'event';
    }).map((json) => {
      // note first and third params only required only by enocde and execute;
      // so don't call those!
      return new SolidityEvent(null, json, null);
    });
    let decoder = decoders.find((decoder) => {
      return (decoder.signature() === event.topics[0].replace("0x", ""));
    });
    if (decoder) {
      return decoder.decode(event);
    } else {
      return null;
    }
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
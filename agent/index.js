"use strict"

const EthAgent = require("../EthAgent.js");
const EosAgent = require("../EosAgent.js");
const WanAgent = require("../WanAgent.js");

global.agentDict = {
  ETH: EthAgent,
  EOS: EosAgent,
  WAN: WanAgent
}


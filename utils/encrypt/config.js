'use strict'

const config = {
  chainMap: new Map([
    ["eth", {version: 0x01, id: 0x0001, accountFormat: "hex", accountPrefix: "0x"}],
    ["btc", {version: 0x01, id: 0x0002, accountFormat: "ascii", accountPrefix: ""}],
    ["eos", {version: 0x01, id: 0x0003, accountFormat: "ascii", accountPrefix: ""}],
  ]),   
  formatSet: new Set([
    "hex",
    "ascii",
  ]),
};

module.exports = config;
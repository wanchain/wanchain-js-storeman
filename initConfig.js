"use strict"

const moduleConfig = require('conf/moduleConfig.js');
let configJson = require('conf/config.json');
let config = moduleConfig.testnet?configJson.testnet:configJson.main;

const {
  initConfig
} = require('comm/lib');

async function init() {
  let paras = process.argv.splice(2);
  if (paras.length === 2) {
    try {
      let crossTokens = await initConfig(...paras);
      if (crossTokens === null) {
        console.log("Couldn't find any tokens that the storeman is in charge of. ", paras);
        process.exit();
      }
      console.log(crossTokens);
    } catch (err) {
      console.log("Storeman agent init error, plz check the paras and try again.", err);
      process.exit();
    }
  } else {
    if (Object.keys(config["crossTokens"]).length === 0) {
      console.log("storeman agent should be initialized with storemanWanAddr storemanEthAddr at the first time!");
      process.exit();
    }
  }
}

init();
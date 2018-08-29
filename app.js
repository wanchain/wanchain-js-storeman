"use strict"

async function syncMain(logger, db) {
  // let modelOps = new ModelOps(logger, db);
  let ethBlockNumber, wanBlockNumber;


  while (1) {
    let topics = [];
    let events;

    try {
      ethBlockNumber = await modelOps.getScannedBlockNumberSync('eth');
      if (ethBlockNumber > SAFE_BLOCK_NUM){
        ethBlockNumber -= SAFE_BLOCK_NUM;
      }
      else {
        ethBlockNumber = 0;
      }

      wanBlockNumber = await modelOps.getScannedBlockNumberSync('wan');
      if (wanBlockNumber > SAFE_BLOCK_NUM){
        wanBlockNumber -= SAFE_BLOCK_NUM;
      }
      else {
        wanBlockNumber = 0;
      }
    } catch(err) {
      logger.error(err);
      continue;
    }
    let chainType = 'eth';
    let chain = getChain(chainType);
    let from = ethBlockNumber;
    let scAddr = origenCrossContract.contractAddr;
    let curBlock;

    try {
      curBlock = await chain.getBlockNumberSync();
      logger.info("Current block is:", curBlock);
    } catch(err) {
      logger.error("getBlockNumberSync from ethereum:", err);
    }

    if (curBlock > CONFIRM_BLOCK_NUM) {
      let to = curBlock - CONFIRM_BLOCK_NUM;
      try {
        events = await getScEvents(logger, chain, scAddr, topics, from, to);
        console.log("events: ", events.length);
        await splitEvent('eth', events);
        console.log("********************************** saveEthState **********************************");
        modelOps.saveScannedBlockNumber(chainType, to);
      } catch(err) {
        logger.error("getScEvents from ethereum:", err);
      }
    }

    chainType = 'wan';
    chain = getChain(chainType);
    from = wanBlockNumber;
    scAddr = destCrossContract.contractAddr;

    try {
      curBlock = await chain.getBlockNumberSync();
    } catch(err) {
      logger.error("getBlockNumberSync from wanchain:", err);
    }
    if (curBlock > CONFIRM_BLOCK_NUM) {
      let to = curBlock - CONFIRM_BLOCK_NUM;
      try {
        events = await getScEvents(logger, chain, scAddr, topics, from, to);
        console.log("events: ", events.length);
        await splitEvent('wan', events);
        modelOps.saveScannedBlockNumber(chainType, to);
        console.log("********************************** saveWanState **********************************");
      } catch(err) {
        logger.error("getScEvents from wanchain:", err);
      }
    }

    await sleep(INTERVAL_TIME);
  }
}
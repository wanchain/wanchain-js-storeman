"use strict"

function monitorRecord(record) {
  let StateAction;
  // debt and withdraw will use leader-monitor and follower-apply mode
  if (record.isDebt) {
    if (tokenList.storemanAddress.includes(record.storeman)) {
      StateAction = NormalCross;
    } else {
      StateAction = Debt;
    }
  } else if (record.isFee) {
    StateAction = WithdrawFee;
  } else {
    StateAction = NormalCross;
  }

  let stateAction = new StateAction(record, global.monitorLogger, db);
  stateAction.takeAction()
    .then(result => {
      if (handlingList[record.hashX]) {
        monitorLogger.debug("handlingList delete already handled hashX", record.hashX);
        delete handlingList[record.hashX];
      }
    })
    .catch(err => global.monitorLogger.error(err));
}

async function handlerMain(logger, modelOps) {
  while (1) {
    logger.info("********************************** handlerMain start **********************************");

    while (global.configMutex || !firstSyncDone) {
      // await sleep(3);
      await sleep(moduleConfig.INTERVAL_TIME);
      continue;
    }

    try {
      let htlcAddrFilter = tokenList.wanchainHtlcAddr.concat(tokenList.originalChainHtlcAddr);
      let option = {
        tokenAddr: {
          $in: [...tokenList.supportTokenAddrs]
        },
        toHtlcAddr: {
          $in: [...htlcAddrFilter]
        },
        hashX: {
          $nin: Object.keys(handlingList)
        },
        // storeman: {
        //   $in: tokenList.storemanAddress
        // }
      }
      if (global.storemanRestart) {
        option.status = {
          $nin: ['redeemFinished', 'revokeFinished', 'withdrawFeeFinished', 'transIgnored', 'fundLostFinished']
        }
        global.storemanRestart = false;
      } else {
        option.status = {
          $nin: ['redeemFinished', 'revokeFinished', 'withdrawFeeFinished', 'transIgnored', 'fundLostFinished', 'interventionPending']
        }
      }
      if (!global.argv.doDebt) {
        option.storeman = {
          $in: tokenList.storemanAddress
        }
      }

      let history = await modelOps.getEventHistory(option);
      logger.debug('history length is ', history.length);
      logger.debug('handlingList length is ', Object.keys(handlingList).length);

      for (let i = 0; i < history.length; i++) {
        let record = history[i];

        let cur = Date.now();
        if (handlingList[record.hashX]) {
          continue;
        }
        handlingList[record.hashX] = cur;

        try {
          monitorRecord(record);
        } catch (error) {
          logger.error("monitorRecord error:", error);
        }
      }
    } catch (err) {
      logger.error("handlerMain error:", error);
    }
    await sleep(moduleConfig.INTERVAL_TIME);
  }
}
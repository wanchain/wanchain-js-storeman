const wanchain = require('./utils/wanchain');
const Logger = require('../../../comm/logger.js');

const logger = new Logger("osm-" + global.argv.c, "log/osm.log", "log/osm_error.log", global.argv.loglevel);

const GroupStatus = {
  none:0, 
  initial:1,
  curveSeted:2, 
  failed:3,
  selected:4,
  ready:5,
  unregistered:6, 
  dismissed:7,
}

const INVALID_GROUP_ID = '0x0000000000000000000000000000000000000000000000000000000000000000';

const wkAddr = wanchain.selfAddress;

let lastIncentivedDay = 0;
let incentiveTxHash = '';

async function sleep(time) {
	return new Promise(function (resolve, reject) {
			setTimeout(function () {
					resolve();
			}, time);
	});
};

async function handlerOpenStoremanIncentive(wkaddr){
  let curDay = parseInt(Date.now()/1000/60/60/24);
  if (curDay == lastIncentivedDay) {
    return true;
  }
  if (!incentiveTxHash) {
    incentiveTxHash = await wanchain.sendToIncentive(wkaddr)
    logger.info(arguments.callee.name + " txhash:", incentiveTxHash);
    return false;
  } else {
    let receipt = await wanchain.getTxReceipt(incentiveTxHash, 'osm incentive');
    if (!receipt) {
      logger.info("osm incentive receipt none");
      return false;
    } else if (!receipt.status) {
      logger.info("osm incentive %s receipt error: %O", incentiveTxHash, receipt);
      incentiveTxHash = '';
      return true;
    } else {
      incentiveTxHash = '';
      if (receipt.logs[0].topics[3] == 1) {
        logger.info("osm incentive end");
        lastIncentivedDay = curDay;
        return true;
      } else {
        return false;
      }
    }
  }
}

async function handlerOpenStoremanStatus(group){
  let cur = parseInt(Date.now()/1000);
  switch (parseInt(group.status)) {
    case GroupStatus.curveSeted: // toselect.
      if (wkAddr == group.selectedNode[0]) { // is Leader
        let selectTime = parseInt(group.registerTime) + parseInt(group.registerDuration);
        if (cur > selectTime){
          let txHash = await wanchain.sendToSelect(group.groupId);
          logger.info("osm select txHash: %s", txHash);
        }
      }
      break;
    case GroupStatus.ready:  // to unregister
      if(wkAddr == group.selectedNode[0]){ // is Leader
        if(cur > group.endTime){
          // await wanchain.sendUnregister(group.groupId);
        }
      }
      break;
    case GroupStatus.unregistered:  // TODO: 可能不需要处理. 平账后, 直接标志为dismissed
      if (wkAddr == group.selectedNode[0]) { // is Leader
        let dismissTime = parseInt(group.workTime) + parseInt(group.totalTime)
        if (cur > dismissTime) {
          // await wanchain.sendToSelect(group.groupId);
        }
      }
	    // storemanGroupDismiss
      break;
    default:
      // just ignore
      break;
  }
}

async function handlerOpenStoreman() {
  await wanchain.updateNounce();
  while (1) {
    logger.info("********************************** handlerOpenStoreman start **********************************");
    let incentiveDone = false;
    try {
      let sk = await wanchain.getSkbyAddr(wkAddr);
      if (sk.groupId) {
        incentiveDone = await handlerOpenStoremanIncentive(wkAddr);
        let group = await wanchain.getGroupById(sk.groupId);
        await handlerOpenStoremanStatus(group);
      }
      if (sk.nextGroupId != INVALID_GROUP_ID) {
        let groupNext = await wanchain.getGroupById(sk.nextGroupId);
        await handlerOpenStoremanStatus(groupNext);
      }
    } catch(err) {
      logger.error("handlerOpenStoreman error:", err);
    }
    let sleepSec = incentiveDone? 60 : 5;
    await sleep(sleepSec * 1000);
  }
}

module.exports = {
  GroupStatus,
  handlerOpenStoreman
}

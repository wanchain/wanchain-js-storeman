const config = require('../cfg/config');
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

const smgSc = wanchain.getContract('smg', config.contractAddress.smg);

async function sleep(time) {
	return new Promise(function (resolve, reject) {
			setTimeout(function () {
					resolve();
			}, time);
	});
};

async function handlerOpenStoremanIncentive(groupId){
  let curDay = parseInt(Date.now()/1000/60/60/24);
  if (curDay == lastIncentivedDay) {
    return true;
  }
  if (!incentiveTxHash) {
    incentiveTxHash = await wanchain.sendToIncentive(wkAddr)
    logger.info("osm incentive group %s day %d txhash: %s", groupId, lastIncentivedDay, incentiveTxHash);
    return false;
  } else {
    let receipt = await wanchain.getTxReceipt(incentiveTxHash, 'osm incentive');
    if (!receipt) {
      // logger.info("osm incentive wait receipt");
      return false;
    } else if (!receipt.status) {
      logger.error("osm incentive group %s day %d txhash %s receipt error: %O", groupId, lastIncentivedDay, incentiveTxHash, receipt);
      incentiveTxHash = '';
      return true;
    } else {
      incentiveTxHash = '';
      if (receipt.logs[0].topics[3] == 1) {
        lastIncentivedDay = curDay;
        logger.info("osm incentive group %s finish day %d", groupId, lastIncentivedDay);
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
        if (cur > selectTime) {
          let txHash = await wanchain.sendToSelect(group.groupId);
          logger.info("osm group %s select txHash: %s", group.groupId, txHash);
        }
      }
      break;
    case GroupStatus.ready:  // to unregister
      if (wkAddr == group.selectedNode[0]){ // is Leader
        if (cur > group.endTime) {
          let txHash = await wanchain.sendToUnregister(group.groupId);
          logger.info("osm group %s unregister txHash: %s", group.groupId, txHash);
        }
      }
      break;
    case GroupStatus.unregistered:  // TODO: 可能不需要处理. 平账后, 直接标志为dismissed
      if (wkAddr == group.selectedNode[0]) { // is Leader
        let dismissable = await smgSc.methods.checkGroupDismissable(group.groupId).call();
        if (dismissable) {
          let txHash = await wanchain.sendToDismiss(group.groupId);
          logger.info("osm group %s dismiss txHash: %s", group.groupId, txHash);
        }
      }
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
    let incentiveDone = true;
    try {
      let sk = await wanchain.getSkbyAddr(wkAddr);
      logger.info("%s sk info:", wkAddr, sk);
      if (sk.groupId != INVALID_GROUP_ID) {
        let group = await wanchain.getGroupById(sk.groupId);
        logger.info("group info:", group);
        if ((group.status >= GroupStatus.ready) && (group.selectedNode.indexOf(wkAddr) >= 0)) {
          incentiveDone = await handlerOpenStoremanIncentive(sk.groupId, wkAddr);
        }
        await handlerOpenStoremanStatus(group);
      }
      if (sk.nextGroupId != INVALID_GROUP_ID) {
        let groupNext = await wanchain.getGroupById(sk.nextGroupId);
        logger.info("next group info:", groupNext);
        await handlerOpenStoremanStatus(groupNext);
      }
    } catch(err) {
      logger.error("handlerOpenStoreman error:", err);
    }
    let sleepSec = incentiveDone? 60 : 10;
    await sleep(sleepSec * 1000);
  }
}

module.exports = {
  GroupStatus,
  handlerOpenStoreman
}

const wanchain = require('./utils/wanchain');
const Logger = require('../../../comm/logger.js');

const logger = new Logger("openStoreman-" + global.argv.c, "log/openStoreman.log", "log/openStoreman_error.log", global.argv.loglevel);

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

async function sleep(time) {
	return new Promise(function (resolve, reject) {
			setTimeout(function () {
					resolve();
			}, time);
	});
};

async function handlerOpenStoremanIncentive(wkaddr){
  let curDay = Date.now()/1000/60/60/24;
  if(curDay == lastIncentivedDay){
    return;
  }
  while(1){
    let txhash = await wanchain.sendToIncentive(wkaddr)
    logger.info(arguments.callee.name+" txhash:", txhash);
    let receipt = await wanchain.getTxReceipt(txhash, arguments.callee.name)
    if(!receipt || !receipt.logs || receipt.logs.topics[3]==1){
      lastIncentivedDay = curDay;
      break;
    }
  }
}

async function handlerOpenStoremanStatus(group){
  let cur = parseInt(Date.now()/1000);
  switch(parseInt(group.status)){
    case GroupStatus.curveSeted: // toselect.
      if(wkAddr == group.selectedNode[0]){ // is Leader
        let selectTime = parseInt(group.registerTime) + parseInt(group.registerDuration);
        if(cur > selectTime){
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
      if(wkAddr == group.selectedNode[0]){ // is Leader
        if(cur > group.registerTime+group.registerDuration){
          await wanchain.sendToSelect(group.groupId);
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
    try {
      let sk = await wanchain.getSkbyAddr(wkAddr);
      if (sk.groupId) {
        let group = await wanchain.getGroupById(sk.groupId);
        handlerOpenStoremanIncentive(wkAddr);
        handlerOpenStoremanStatus(group);
      }
      if (sk.nextGroupId != INVALID_GROUP_ID) {
        let groupNext = await wanchain.getGroupById(sk.nextGroupId);
        handlerOpenStoremanStatus(groupNext);
      }
    } catch(err) {
      logger.error("handlerOpenStoreman error:", err);
    }
    await sleep(1000*60);
  }
}

module.exports = {
  GroupStatus,
  handlerOpenStoreman
}

const wanchain = require('./utils/wanchain');

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
const wkAddr = wanchain.selfAddress;

console.log("open storeman wkAddr: %s", wkAddr);

let lastIncentivedDay = 0;
async function handlerOpenStoremanIncentive(wkaddr){
  let curDay = Date.now()/1000/60/60/24;
  if(curDay == lastIncentivedDay){
    return;
  }
  while(1){
    let txhash = await wanchain.sendToIncentive(wkaddr)
    global.logger.info(arguments.callee.name+" txhash:", txhash);
    let receipt = await wanchain.sendToIncentive(txhash, arguments.callee.name)
    if(!receipt  ||  !receipt.logs || receipt.logs.topics[3]==1){
      lastIncentivedDay = curDay;
      break;
    }
  }
}
async function handlerOpenStoremanStatus(group){
  let cur = Date.now()/1000;
  switch(group.status){
    case GroupStatus.curveSeted: // toselect.
      if(wkAddr == group.selectedNode[0]){ // is Leader
        if(cur > group.registerTime+group.registerDuration){
          await wanchain.sendToSelect(group.groupId);
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
async function handlerOpenStoreman(logger) { 
  while (1) {
    logger.info("********************************** handlerOpenStoreman start **********************************");

    try{
      // get my group
      let sk = await wanchain.getSkbyAddr(wkAddr);
      let group = await wanchain.getGroupById(sk.groupId);
      handlerOpenStoremanIncentive(wkAddr);

      handlerOpenStoremanStatus(group);
      if(sk.nextGrupId){
        let groupNext = await wanchain.getGroupById(sk.nextGrupId);
        handlerOpenStoremanStatus(groupNext);
      }
    }catch(err){
      logger.error("handlerOpenStoreman error:", error);
    }
    await sleep(1000*60*10);
  }
}

module.exports = {
  GroupStatus,
  handlerOpenStoreman
}

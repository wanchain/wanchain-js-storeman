const config = require('../../cfg/config');
const Group = require('./Group');
const EventTracker = require('../utils/EventTracker');
const {GpkStatus} = require('./Types');
const wanchain = require('../utils/wanchain');
const mongoose = require('mongoose');
const GroupInfo = require('../../db/models/group_info');
const Round = require('./Round');
const Logger = require('../../../../comm/logger.js');

const logger = new Logger("gpk-" + wanchain.selfAddress, "log/gpk.log", "log/gpk_error.log", global.argv.loglevel);

// record latest round of each group
const groupMap = new Map();

const smgSc = wanchain.getContract('smg', config.contractAddress.smg);
const gpkSc = wanchain.getContract('gpk', config.contractAddress.gpk);

function run() {
  logger.info("run gpk agent");
  mongoose.connect(config.dbUrl, config.dbOption, async (err) => {
    if (err) {
      logger.error(err);
    } else {
      logger.info('database connected');
      await recoverGroup();
      listenEvent();
    }
  });
}

async function recoverGroup() {
  let groups = await GroupInfo.find({selfAddress: wanchain.selfAddress}).exec();
  await Promise.all(groups.map(group => {
    return new Promise(async (resolve, reject) => {
      logger.info("gpk agent recover group %s", group.id);
      try {
        let resumeGroup = new Group(logger, group.id, group.round);
        resumeGroup.curves = group.curves;
        let r0 = new Round(logger, resumeGroup, 0, [], 0);
        Object.assign(r0, group.rounds[0]);
        resumeGroup.rounds[0] = r0;
        if (group.rounds[1]) {
          let r1 = new Round(logger, resumeGroup, 1, [], 0);
          Object.assign(r1, group.rounds[1]);
          resumeGroup.rounds[1] = r1;
        }
        groupMap.set(resumeGroup.id, resumeGroup);
        await resumeGroup.start(true);
        resolve();
      } catch (err) {
        logger.error("gpk agent recover group %s error: %O", group.id, err);
        reject(err);
      }
    });
  }));
}

function listenEvent() {
  let id = wanchain.selfAddress + '_gpk';
  let evtTracker = new EventTracker(logger, id, eventHandler, true, config.startBlock);
  evtTracker.subscribe('smg_selectedEvent', config.contractAddress.smg, ["0x62487e9f333516e24026d78ce371e54c664a46271dcf5ffdafd8cd10ea75a5bf"]);
  evtTracker.subscribe('gpk_GpkCreatedLogger', config.contractAddress.gpk, ["0x884822611cfb227c03601397b3912b6e3f6c0559500336651a8214a2e5bc290e"]);
  evtTracker.subscribe('gpk_SlashLogger', config.contractAddress.gpk, ["0x6db7153a0195112b574e9c22db0cf9526d68f6951c394ed1b179447813515b42"]);
  evtTracker.subscribe('gpk_ResetLogger', config.contractAddress.gpk, ["0x13beb2234bbbe2e676ea7d404e3cf57bf7e167ebdf43c97bf34007c878a06e88"]);
  evtTracker.subscribe('gpk_CloseLogger', config.contractAddress.gpk, ["0xa9ae7136d2e2e390eb5f98304af73123f4b84e37bd83d1101c08ff39456f0b5f"]);
  evtTracker.start();
}

async function eventHandler(evt) {
  // logger.info("receive evt: %O", evt);
  try {
    switch (evt.name) {
      case 'smg_selectedEvent':
      case 'gpk_ResetLogger':
        await procSmgSelectedEvent(evt);
        break;
      case 'gpk_GpkCreatedLogger':
        await procGpkCreatedLogger(evt);
        break;
      case 'gpk_SlashLogger':
        await procGpkSlashLogger(evt);
        break;
      case 'gpk_CloseLogger':
        await procGpkCloseLogger(evt);
        break;
      default:
        break;
    }
    return true;
  } catch (err) {
    logger.error("gpk agent process %s event err: %O", evt.name, err);
    return false;
  }
}

async function procSmgSelectedEvent(evt) {
  let groupId = evt.topics[1];
  let group = groupMap.get(groupId);
  let info = await gpkSc.methods.getGroupInfo(groupId, -1).call();
  // logger.info("gpk agent get group info: %O", info);
  let round = parseInt(info.queriedRound), status = parseInt(info.curve1Status);
  if (status == GpkStatus.PolyCommit) {
    logger.info("gpk agent start group %s round %d", groupId, round);
    let selected = await checkSelfSelected(groupId);
    if (selected) {
      if (!group) {
        let newGroup = new Group(logger, groupId, round);
        groupMap.set(groupId, newGroup);
        await newGroup.start();
      } else if (group.round < round) {
        await group.nextRound(round);
      } else {
        logger.error("gpk agent ignore group %s round %d status %d event", groupId, round, status);
      }
    } else {
      logger.info("gpk agent skip group %s round %d as not-selected", groupId, round);  
    }
  }
}

async function checkSelfSelected(groupId) {
  let isSelected = false;
  let smNumber = await smgSc.methods.getSelectedSmNumber(groupId).call();
  if (smNumber) {
    let ps = new Array(smNumber);
    for (let i = 0; i < smNumber; i++) {
      ps[i] = new Promise(async (resolve, reject) => {
        try {
          let sm = await smgSc.methods.getSelectedSmInfo(groupId, i).call();
          if (sm.wkAddr.toLowerCase() == wanchain.selfAddress) {
            isSelected = true;
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      })
    }
    await Promise.all(ps);
  }
  return isSelected;
}

function procGpkCreatedLogger(evt) {
  let groupId = evt.topics[1];
  let round = evt.topics[2];
  logger.info("gpk agent complete group %s at round %d", groupId, round);
}

function procGpkSlashLogger(evt) {
  let groupId = evt.topics[1];
  let round = evt.topics[2];
  let curve = evt.topics[3];
  logger.info("group %s round %d curve %d slash someone: %O", groupId, round, curve, evt);
}

function procGpkCloseLogger(evt) {
  let groupId = evt.topics[1];
  let round = evt.topics[2];
  logger.info("gpk agent close group %s at round %d", groupId, round);
}

module.exports = {
  run
};
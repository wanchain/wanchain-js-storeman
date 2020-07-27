const config = require('../../cfg/config');
const wanchain = require('../utils/wanchain');
const Round = require('./Round');
const GroupInfo = require('../../db/models/group_info');

class Group {
  constructor(logger, id, round) {
    this.logger = logger;

    // contract
    this.smgSc = null;
    this.gpkSc = null;

    // group info
    this.id = id;
    this.round = round;
    this.selfSk = ''; // hex string with 0x
    this.selfPk = ''; // hex string with 0x
    this.selfAddress = ''; // hex string with 0x

    // round
    this.curves = [];
    this.rounds = [];
  }

  async start(isResume = false) {
    this.logger.info("start gpk group %s round %d", this.id, this.round);
    this.initSc();
    this.initSelfKey();
    // await wanchain.updateNounce();
    if (isResume) {
      await this.rounds[0].start(isResume);
      if (this.rounds[1]) {
        await this.rounds[1].start(isResume);
      }
    } else {
      await this.initCurve();
      await this.nextRound(this.round);
    }
  }

  initSc() {
    this.smgSc = wanchain.getContract('smg', config.contractAddress.smg);
    this.gpkSc = wanchain.getContract('gpk', config.contractAddress.gpk);
  }
  
  initSelfKey() {
    this.selfSk = '0x' + wanchain.selfSk.toString('hex');
    this.selfPk = '0x' + wanchain.selfPk.toString('hex');
    this.selfAddress = wanchain.selfAddress;
  }

  async initCurve() {
    let info = await this.smgSc.methods.getStoremanGroupConfig(this.id).call();
    this.curves[0] = parseInt(info.curve1);
    this.curves[1] = parseInt(info.curve2);
    this.logger.info("gpk group %s curves: %O", this.id, this.curves);
  }  

  async getSmList() {
    let smNumber = await this.smgSc.methods.getSelectedSmNumber(this.id).call();
    let ps = new Array(smNumber);
    for (let i = 0; i < smNumber; i++) {
      ps[i] = new Promise(async (resolve, reject) => {
        try {
          let sm = await this.smgSc.methods.getSelectedSmInfo(this.id, i).call();
          let address = sm.wkAddr.toLowerCase();
          let pk = sm.PK;
          resolve({ address, pk});
        } catch (err) {
          reject(err);
        }
      })
    }
    let smList = await Promise.all(ps);
    this.logger.info('gpk group get smList: %O', smList);
    return smList;
  }

  async nextRound(round) {
    this.round = round;
    this.logger.info("gpk group %s next round %d", this.id, this.round);
    // stop previous round
    if (this.rounds[0]) {
      this.rounds[0].stop();
    }
    if (this.rounds[1]) {
      this.rounds[1].stop();
    }
    // get new round sm list
    let smList = await this.getSmList();
    let threshold = await this.smgSc.methods.getThresholdByGrpId(this.id).call();
    // curve1 round
    this.rounds[0] = new Round(this.logger, this, 0, smList, threshold);
    await this.rounds[0].start();
    // curve2 round
    if (this.curves[1] != this.curves[0]) {
      this.rounds[1] = new Round(this.logger, this, 1, smList, threshold)
      await this.rounds[1].start();
    }
  }

  async saveProgress(round) {
    if (round < this.round) {
      this.logger.info("gpk group ignore old round %d(<%d) process", round, this.round);
      return;
    }
    let gCopy = Object.assign({}, this);
    delete gCopy.logger;
    delete gCopy.smgSc;
    delete gCopy.gpkSc;
    delete gCopy.selfSk;
    gCopy.rounds = [];
    let r0Copy = Object.assign({}, this.rounds[0]);
    delete r0Copy.logger;
    delete r0Copy.group;
    gCopy.rounds[0] = r0Copy;
    if (this.rounds[1]) {
      let r1Copy = Object.assign({}, this.rounds[1]);
      delete r1Copy.logger;
      delete r1Copy.group;
      gCopy.rounds[1] = r1Copy;
    }
    let key = {id: this.id, selfAddress: this.selfAddress};
    await GroupInfo.updateOne(key, gCopy, {upsert: true});
  }

  async removeProgress(round) {
    let key = {id: this.id, round, selfAddress: this.selfAddress};
    await GroupInfo.deleteOne(key);
  }
}

module.exports = Group;

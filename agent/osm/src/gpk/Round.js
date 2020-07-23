const config = require('../../cfg/config');
const BigInteger = require('bigi');
const encrypt = require('../utils/encrypt');
const wanchain = require('../utils/wanchain');
const {GpkStatus, CheckStatus} = require('./Types');
const Send = require('./Send');
const Receive = require('./Receive');

class Round {
  constructor(logger, group, curveIndex, smList, threshold) {
    this.logger = logger;

    // group
    this.group = group;
    this.ployCommitPeriod = 0;
    this.defaultPeriod = 0;
    this.negotiatePeriod = 0;

    // round
    this.round = group.round;
    this.curveIndex = curveIndex;
    this.curve = group.curves[curveIndex];
    this.smList = smList.concat().map(sm => sm.address);
    this.threshold = threshold;
    this.status = GpkStatus.PolyCommit;
    this.statusTime = 0;

    // self data
    this.poly = []; // defalt 17 order, hex string with 0x
    this.polyCommit = []; // poly * G, hex string with 0x
    this.polyCommitTxHash = '';
    this.polyCommitDone = false;
    this.skShare = ''; // hex string with 0x
    this.pkShare = ''; // hex string with 0x
    this.gpk = ''; // hex string with 0x
 
    // global interactive data
    this.polyCommitTimeoutTxHash = '';

    // p2p interactive data
    this.send = []; // array of Send object
    this.receive = []; // array of Receive object
    for (let i = 0; i < smList.length; i++) {
      this.send.push(new Send(smList[i].pk));
      this.receive.push(new Receive());
    }

    // schedule
    this.standby = false;
    this.toStop = false;
  }

  async start(isResume = false) {
    this.logger.info("start gpk group %s round %d curve %d", this.group.id, this.round, this.curveIndex);
    if (!isResume) {
       this.initPoly();
    }
    await this.next(3000, isResume);
  }

  initPoly() {
    for (let i = 0; i < this.threshold; i++) {
      let poly = encrypt.genRandomCoef(this.curve, 32);
      this.poly[i] = '0x' + poly.toBuffer().toString('hex');
      this.polyCommit[i] = '0x' + encrypt.mulG(this.curve, poly).getEncoded(false).toString('hex').substr(2);
      // this.logger.info("init polyCommit %i: %s", i, this.polyCommit[i]);
    }
  }

  async next(interval = 60000, isResume = false) {
    if (this.toStop) {
      await this.group.removeProgress(this.round);
      return;
    }
    if (!isResume) {
      await this.group.saveProgress(this.round);
    }
    setTimeout(() => {
      this.mainLoop();
    }, interval);
  }

  stop() {
    this.toStop = true;
  }

  async mainLoop() {
    try {
      let info = await this.group.gpkSc.methods.getGroupInfo(this.group.id, this.round).call();
      let status = this.curveIndex ? info.curve2Status : info.curve1Status;
      let statusTime = this.curveIndex ? info.curve2StatusTime : info.curve1StatusTime;
      this.status = parseInt(status);
      this.statusTime = parseInt(statusTime);
      this.ployCommitPeriod = parseInt(info.ployCommitPeriod);
      this.defaultPeriod = parseInt(info.defaultPeriod);
      this.negotiatePeriod = parseInt(info.negotiatePeriod);
      this.logger.info('gpk group %s round %d curve %d status %d(%d) main loop', 
                       this.group.id, this.round, this.curveIndex, this.status, this.statusTime);
      // this.logger.info("mainLoop group info: %O", info);

      switch (this.status) {
        case GpkStatus.PolyCommit:
          await this.procPolyCommit();
          break;
        case GpkStatus.Negotiate:
          await this.procNegotiate();
          break;
        case GpkStatus.Complete:
          await this.procComplete();
          break;          
        default: // Close
          await this.procClose();
          break;
      }
    } catch (err) {
      this.logger.error('gpk group %s round %d curve %d proc status %d err: %O',
                        this.group.id, this.round, this.curveIndex, this.status, err);
    }
    this.next();
  }

  async procPolyCommit() {
    await this.polyCommitCheckTx();
    await this.polyCommitSend();
    await this.polyCommitReceive();
    await this.polyCommitTimeout();
  }

  async polyCommitReceive() {
    await Promise.all(this.smList.map((sm, index) => {
      return new Promise(async (resolve, reject) => {
        try {
          let receive = this.receive[index];
          if (!receive.polyCommit) {
            receive.polyCommit = await this.group.gpkSc.methods.getPolyCommit(this.group.id, this.round, this.curveIndex, sm).call();
            // this.logger.info("polyCommitReceive %s: %s", sm, receive.polyCommit);
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    }));
  }

  checkAllPolyCommitReceived() {
    for (let i = 0; i < this.smList.length; i++) {
      if (!this.receive[i].polyCommit) {
        return false;
      }
    }
    return true;
  }

  async polyCommitCheckTx() {
    let receipt;
    // self polyCommit
    if (this.polyCommitTxHash && !this.polyCommitDone) {
      receipt = await wanchain.getTxReceipt(this.polyCommitTxHash, 'polyCommit');
      if (receipt) {
        if (receipt.status) {
          this.polyCommitDone = true;
          // this.logger.info("polyCommitSend done");
        } else {
          let sent = this.group.gpkSc.methods.getPolyCommit(this.group.id, this.round, this.curveIndex, this.group.selfAddress).call();
          if (sent) { // already sent but lost txHash
            this.polyCommitDone = true;
            // this.logger.info("polyCommitSend already done");
          } else {
            this.polyCommitTxHash = '';
          }
        }
      }
    }
    // polyCommitTimeout
    if (this.polyCommitTimeoutTxHash) {
      receipt = await wanchain.getTxReceipt(this.polyCommitTimeoutTxHash);
      if (receipt && !receipt.status) {
        this.polyCommitTimeoutTxHash = '';
      }
    }
  }

  async polyCommitTimeout() {
    if ((wanchain.getElapsed(this.statusTime) > this.ployCommitPeriod) && !this.polyCommitTimeoutTxHash) {
      let i = 0;
      for (; i < this.smList.length; i++) {
        let receive = this.receive[i];
        if (!receive.polyCommit) {
          break;
        }
      }
      if (i < this.smList.length) {
        this.polyCommitTimeoutTxHash = await wanchain.sendPolyCommitTimeout(this.group.id, this.curveIndex);
        this.logger.info("group %s round %d curve %d sendPolyCommitTimeout hash: %s", this.group.id, this.round, this.curveIndex, this.polyCommitTimeoutTxHash);
      }
    }
  }

  async polyCommitSend() {
    if (!this.polyCommitTxHash) {
      this.polyCommitTxHash = await wanchain.sendPloyCommit(this.group.id, this.round, this.curveIndex, this.polyCommit);
      this.logger.info("group %s round %d curve %d sendPloyCommit hash: %s", this.group.id, this.round, this.curveIndex, this.polyCommitTxHash);
    }
  }

  async procNegotiate() {
    await this.polyCommitReceive();
    await Promise.all(this.smList.map((sm, index) => {
      return new Promise(async (resolve, reject) => {
        try {
          await this.negotiateReceive(sm, index);
          await this.negotiateCheckTx(sm, index);
          await this.negotiateTimeout(sm, index);
          await this.negotiateSend(sm, index);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    }));
  }

  async negotiateReceive(partner, index) {
    let receive = this.receive[index];
    let send = this.send[index];
    let dest;
    // encSij
    if (!receive.encSij) {
      dest = await this.group.gpkSc.methods.getEncSijInfo(this.group.id, this.round, this.curveIndex, partner, this.group.selfAddress).call();
      if (dest.encSij) {
        let encSij = dest.encSij;
        receive.sij = await encrypt.decryptSij(this.group.selfSk, encSij);
        this.logger.info('gpk group %s round %d curve %d receive %s sij %s', this.group.id, this.round, this.curveIndex, partner, "*" || receive.sij);
        if (receive.sij && encrypt.verifySij(this.curve, receive.sij, receive.polyCommit, this.group.selfPk)) {
          send.checkStatus = CheckStatus.Valid;
          // check all received
          if (this.checkAllSijReceived()) {
            this.genKeyShare();
          }
        } else {
          send.checkStatus = CheckStatus.Invalid;
          this.standby = true;
          this.logger.error('gpk group %s round %d curve %d receive %s sij invalid', this.group.id, this.round, this.curveIndex, partner);
        }
        receive.encSij = encSij;
      }
    }
    // checkStatus
    if ((receive.checkStatus == CheckStatus.Init) && send.encSijTxHash) { // already send encSij, do not wait chain confirm
      dest = await this.group.gpkSc.methods.getEncSijInfo(this.group.id, this.round, this.curveIndex, this.group.selfAddress, partner).call();
      if (dest.checkStatus != '0') {
        receive.checkStatus = parseInt(dest.checkStatus);
        if (receive.checkStatus == CheckStatus.Invalid) {
          this.standby = true;
          this.logger.info('gpk group %s round %d curve %d receive %s check sij invalid', this.group.id, this.round, this.curveIndex, partner);
        }
      }
    }
    // sij
    if ((send.checkStatus == CheckStatus.Invalid) && send.checkTxHash) { // already send checkStatus, do not wait chain confirm
      dest = await this.group.gpkSc.methods.getEncSijInfo(this.group.id, this.round, this.curveIndex, partner, this.group.selfAddress).call();
      if (dest.sij != '0') {
        receive.revealed = true;
        this.logger.info('gpk group %s round %d curve %d %s sij %s revealed', this.group.id, this.round, this.curveIndex, partner, dest.sij);
      }
    }
  }

  checkAllSijReceived() {
    for (let i = 0; i < this.smList.length; i++) {
      if (!this.receive[i].sij) {
        return false;
      }
    }
    return true;
  }

  genKeyShare() {
    let skShare = null;
    let gpk = null;
    for (let i = 0; i < this.smList.length; i++) {
      let sij = BigInteger.fromHex(this.receive[i].sij.substr(2));
      if (skShare == null) {
        skShare = sij;
      } else {
        skShare = encrypt.addSij(this.curve, skShare, sij);
      }
      // gpk
      let siG = encrypt.recoverSiG(this.curve, this.receive[i].polyCommit);
      if (!gpk) {
        gpk = siG;
      } else {
        gpk = gpk.add(siG);
      }      
    }
    this.logger.info("gpk group %s round %d curve %d generate key", this.group.id, this.round, this.curveIndex);
    this.skShare = '0x' + skShare.toBuffer(32).toString('hex');
    this.pkShare = '0x' + encrypt.mulG(this.curve, skShare).getEncoded(false).toString('hex').substr(2);
    this.gpk = '0x' + gpk.getEncoded(false).toString('hex').substr(2);
    wanchain.genKeystoreFile(this.gpk, this.skShare);
    this.logger.info("skShare: %s", this.skShare);
    this.logger.info("pkShare: %s", this.pkShare);
    this.logger.info("gpk: %s", this.gpk);
  }

  async negotiateCheckTx(partner, index) {
    let send = this.send[index];
    let receipt, dest;
    // encSij
    if (send.encSijTxHash && !send.chainEncSijTime) {
      receipt = await wanchain.getTxReceipt(send.encSijTxHash);
      if (receipt) {
        dest = await this.group.gpkSc.methods.getEncSijInfo(this.group.id, this.round, this.curveIndex, this.group.selfAddress, partner).call();
        if (receipt.status || dest.encSij) { // already sent but lost txHash
          send.chainEncSijTime = parseInt(dest.setTime);
        } else {
          send.encSijTxHash = '';
        }
      }
    }
    // checkStatus
    if (send.checkTxHash && !send.chainCheckTime) {
      receipt = await wanchain.getTxReceipt(send.checkTxHash);
      if (receipt) {
        dest = await this.group.gpkSc.methods.getEncSijInfo(this.group.id, this.round, this.curveIndex, partner, this.group.selfAddress).call();
        if (receipt.status || (dest.checkStatus != '0')) { // already sent but lost txHash
          send.chainCheckTime = parseInt(dest.checkTime);
        } else {
          send.checkTxHash = '';
        }
      }
    }
    // sij
    if (send.sijTxHash) {
      receipt = await wanchain.getTxReceipt(send.sijTxHash);
      if (receipt && !receipt.status) {
        dest = await this.group.gpkSc.methods.getEncSijInfo(this.group.id, this.round, this.curveIndex, this.group.selfAddress, partner).call();
        if (dest.sij == '0') {
          send.sijTxHash = '';
        }
      }
    }
    // encSij timeout
    if (send.encSijTimeoutTxHash) {
      receipt = await wanchain.getTxReceipt(send.encSijTimeoutTxHash);
      if (receipt && !receipt.status) {
        send.encSijTimeoutTxHash = '';
      }
    }
    // checkStatus timeout
    if (send.checkTimeoutTxHash) {
      receipt = await wanchain.getTxReceipt(send.checkTimeoutTxHash);
      if (receipt && !receipt.status) {
        send.checkTimeoutTxHash = '';
      }
    }
    // sij timeout
    if (send.sijTimeoutTxHash) {
      receipt = await wanchain.getTxReceipt(send.sijTimeoutTxHash);
      if (receipt && !receipt.status) {
        send.sijTimeoutTxHash = '';
      }
    }
  }

  async negotiateTimeout(partner, index) {
    let receive = this.receive[index];
    let send = this.send[index];
    // encSij timeout
    if (!receive.encSij) {
      if (wanchain.getElapsed(this.statusTime) > this.defaultPeriod) {
        send.encSijTimeoutTxHash = await wanchain.sendEncSijTimeout(this.group.id, this.curveIndex, partner);
        this.logger.info("group %s round %d curve %d sendEncSijTimeout to %s hash: %s", this.group.id, this.round, this.curveIndex, partner, send.encSijTimeoutTxHash);
      }
    }    
    // check timeout
    if ((receive.checkStatus == CheckStatus.Init) && send.chainEncSijTime) {
      if (wanchain.getElapsed(send.chainEncSijTime) > this.defaultPeriod) {
        send.checkTimeoutTxHash = await wanchain.sendCheckTimeout(this.group.id, this.curveIndex, partner);
        this.logger.info("group %s round %d curve %d sendCheckTimeout to %s hash: %s", this.group.id, this.round, this.curveIndex, partner, send.checkTimeoutTxHash);
      }
    }
    // sij timeout
    if ((send.checkStatus == CheckStatus.Invalid) && send.chainCheckTime && !receive.revealed) {
      if (wanchain.getElapsed(send.chainCheckTime) > this.defaultPeriod) {
        send.sijTimeoutTxHash = await wanchain.sendSijTimeout(this.group.id, this.curveIndex, partner);
        this.logger.info("group %s round %d curve %d sendSijTimeout to %s hash: %s", this.group.id, this.round, this.curveIndex, partner, send.sijTimeoutTxHash);
      }
    }
  }

  async negotiateSend(partner, index) {
    let receive = this.receive[index];
    let send = this.send[index];
    // checkStatus
    if ((send.checkStatus != CheckStatus.Init) && (!send.checkTxHash)) {
      let isValid = (send.checkStatus == CheckStatus.Valid);
      send.checkTxHash = await wanchain.sendCheckStatus(this.group.id, this.round, this.curveIndex, partner, isValid);
      this.logger.info("group %s round %d curve %d sendCheckStatus %d to %s hash: %s", this.group.id, this.round, this.curveIndex, isValid, partner, send.checkTxHash);
    }
    // sij
    if ((receive.checkStatus == CheckStatus.Invalid) && (!send.sijTxHash)) {
      send.sijTxHash = await wanchain.sendSij(this.group.id, this.round, this.curveIndex, partner, send.sij, send.ephemPrivateKey);
      this.logger.info("group %s round %d curve %d sendSij %s to %s hash: %s", this.group.id, this.round, this.curveIndex, send.sij, partner, send.sijTxHash);
    }
    if (this.standby) {
      return;
    }
    // encSij
    if (!send.encSij) {
      await this.genEncSij(partner, index);
      await this.group.saveProgress(this.round);
    }
    if (!send.encSijTxHash) {
      send.encSijTxHash = await wanchain.sendEncSij(this.group.id, this.round, this.curveIndex, partner, send.encSij);
      this.logger.info("group %s round %d curve %d sendEncSij %s to %s hash: %s", this.group.id, this.round, this.curveIndex, "*" || send.encSij, partner, send.encSijTxHash);
    }
  }

  async genEncSij(partner, index) {
    let send = this.send[index];
    let destPk = send.pk;
    // this.logger.info("genEncSij for partner %s pk %s", partner, destPk);
    let sij = '0x' + encrypt.genSij(this.curve, this.poly, destPk).toBuffer(32).toString('hex');
    // this.logger.info("sij=%s", sij);
    let enc = await encrypt.encryptSij(destPk, sij);
    send.sij = sij;
    send.encSij = '0x' + enc.ciphertext;
    send.ephemPrivateKey = '0x' + enc.ephemPrivateKey;
    // this.logger.info("ephemPrivateKey=%s", send.ephemPrivateKey);
  }
  
  async procComplete() {
    this.stop();
    this.logger.info("gpk group %s round %d curve %d is complete", this.group.id, this.round, this.curveIndex);

    let i;
    for (i = 0; i < this.smList.length; i++) {
      if (this.smList[i] == wanchain.selfAddress) {
        break;
      }
    }
    let pkShare = await this.group.gpkSc.methods.getPkShare(this.group.id, i).call();
    let gpk = await this.group.gpkSc.methods.getGpk(this.group.id).call();
    if (pkShare[this.curveIndex] == this.pkShare) {
      this.logger.info("index %d(%s) pkShare: %s", i, wanchain.selfAddress, this.pkShare);
    } else {
      this.logger.info("get index %d(%s) pkShare %s not match %s", i, wanchain.selfAddress, pkShare[this.curveIndex], this.pkShare);
    }
    if (gpk[this.curveIndex] == this.gpk) {
      this.logger.info("gpk: %s", this.gpk);
    } else {
      this.logger.error("get gpk %s not match %s", gpk[this.curveIndex], this.gpk);
    }
  }
  
  async procClose() {
    this.stop();
    this.logger.info("gpk group %s round %d curve %d is closed", this.group.id, this.round, this.curveIndex);
  }
}

module.exports = Round;

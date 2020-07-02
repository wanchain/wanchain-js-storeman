const fs = require('fs');
const path = require('path');
const config = require('../../cfg/config');
const abiMap = require('../../cfg/abi');
const keythereum = require('keythereum');
const ethUtil = require('ethereumjs-util');
const Web3 = require('web3');
const wanUtil = require('wanchain-util');
const Tx = wanUtil.wanchainTx;

const keystore = JSON.parse(fs.readFileSync(config.keystore.path, "utf8"));
const selfSk = keythereum.recover(config.keystore.pwd, keystore); // Buffer
const selfPk = ethUtil.privateToPublic(selfSk); // Buffer
const selfAddress = '0x' + ethUtil.pubToAddress(selfPk).toString('hex').toLowerCase();
let selfNonce = 0;
console.log("keystore path: %s", config.keystore.path);
// console.log("sk: %s", '0x' + selfSk.toString('hex'));
console.log("pk: %s", '0x04' + selfPk.toString('hex'));
console.log("address: %s", selfAddress);

const web3 = new Web3(new Web3.providers.HttpProvider(config.wanNodeURL));

const createGpkSc = getContract('CreateGpk', config.contractAddress.createGpk);

function getContract(name, address) {
  let abi = abiMap.get(name);
  if (abi) {
    return new web3.eth.Contract(abi, address);
  } else {
    return null;
  }
}

function getElapsed(baseTs) {
  if (baseTs == 0) {
    return 0;
  }
  return ((new Date() / 1000).toFixed(0) - baseTs);
}

async function updateNounce() {
  try {
    selfNonce = await web3.eth.getTransactionCount(selfAddress, 'pending');
    console.log("update address %s nonce %d", selfAddress, selfNonce);
  } catch (err) {
    console.error("update address %s nonce err: %O", selfAddress, err);
  }
}

async function sendTx(contractAddr, data) {
  if (0 != data.indexOf('0x')){
    data = '0x' + data;
  }

  let rawTx = {
      Txtype: 0x01, // wanchain only
      nonce: selfNonce++,
      gasPrice: config.gasPrice,
      gasLimit: config.gasLimit,
      to: contractAddr,
      chainId: '0x06',
      value: '0x0',
      data: data
  };
  // console.log("sendTx: %O", rawTx);
  let tx = new Tx(rawTx);
  tx.sign(selfSk);

  try {
    let result = await web3.eth.sendSignedTransaction('0x' + tx.serialize().toString('hex'));
    // console.log("%s txHash: %s", selfAddress, result.transactionHash);
    return result.transactionHash;
  } catch(err) {
    console.error("send tx data %s to contract %s error: %O", data, contractAddr, err);
    return '';
  }
}

async function getTxReceipt(txHash, name = '') {
  try {
    let receipt = await web3.eth.getTransactionReceipt(txHash);
    console.log("getTxReceipt %s(%s) receipt %s gas %s", name, txHash, receipt.status, receipt.gasUsed);
    return receipt;
  } catch(err) {
    // console.log("getTxReceipt %s(%s) none: %O", name, txHash, err);
    return null;
  }
}

async function sendPloyCommit(groupId, polyCommit) {
  let order = polyCommit.length;
  let buf = Buffer.alloc(order * 65);
  let offset = 0;
  for (let i = 0; i < order; i++) {
    let temp = Buffer.from(polyCommit[i].substr(2), 'hex');
    temp.copy(buf, offset);
    offset += 65;
  }
  let pcStr = '0x' + buf.toString('hex');
  // console.log("group %s sendPloyCommit %s", groupId, pcStr);
  let txData = await createGpkSc.methods.setPolyCommit(groupId, pcStr).encodeABI();
  let txHash = await sendTx(config.contractAddress.createGpk, txData);
  return txHash;
}

async function sendEncSij(groupId, dest, encSij) {
  let txData = await createGpkSc.methods.setEncSij(groupId, dest, encSij).encodeABI();
  let txHash = await sendTx(config.contractAddress.createGpk, txData);
  return txHash;  
}

async function sendCheckStatus(groupId, src, isValid) {
  let txData = await createGpkSc.methods.setCheckStatus(groupId, src, isValid).encodeABI();
  let txHash = await sendTx(config.contractAddress.createGpk, txData);
  return txHash;  
}

async function sendSij(groupId, dest, sij, ephemPrivateKey) {
  let txData = await createGpkSc.methods.revealSij(groupId, dest, sij, ephemPrivateKey).encodeABI();
  let txHash = await sendTx(config.contractAddress.createGpk, txData);
  return txHash;
}

async function sendPolyCommitTimeout(groupId) {
  let txData = await createGpkSc.methods.polyCommitTimeout(groupId).encodeABI();
  let txHash = await sendTx(config.contractAddress.createGpk, txData);
  return txHash;
}

async function sendEncSijTimeout(groupId, src) {
  let txData = await createGpkSc.methods.encSijTimeout(groupId, src).encodeABI();
  let txHash = await sendTx(config.contractAddress.createGpk, txData);
  return txHash;
}

async function sendCheckTimeout(groupId, dest) {
  let txData = await createGpkSc.methods.checkEncSijTimeout(groupId, dest).encodeABI();
  let txHash = await sendTx(config.contractAddress.createGpk, txData);
  return txHash;
}

async function sendSijTimeout(groupId, src) {
  let txData = await createGpkSc.methods.SijTimeout(groupId, src).encodeABI();
  let txHash = await sendTx(config.contractAddress.createGpk, txData);
  return txHash;
}

async function getBlockNumber() {
  return await web3.eth.getBlockNumber(); // promise
}

function getEvents(options) {
  return web3.eth.getPastLogs(options); // promise
}

function genKeystoreFile(gpk, sk, password) {
  let keystore = web3.eth.accounts.encrypt(sk, password);
  let gAddress = ethUtil.pubToAddress(Buffer.from(gpk.substr(4), 'hex')).toString('hex').toLowerCase(); // no 0x
  keystore.address = gAddress;
  let fp = path.join(__dirname, '../../keystore/', gpk);
  fs.writeFileSync(fp, JSON.stringify(keystore), 'utf8');
  fp = path.join(__dirname, '../../keystore/', gpk + '.pwd');
  fs.writeFileSync(fp, password, 'utf8');
}

module.exports = {
  selfSk,
  selfPk,
  selfAddress,
  getContract,
  getElapsed,
  updateNounce,
  sendTx,
  getTxReceipt,
  sendPloyCommit,
  sendEncSij,
  sendCheckStatus,
  sendSij,
  sendPolyCommitTimeout,
  sendEncSijTimeout,
  sendCheckTimeout,
  sendSijTimeout,
  getBlockNumber,
  getEvents,
  genKeystoreFile
}
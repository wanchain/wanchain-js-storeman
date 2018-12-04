const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const eventSchema = new Schema({
  hashX: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  direction: {
    type: Number, /*0: deposit, 1: withdraw*/
  },
  crossChain: {
    type: String
  },
  failAction:{
    type: String
  },
  failReason: {
    type: String
  },
  tokenType: {
    type: String,
  },
  tokenSymbol: {
    type: String,
  },
  tokenAddr: {
    type: String,
    lowercase: true
  },
  originChain: {
    type: String
  },
  x: {
    type: String,
    lowercase: true,
    default: '0x'
  },
  from: {
    type: String,
    lowercase: true
  },
  toHtlcAddr: {
    type: String,
    lowercase: true
  },
  storeman: {
    type: String,
    lowercase: true
  },
  crossAddress: {
    type: String,
    lowercase: true
  },
  value: {
    type: String,
  },
  status: {
    type: String, 
    default: 'init'
    /*
    waitingCross, 
    waitingApprove,
    approveFailed,
    approveFinished
    waitingCrossLockConfirming,
    lockHashFailed,
    waitingX, 
    receivedX,
    waitingCrossRedeemConfirming,
    redeemFailed,
    redeemFinished,
    walletRevoked,
    waitingRevoke,
    waitingCrossRevokeConfirming,
    revokeFailed,
    revokeFinished,
    transIgnored
    */
  },
  blockNumber: {
    type: Number
  },
  timestamp: {
    type: Number,
    default: 0
  },
  lockedTime: {
    type: Number,
    default: 0
  },
  suspendTime: {
    type: Number,
    default: 0    
  },
  HTLCtime: {
    type: Number,
    default: 0
  },
  transRetried:{
    type: Number,
    default: 0
  },
  transConfirmed: {
    type: Number,
    default: 0
  },
  walletLockEvent: {
    type: Array,
    default: []
  },
  storemanApproveZeroTxHash: {
    type: Array,
    lowercase: true,
    default: []
  },
  storemanApproveTxHash: {
    type: Array,
    lowercase: true,
    default: []
  },
  storemanLockTxHash: {
    type: Array,
    lowercase: true,
    default: []
  },
  storemanLockEvent: {
    type: Array,
    default: []
  },
  walletRedeemEvent: {
    type: Array,
    default: []
  },
  storemanRedeemTxHash: {
    type: Array,
    lowercase: true,
    default: []
  },
  storemanRedeemEvent: {
    type: Array,
    default: []
  },
  walletRevokeEvent: {
    type: Array,
    default: []
  },
  storemanRevokeTxHash: {
    type: Array,
    lowercase: true,
    default: []
  },
  storemanRevokeEvent: {
    type: Array,
    default: []
  },
}, {
  collection: 'event'
});

module.exports = eventSchema;
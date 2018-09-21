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
    waitingCrossRefundConfirming,
    refundFailed,
    refundFinished, 
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
  storemanApproveTxHash: {
    type: String,
    lowercase: true,
    default: '0x'
  },
  storemanLockTxHash: {
    type: String,
    lowercase: true,
    default: '0x'
  },
  storemanLockEvent: {
    type: Array,
    default: []
  },
  walletRefundEvent: {
    type: Array,
    default: []
  },
  storemanRefundTxHash: {
    type: String,
    lowercase: true,
    default: '0x'
  },
  storemanRefundEvent: {
    type: Array,
    default: []
  },
  walletRevokeEvent: {
    type: Array,
    default: []
  },
  storemanRevokeTxHash: {
    type: String,
    lowercase: true,
    default: '0x'
  },
  storemanRevokeEvent: {
    type: Array,
    default: []
  },
}, {
  collection: 'event'
});

module.exports = eventSchema;
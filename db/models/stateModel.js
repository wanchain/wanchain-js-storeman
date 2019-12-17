const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const stateSchema = new Schema({
  crossChain: {
    type: String,
    lowercase: true,
    required: true,
    unique: true
  },
  wanScannedBlockNumber: {
    type: Number,
    // required: true,
    default: '0'
  },
  oriScannedBlockNumber: {
    type: Number,
    // required: true,
    default: '0'
  }
}, {
  collection: 'state',
  id: false
});

module.exports = stateSchema;
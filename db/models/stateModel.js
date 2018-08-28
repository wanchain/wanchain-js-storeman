const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const stateSchema = new Schema({
  chainType: {
    type: String,
    lowercase: true,
    required: true,
    unique: true
  },
  scannedBlockNumber: {
    type: Number,
    required: true,
    default: '0'
  }
}, {
  collection: 'state',
  id: false
});

module.exports = stateSchema;
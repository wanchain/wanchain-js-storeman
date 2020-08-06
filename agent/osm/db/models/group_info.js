var mongoose = require('mongoose');
const collection = "group_info";

var GroupInfoSchema = new mongoose.Schema({
    id: {
        type: String,
        index: true
    },
    smgSc: {
      type: String
    },
    gpkSc: {
      type: String
    },
    round: {
        type: Number,
    },
    selfPk: {
        type: String
    },
    selfAddress: {
        type: String
    },
    running: {
        type: Boolean
    },
    curves: {
        type: Array,
        default: []
    },
    rounds: {
        type: Array,
        default: []
    }
}, {
    id: false
});

module.exports = mongoose.model(collection, GroupInfoSchema, collection);

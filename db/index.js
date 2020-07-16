"use strict"

const mongoose = require('mongoose');
const ModelOps = require('../modelOps');

const moduleConfig = require('conf/moduleConfig.js');

let crossDbUrl = moduleConfig.crossDbUrl;
let dbOption = {
  useNewUrlParser: true
}
let dbUrl = crossDbUrl + global.index;
if (global.replica) {
  const awsDBOption = {
    // used for mongo replicaSet
    replicaSet: "s0",
    readPreference: "secondaryPreferred" //readPreference must be either primary/primaryPreferred/secondary/secondaryPreferred/nearest
  }
  Object.assign(dbOption, awsDBOption);
  dbUrl = dbUrl + "?authSource=admin";
}
let db = mongoose.createConnection(dbUrl, dbOption);

db.on('connected', function(err) {
  if (err) {
    global.syncLogger.error('Unable to connect to database(' + crossDbUrl.split('/')[3] + global.index + ')：' + err);
    global.syncLogger.error('Aborting');
    process.exit();
  } else {
    global.syncLogger.info('Connecting to database ' + crossDbUrl.split('/')[3] + global.index + ' is successful!');
  }
});

let modelOps = new ModelOps(global.syncLogger, db);

exports.modelOps = modelOps;
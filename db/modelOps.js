const eventSchema = require('db/models/eventModel.js');
const stateSchema = require('db/models/stateModel.js');
const DbAccess = require('db/dbAccess');

class ModelOps {
  constructor(logger, chainDb) {
    this.logger = logger;
    this.db = chainDb;

    /* if address is set, only save this address related transaction/receipts/event to DB */
    this.dbAccess = new DbAccess(logger);

    this.eventModel = this.getModel('event', eventSchema);
    this.stateModel = this.getModel('state', stateSchema);
  }

  getModel(name, schema) {
    let logger = this.logger;
    if (this.db) {
      return this.db.model(name, schema);
    } else {
      logger.error('Connecting to database failed!');
      logger.error('Aborting');
      process.exit();
    }
  }

  saveScannedBlockNumber(chainType, number) {
    this.dbAccess.updateDocument(this.stateModel, {
      chainType: chainType
    }, { chainType: chainType, scannedBlockNumber: number });
  }

  getScannedBlockNumber(chainType, callback) {
    this.dbAccess.findDocumentOne(this.stateModel, {
      chainType: chainType
    }, function(err, result) {
      let number = 0;
      if (!err && result !== null) {
        number = result.scannedBlockNumber;
      }
      callback(err, number);
    });
  }

  async getScannedBlockNumberSync(chainType) {
    try {
      let result = await this.dbAccess.syncFindDocument(this.stateModel, {
        chainType: chainType
      });
      this.logger.debug("Synchronously getScannedBlockNumber (" + result + ")");
      let blockNumber;
      if (result.length !== 0) {
        blockNumber = result[0].scannedBlockNumber;
      } else {
        blockNumber = 0;
      }
      return blockNumber;
    } catch (err) {
      // this.logger.error(err);
      return Promise.reject(err);
    }
  }

  saveScannedEvent(hashX, content) {
    this.dbAccess.updateDocument(this.eventModel, {
      hashX: hashX
    }, content);
  }

  syncSave(hashX, content) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.dbAccess.syncUpdateDocument(this.eventModel, {
          hashX: hashX
        }, content);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  getEventByHashX(hashX, callback) {
    let logger = this.logger;
    this.dbAccess.findDocumentOne(this.eventModel, {
      hashX: hashX
    }, function(err, result) {
      if (!err && result !== null) {
        logger.debug("getEventByHashX " + result.hashX);
      }
      callback(err, result);
    });
  }

  async getEventHistory(option) {
    try {
      let result = await this.dbAccess.syncFindDocument(this.eventModel, option);
      return result;
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

module.exports = ModelOps;
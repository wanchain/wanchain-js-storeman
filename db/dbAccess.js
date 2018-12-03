
class DbAccess {
  constructor(log) {
    this.log = log;
  }

  addDocument(model, content) {
    let doc = new model(content);
    let log = this.log;
    doc.save(function(err) {
      if (err) {
        log.error("Add document:", err);
      }
    });
  }

  delDocument(model, filter) {
    let log = this.log;
    model.remove(filter, function(err) {
      if (err) {
        log.error("Delete document:", err);
      }
    });
  }

  async syncDelDocument(model, filter) {
    let query = model.remove(filter);
    await query.exec();
  }

  updateDocument(model, filter, content) {
    let log = this.log;
    model.findOneAndUpdate(filter, content, {
      upsert: true
    }, (err, doc) => {
      if (err) {
        log.error("updateDocument will retry", (err.hasOwnProperty("message")) ? err.message : err);
        model.findOneAndUpdate(filter, content, {
          upsert: true
        }, (err, doc) => {
          if (err) {
            log.error("updateDocument retry failed",err);
          } else {
            log.error("updateDocument succeeded ");
          }
        });
      }
    });
  }

  syncUpdateDocument(model, filter, content) {
    let log = this.log;
    return new Promise((resolve, reject) => {
      model.findOneAndUpdate(filter, content, {
        upsert: true
      }, (err, doc) => {
        if (!err) {
          resolve();
        } else {
          log.error("syncUpdateDocument failed",err);
          reject(err);
        }
      });
    });
  }

  findDocumentOne(model, filter, callback) {
    let log = this.log;
    model.findOne(filter, function(err, result) {
      if (err) {
        log.error("Find document:", err);
        log.error(model.modelName);
        log.error(filter);
      } else {
        if (result !== null) {
          delete result._doc._id;
          delete result._doc.__v;
        }
      }
      callback(err, result);
    });
  }

  findDocument(model, filter, callback) {
    let log = this.log;
    model.find(filter, function(err, result) {
      if (err) {
        log.error("Find document:", err);
        log.error(model.modelName);
        log.error(filter);
      } else {
        for (let i = 0; i < result.length; i++) {
          delete result[i]._doc._id;
          delete result[i]._doc.__v;
        }
      }
      callback(err, result);
    });
  }

  syncFindDocument(model, filter) {
    let log = this.log;
    return new Promise(function(resolve, reject) {
      model.find(filter, function(err, result) {
        if (!err) {
          for (let i = 0; i < result.length; i++) {
            delete result[i]._doc._id;
            delete result[i]._doc.__v;
          }
          // log.debug(result);
          resolve(result);
        } else {
          log.error(err);
          reject(err);
        }
      });
    });
  }

}


module.exports = DbAccess;
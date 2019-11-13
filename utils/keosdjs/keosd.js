var util = require("./util");
var code = require("./errcode");

function create(name, callback) {
  util.call("create", name, callback);
}

function open(name, pwd, callback) {
  util.call("open", [name, pwd], callback);
}

function lock(name, callback) {
  util.call("lock", name, callback);
}

function lock_all(callback) {
  util.call("lock_all", [], callback);
}

function unlock(name, pwd, callback) {
  util.call("unlock", [name, pwd], (err, result) => {
    if (err && err.code === code.ignore.AlreadyUnlocked) {
      return callback(null, {});
    }
    callback(err, result);
  });
}

function import_key(name, prvKey, callback) {
  util.call("import_key", [name, prvKey], callback);
}

function list_wallets(callback) {
  util.call("list_wallets", [], callback);
}

function list_keys(name, pwd, callback) {
  util.call("list_keys", [name, pwd], callback);
}

function get_public_keys(callback) {
  util.call("get_public_keys", [], callback);
}

function set_timeout(second, callback) {
  util.call("set_timeout", second, callback);
}

function sign_transaction(transaction, pubKeys, chainId, callback) {
  util.call("sign_transaction", [transaction, pubKeys, chainId], callback);
}

function create_key(name, type, callback) {
  util.call("create_key", [name, type], callback);
}

// function sign_digest(callback) {
//   util.call("sign_digest", [], callback);
// }

module.exports = {
  create,
  open,
  lock,
  lock_all,
  unlock,
  import_key,
  list_wallets,
  list_keys,
  get_public_keys,
  set_timeout,
  sign_transaction,
  create_key,
  // sign_digest
};
var request = require("request");
var {
  keosdUrl,
  method,
  headers
}  = require("./config");

module.exports.call = function (func, args, callback) {
  if (typeof(args) === "function") {
    callback = args;
    args = null;
  }

  var options = {
    method: method.POST,
    url: keosdUrl + func,
    headers: headers,
    body: JSON.stringify(args)
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    let result = JSON.parse(body);
    if (result.error) {
      callback(result.error, null);
    } else {
      callback(null, result);
    }
  });
}
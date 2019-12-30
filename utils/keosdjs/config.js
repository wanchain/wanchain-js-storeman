const method   = { POST:'POST'};
const headers  = {'content-type': 'application/json'}

const endpoint = global.keosdUrl;
// const endpoint = "http://192.168.1.58:9999";

const version  = "/v1/wallet/";
const keosdUrl = endpoint + version;

module.exports = {
  keosdUrl,
  method,
  headers
}

const method   = { POST:'POST'};
const headers  = {'content-type': 'application/json'}

const endpoint = "http://192.168.88.129:9999";
// const endpoint = "http://192.168.1.58:9999";

const version  = "/v1/wallet/";
const keosdUrl = endpoint + version;

module.exports = {
  keosdUrl,
  method,
  headers
}

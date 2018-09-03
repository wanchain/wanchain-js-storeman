const fs = require('fs');
const keythereum = require("keythereum");
let wanUtil = require('wanchain-util');

const keyStorePath = process.env.HOME + "/keystore/";

const keyStore = {
  getWAddress(address) {
    let keyStore = this.getKeystoreJSON(address);
    if (keyStore) {
      return keyStore.waddress;
    }
    return null;
  },
  getFromFile(fileName){
    let keystoreStr = fs.readFileSync(fileName, "utf8");
    return JSON.parse(keystoreStr);
  },

  getKeystoreJSON(address) {
    let fileName = this.getKeystoreFile(address);
    if (fileName) {
      let keystoreStr = fs.readFileSync(fileName, "utf8");
      return JSON.parse(keystoreStr);
    }
    return null;
  },
  getKeystoreFile(address) {
    if (address.substr(0, 2) === '0x' || address.substr(0, 2) === '0X')
      address = address.substr(2);
    let files = fs.readdirSync(keyStorePath);
    for (var i in files) {
      var item = files[i];
      if (item.toLowerCase().indexOf(address.toLowerCase()) >= 0) {
        return keyStorePath + item;
      }
    }
  },
  getKeystorePath() {
    return keyStorePath;
  },

  getAddressAndKeyFrom(WAddress)
  {
    let publicKey = wanUtil.recoverPubkeyFromWaddress(WAddress).A;
    return "0x"+wanUtil.sha3(publicKey.slice(1)).slice(-20).toString('hex');
  },
  getPrivateKey(address,password){
    let keystore = this.getKeystoreJSON(address);
    // let keyBObj = {version:keystore.version, crypto:keystore.crypto2};
    let keyAObj = {version:keystore.version, crypto:keystore.crypto};
    let privKeyA;
    // let privKeyB;
    try {
      privKeyA = keythereum.recover(password, keyAObj);
      // privKeyB = keythereum.recover(password, keyBObj);
    }catch(error){
      console.log('User Transaction input : ', 'wrong password');
      return null;
    }
    // return [privKeyA,privKeyB];
    return privKeyA;
  },
  getOTAPrivateKey(address,password,OTAAddress) {
    let privKey = keyStore.getPrivateKey(address, password);
    if (privKey) {
      return wanUtil.computeWaddrPrivateKey(OTAAddress, privKey[0], privKey[1]);
    }
  }
};
module.exports = keyStore;
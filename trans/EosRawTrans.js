"use strict"

let keosd = require("utils/keosdjs/keosd.js");

module.exports = class EosRawTrans {
  constructor(from, to, value) {
    this.txParams = [from, to, value, ''];
  }

  setData(data) {
    this.actions = data;
  }

  setValue(value) {
    this.value = value;
  }

  async signTransDebug(privateKey, chain) {
    let self = this;

    return new Promise(async (resolve, reject) => {
      try {
        let rawTx;

        let config = {
          // keyProvider: privateKey,
          httpEndpoint: chain.nodeUrl,
          // chainId must be set, or you'll get unsatisfied_authorization
          chainId: chain.chainId,
          expireInSeconds: 1200
        };
        const Eos = require('eosjs');
        let eos = Eos(config);

        rawTx = await eos.transaction({
          actions: self.actions
        },
          {
            // keyProvider: this provides a temporary key for a single action or transaction
            keyProvider: privateKey,
            broadcast: false,
            sign: true,
            blocksBehind: 3,
            expireSeconds: 30
          }
        );
        resolve(rawTx.transaction);
      } catch (err) {
        console.log("signTransDebug failed: ", err);
        reject(err);
      }
    })
  }

  async signTransFromKeosd(wallet, password, chain) {
    let self = this;

    return new Promise((resolve, reject) => {
      try {
        keosd.unlock(wallet, password, (err, result) => {
          if (err) {
            console.log("unlock.error:", err);
            reject(err);
          } else {
            console.log("unlock:", result);
            keosd.get_public_keys(async (err, pubKeys) => {
              if (err) {
                console.log("get_public_keys.error:", err);
                reject(err);
              } else {
                console.log("get_public_keys:", pubKeys);
                try {
                  if (pubKeys && pubKeys.length > 0) {
                    let trans = await chain.packTrans(self.actions);
                    console.log("packTrans:", trans);
                    let pubKey = await chain.getRequiredKeys(trans, pubKeys);
                    console.log("getRequiredKeys:", pubKey);
                    // [ 'EOS7ukAahTjjjMVdjDxpZXahfBAPhCJbXUHcJciyVeB1apBzz6dW9' ]
                    let chainId = await chain.getNetworkId();
                    if (pubKey && pubKey.required_keys) {
                      keosd.sign_transaction(trans, pubKey.required_keys, chainId, (err, signTx) => {
                        if (err) {
                          console.log("sign_transaction.error:", err);
                          reject(err);
                        } else {
                          console.log("sign_transaction:", signTx);
                          let signed_tx = {
                            compression: 'none',
                            transaction: trans,
                            signatures: signTx.signatures
                          }
                          resolve(signed_tx);
                        }
                      });
                    }
                  }
                } catch (err) {
                  reject(err);
                }
              }
            });
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}
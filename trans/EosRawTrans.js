"use strict"

let keosd = require("utils/keosdjs/keosd.js");
const { Api, JsonRpc } = require('eosjs');
const fetch = require('node-fetch');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const { TextEncoder, TextDecoder } = require('util');

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

  async signTransDebug(privateKeys, chain) {
    let self = this;

    return new Promise(async (resolve, reject) => {
      try {
        let rawTx;

        console.log("signTransDebug with privateKes", privateKeys);
        const rpc = new JsonRpc(chain.nodeUrl, { fetch });
        const signatureProvider = new JsSignatureProvider(privateKeys);
        const api = new Api({ rpc, authorityProvider: rpc, abiProvider: rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

        rawTx = await api.transact({
          actions: self.actions
        }, {
          blocksBehind: 3,
          expireSeconds: 1000,
          broadcast: false,
          sign: true
        });

        // eosjs 16.0.9
        // let config = {
        //   // keyProvider: privateKeys,
        //   httpEndpoint: chain.nodeUrl,
        //   // chainId must be set, or you'll get unsatisfied_authorization
        //   chainId: chain.chainId,
        //   expireInSeconds: 1200
        // };
        // const Eos = require('eosjs');
        // let eos = Eos(config);

        // rawTx = await eos.transaction({
        //   actions: self.actions
        // },
        //   {
        //     // keyProvider: this provides a temporary key for a single action or transaction
        //     keyProvider: privateKeys,
        //     broadcast: false,
        //     sign: true,
        //     blocksBehind: 3,
        //     expireSeconds: 30
        //   }
        // );
        // resolve(rawTx.transaction);
        resolve(rawTx);
      } catch (err) {
        console.log("signTransDebug failed: ", err);
        reject(err);
      }
    })
  }

  checkDateParse(date) {
    const result = Date.parse(date);
    if (Number.isNaN(result)) {
        throw new Error('Invalid time format');
    }
    return result;
  }

  timePointSecToDate(sec) {
    const s = (new Date(sec * 1000)).toISOString();
    return s.substr(0, s.length - 1).split('.')[0];
  }

  dateToTimePointSec(date) {
    return Math.round(this.checkDateParse(date + 'Z') / 1000);
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
                    // let trans = await chain.packTrans(self.actions);
                    // console.log("packTrans:", trans);
                    // let pubKey = await chain.getRequiredKeys(trans, pubKeys);
                    // console.log("getRequiredKeys:", pubKey);
                    // // [ 'EOS7ukAahTjjjMVdjDxpZXahfBAPhCJbXUHcJciyVeB1apBzz6dW9' ]
                    // let chainId = await chain.getNetworkId();
                    // if (pubKey && pubKey.required_keys) {
                    //   keosd.sign_transaction(trans, pubKey.required_keys, chainId, (err, signTx) => {
                    //     if (err) {
                    //       console.log("sign_transaction.error:", err);
                    //       reject(err);
                    //     } else {
                    //       console.log("sign_transaction:", signTx);
                    //       let signed_tx = {
                    //         compression: 'none',
                    //         transaction: trans,
                    //         signatures: signTx.signatures
                    //       }
                    //       resolve(signed_tx);
                    //     }
                    //   });
                    // }


                    let blocksBehind = 3;
                    let expireSeconds = 3000;
                    let info = await chain.get_info();
                    let refBlock = await chain.client.rpc.get_block(info.head_block_num - blocksBehind);
                    let chainId = info.chain_id;

                    // let rawAbi = await chain.get_rawabi_and_abi('wanchainhtlc');
                    // console.log(rawAbi);
                    
                    // let nodeUrl = "http://jungle2.cryptolions.io:80";
                    // const rpc = new JsonRpc(nodeUrl, { fetch });
                    // const api = new Api({ rpc, authorityProvider: rpc, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

                    
                    let trans = {
                      "max_net_usage_words": 0,
                      "max_cpu_usage_ms": 0,
                      "compression": 'none', 
                      "delay_sec": 0,
                      "context_free_actions": [],
                      "transaction_extensions": [],
                      "actions": self.actions
                    }
                
                    trans.expiration= this.timePointSecToDate(this.dateToTimePointSec(refBlock.timestamp) + expireSeconds);
                    trans.ref_block_num= refBlock.block_num & 0xffff;
                    trans.ref_block_prefix= refBlock.ref_block_prefix;
                    trans.actions = await chain.serializeActions(trans.actions);

                    let requireKeys = await chain.getRequiredKeys(trans, pubKeys);
                    console.log("getRequiredKeys:", requireKeys);

                    if (requireKeys) {
                      keosd.sign_transaction(trans, requireKeys, chainId, async (err, signTx) => {
                        if (err) {
                          console.log("sign_transaction.error:", err);
                          reject(err);
                        } else {
                          console.log("sign_transaction:", signTx);
      
                          let sig = {};
                          sig.signatures = signTx.signatures;
                          sig.serializedTransaction = await chain.serializeTransaction(trans);

                          resolve(sig);
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
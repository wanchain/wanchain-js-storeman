var keosd = require("./keosd");

// keosd --plugin eosio::wallet_api_plugin --http-server-address 0.0.0.0:9999

/* create wallet */
// keosd.create("hhh", (err, result) => {
//   if (err) {
//     console.log("create.error:", err);
//   } else {
//     console.log("create:", result);
//   }
// });

/* lock wallet */
keosd.lock("wl", (err, result) => {
  if (err) {
    console.log("lock.error:", err);
  } else {
    console.log("lock:", result);
  }
});

/* lock all wallet */
// keosd.lock_all((err, result) => {
//   if (err) {
//     console.log("lock_all.error:", err);
//   } else {
//     console.log("lock_all:", result);
//   }
// });

/* unlock wallet */
keosd.unlock("wl", "PW5HzVg1haAHL5cBPC47TKfLUCZ8svNF27rQPmH6JFp8vQS9MBmAD", (err, result) => {
  if (err) {
    console.log("unlock.error:", err);
  } else {
    console.log("unlock:", result);
  }
});

/* unlock wallet */
keosd.unlock("wl", "PW5HzVg1haAHL5cBPC47TKfLUCZ8svNF27rQPmH6JFp8vQS9MBmAD", (err, result) => {
  if (err) {
    console.log("unlock.error:", err);
  } else {
    console.log("unlock:", result);
  }
});

/* create key */
// keosd.create_key("wl", "K1", (err, result) => {
//   if (err) {
//     console.log("create_key.error:", err);
//   } else {
//     console.log("create_key:", result);
//   }
// });

/* import private key */
// // keosd.import_key("wl", "5HuoLRVQScajQ8q9iTZoFtYbk86umrQ96RZMhfXXsdAcL8bgtYF", (err, result) => {
// //   if (err) {
// //     console.log("import_key.error:", err);
// //   } else {
// //     console.log("import_key:", result);
// //   }
// // });

/* list wallets */
// keosd.list_wallets((err, result) => {
//   if (err) {
//     console.log("list_wallets.error:", err);
//   } else {
//     console.log("list_wallets:", result);
//   }
// });

/* list keys */
// keosd.list_keys("wl", "PW5HzVg1haAHL5cBPC47TKfLUCZ8svNF27rQPmH6JFp8vQS9MBmAD", (err, result) => {
//   if (err) {
//     console.log("list_keys.error:", err);
//   } else {
//     console.log("list_keys:", result);
//   }
// });

/* set wallet timeout seconds */
// keosd.set_timeout(9999999999999999, (err, result) => {
//   if (err) {
//     console.log("set_timeout.error:", err);
//   } else {
//     console.log("set_timeout:", result);
//   }
// });

/* get public keys */
keosd.get_public_keys((err, pubKeys) => {
  if (err) {
    console.log("get_public_keys.error:", err);
    return;
  }
  console.log("get_public_keys:", pubKeys);
});// get_public_keys

/* sign transaction and push transaction */
{
  var EOS = require("eosjs");

  function getEosAbi(nodeUrl, callback) {
    return new EOS({
      keyProvider: [],// private key
      httpEndpoint: nodeUrl,
      verbose: false, // API activity
    });
  }
  var eos = getEosAbi("http://192.168.1.58:8888");

  eos.getInfo((err, info) => {
    if (err) {
      console.log("getInfo.error:", err);
      return;
    }
    // console.log("getInfo:", info);

    var chainId = info.chain_id;

    eos.abiJsonToBin("eosio.token", "transfer", ["alice","bob", "1.0000 EOS", "test1"], (err, binData) => {
      if (err) {
        console.log("abiJsonToBin.error:", err);
        return;
      }
      console.log("abiJsonToBin:", binData.binargs);

      eos.getBlock(info.head_block_num, (err, block) => {
        if (err) {
          console.log("getBlock.error:", err);
          return;
        }

        let expireSeconds = 100;// 设置过期时间
        let blockTime = new Date(info.head_block_time).getTime();// 获得引用区块的时间
        let timezone = new Date(blockTime + 8*60*60*1000).getTime();// 获得+8时区时间
        let expired = new Date(timezone + expireSeconds * 1000);// 获得过期时间
        let expiration = expired.toISOString().split('.')[0];// 转换一下，得到合适的值
        console.log("expiration:", expiration);
        let tx = {
          "max_net_usage_words": 0,
          "max_cpu_usage_ms": 0,
          "delay_sec": 0,
          "context_free_actions": [],
          "actions": [{
            "account": "eosio.token",
            "name": "transfer",
            "authorization": [{
              "actor": "alice",
              "permission": "active"
            }],
            "data": binData.binargs
          }],
          "transaction_extensions": [],
          "expiration": expiration,
          "ref_block_num": block.block_num & 0xffff,
          "ref_block_prefix": block.ref_block_prefix
        };

        eos.getAccount("alice", (err, alice) => {
          if (err) {
            console.log("getAccount alice.error:", err);
            return;
          }
          // console.log("getAccount alice:", alice);


          var permission = alice.permissions.filter(p => {
            return p.perm_name === "active";
          })[0].required_auth.keys.map(v => v.key );
          // console.log("active permission info :", permission);

          keosd.sign_transaction(tx, permission, chainId, (err, signTx) => {
            if (err) {
              console.log("sign_transaction.error:", err);
              return;
            }
            console.log("sign_transaction:", signTx);

            console.log("==================before push transaction===================");
            eos.getAccount("alice", (err, alice) => {
              console.log("before push transaction => alice => ", err, alice.core_liquid_balance);
              eos.getAccount("bob", (err, bob) => {
                console.log("before push transaction => bob => ", err, bob.core_liquid_balance);
                console.log("============================================================");

                eos.pushTransaction({
                  compression: 'none', transaction: tx, signatures: signTx.signatures
                }, (err, result) => {
                  if (err) {
                    console.log("pushTransaction.error:", err);
                    return;
                  }
                  console.log("pushTransaction:", result);
                  console.log("==================after push transaction===================");
                  eos.getAccount("alice", (err, alice) => {
                    console.log("after push transaction => alice => ", err, alice.core_liquid_balance);
                    eos.getAccount("bob", (err, bob) => {
                      console.log("after push transaction => bob => ", err, bob.core_liquid_balance);
                      console.log("============================================================");
                    });// getAccount
                  });// getAccount
                });// pushTransaction
              });// getAccount
            });//getAccount

          });// sign_transaction

        });//getAccount

      });// getBlock

    });// abiJsonToBin

  });// getInfo
}

/* signed transaction
{ expiration: '2019-10-22T09:50:28',
  ref_block_num: 10614,
  ref_block_prefix: 2874033202,
  max_net_usage_words: 0,
  max_cpu_usage_ms: 0,
  delay_sec: 0,
  context_free_actions: [],
  actions: 
   [ { account: 'eosio.token',
       name: 'transfer',
       authorization: [Array],
       data: '0000000000855c340000000000000e3d102700000000000004454f5300000000057465737431' } ],
  transaction_extensions: [],
  signatures: 
   [ 'SIG_K1_JxovMc1GSS6p4CxgSYrtN7K6bzuCnWS37RjFn8K87s98PwQE8oNtEvx5WCdFDJuso4PKhKr1jkGUMhBbK5nsMWaL6SYWAy' ],
  context_free_data: [] }
*/

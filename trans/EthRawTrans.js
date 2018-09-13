"use strict"

let ethTx = require('ethereumjs-tx');
let keyStore = require("utils/keyStore.js");

module.exports = class EthRawTrans {
	constructor(from, to, gas, gasPrice, nonce, value) {
		this.txParams = {
			from: from,
			to: to,
			gasPrice: Number(gasPrice),
			gasLimit: Number(gas),
			nonce: nonce,
			value: value
		};
	}

	setData(data){
		this.data = data;
		this.txParams.data = data;
	}

	setValue(value)
    {
        this.value = value;
        this.txParams.value = value;
    }

    serialize(signature) {
		let tx;
		tx = new ethTx(this.txParams);
		Object.assign(tx, sig);
		
		const serializedTx = tx.serialize();
		return '0x' + serializedTx.toString('hex');
    }

	sign(privateKey){
		let tx;
		tx = new ethTx(this.txParams);
		// console.log("++++++++++++++++++++++++++++++ tx ++++++++++++++++++++++++++++++++++", tx);
		tx.sign(privateKey);
		// console.log("++++++++++++++++++++++++++++++ tx ++++++++++++++++++++++++++++++++++", tx);
		const serializedTx = tx.serialize();
		return '0x' + serializedTx.toString('hex');
	}

	signFromKeystore(password, keyStoreDir = null){
		let privateKey;
		if (keyStoreDir === null) {
			privateKey = keyStore.getPrivateKey(this.txParams.from, password);
		} else {
			privateKey = keyStoreDir.getAccount(this.txParams.from).getPrivateKey(password);
		}
		console.log("++++++++++++++++++++++++++++++ privateKey ++++++++++++++++++++++++++++++++++", privateKey);
		if(privateKey){
			return this.sign(privateKey);
		} else {
			return null;
		}
	}
}
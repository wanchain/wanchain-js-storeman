"use strict"

const EthRawTrans = require('./EthRawTrans.js');
let wanUtil = require('wanchain-util');

module.exports = class WanRawTrans extends EthRawTrans {
	constructor(from, to, gas, gasPrice, nonce, value) {
		super(from, to, gas, gasPrice, nonce, value);
		this.txType = '0x01';
		this.txParams = {
			from: from,
			to: to,
			gasPrice: gasPrice,
			gasLimit: gas,
			nonce: nonce,
			Txtype: this.txType,
			value: value
		};

		this.txParams.gasPrice = '0x' + this.txParams.gasPrice.toString(16);
		console.log("..............WanRawTrans gasPrice", this.txParams.gasPrice);
		this.txParams.gasLimit = '0x' + this.txParams.gasLimit.toString(16);
        console.log("..............WanRawTrans gasLimit", this.txParams.gasLimit);
	}

	sign(privateKey){
		let tx;
		let wanTx = wanUtil.wanchainTx;
		tx = new wanTx(this.txParams);
		tx.sign(privateKey);
		const serializedTx = tx.serialize();
		return '0x' + serializedTx.toString('hex');
	}
}
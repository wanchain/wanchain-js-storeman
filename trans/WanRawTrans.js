"use strict"

const EthRawTrans = require('trans/EthRawTrans.js');
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
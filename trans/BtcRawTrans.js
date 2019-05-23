"use strict"

module.exports = class BtcRawTrans {
  constructor(from, to, value) {
    this.txParams = [from, to, value, ''];
  }

  setData(data) {
    this.actions = data;
    // this.txParams.data = data;
  }

  setValue(value) {
    this.value = value;
    // this.txParams.value = value;
  }
}
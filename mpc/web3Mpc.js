"use strict"

module.exports = {
	extend: (web3) => {
        function insertMethod(name, call, params, inputFormatter, outputFormatter) {
            return new web3._extend.Method({ name, call, params, inputFormatter, outputFormatter });
        }

        function insertProperty(name, getter, outputFormatter) {
            return new web3._extend.Property({ name, getter, outputFormatter });
        }

        web3._extend({
        	property: 'storeman',
        	methods:
        	[
        		insertMethod('addValidMpcTx', 'storeman_addValidMpcTx', 1, [null], null),
        		insertMethod('signMpcTransaction', 'storeman_signMpcTransaction', 1, [null], null),
        		insertMethod('addValidData', 'storeman_addValidData', 1, [null], null),
        		insertMethod('signData', 'storeman_signData', 1, [null], null),
        		insertMethod('signDataByApprove', 'storeman_signDataByApprove', 1, [null], null),
        		insertMethod('getDataForApprove', 'storeman_getDataForApprove', 1, [null], null),
        		insertMethod('approveData', 'storeman_approveData', 1, [null], null),
			insertMethod('freshGrpInfo', 'storeman_freshGrpInfo', 0, null, null),
        	],
        	properties:[],
        });	
	}
};

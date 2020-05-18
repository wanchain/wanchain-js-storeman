const mortgageAbi = [
    {
        "constant": true,
        "inputs": [],
        "name": "tokenManager",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "badAddrs",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [],
        "name": "acceptOwnership",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_newOwner",
                "type": "address"
            }
        ],
        "name": "changeOwner",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "badTypes",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "halted",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "newOwner",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "htlc",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "groups",
        "outputs": [
            {
                "name": "groupId",
                "type": "bytes32"
            },
            {
                "name": "txFeeRatio",
                "type": "uint256"
            },
            {
                "name": "memberCountDesign",
                "type": "uint256"
            },
            {
                "name": "threshold",
                "type": "uint256"
            },
            {
                "name": "status",
                "type": "uint8"
            },
            {
                "name": "deposit",
                "type": "uint256"
            },
            {
                "name": "depositWeight",
                "type": "uint256"
            },
            {
                "name": "unregisterApplyTime",
                "type": "uint256"
            },
            {
                "name": "memberCount",
                "type": "uint256"
            },
            {
                "name": "whiteCount",
                "type": "uint256"
            },
            {
                "name": "chain",
                "type": "bytes"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "halt",
                "type": "bool"
            }
        ],
        "name": "setHalt",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "name": "tokenOrigAccount",
                "type": "bytes"
            },
            {
                "indexed": false,
                "name": "storemanGroup",
                "type": "bytes"
            },
            {
                "indexed": false,
                "name": "wanDeposit",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "quota",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "txFeeRatio",
                "type": "uint256"
            }
        ],
        "name": "StoremanGroupRegistrationLogger",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "name": "tokenOrigAccount",
                "type": "bytes"
            },
            {
                "indexed": false,
                "name": "storemanGroup",
                "type": "bytes"
            },
            {
                "indexed": false,
                "name": "isEnable",
                "type": "bool"
            }
        ],
        "name": "SetWhiteListLogger",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "name": "tokenOrigAccount",
                "type": "bytes"
            },
            {
                "indexed": false,
                "name": "storemanGroup",
                "type": "bytes"
            },
            {
                "indexed": false,
                "name": "applyTime",
                "type": "uint256"
            }
        ],
        "name": "StoremanGroupApplyUnRegistrationLogger",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "name": "tokenOrigAccount",
                "type": "bytes"
            },
            {
                "indexed": false,
                "name": "storemanGroup",
                "type": "bytes"
            },
            {
                "indexed": false,
                "name": "actualReturn",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "deposit",
                "type": "uint256"
            }
        ],
        "name": "StoremanGroupWithdrawLogger",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "name": "tokenOrigAccount",
                "type": "bytes"
            },
            {
                "indexed": false,
                "name": "storemanGroup",
                "type": "bytes"
            },
            {
                "indexed": false,
                "name": "wanDeposit",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "quota",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "txFeeRatio",
                "type": "uint256"
            }
        ],
        "name": "StoremanGroupUpdateLogger",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "index",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "name": "pkAddr",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "enodeID",
                "type": "bytes"
            }
        ],
        "name": "stakeInEvent",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "index",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "delegatorCount",
                "type": "uint256"
            }
        ],
        "name": "incentive",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "groupId",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "name": "count",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "members",
                "type": "address[]"
            }
        ],
        "name": "selectedEvent",
        "type": "event"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "tmAddr",
                "type": "address"
            },
            {
                "name": "htlcAddr",
                "type": "address"
            }
        ],
        "name": "setDependence",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "backup",
                "type": "uint256"
            }
        ],
        "name": "setBackupCount",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getBackupCount",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "groupId",
                "type": "bytes32"
            },
            {
                "name": "memberCountDesign",
                "type": "uint256"
            },
            {
                "name": "threshold",
                "type": "uint256"
            },
            {
                "name": "workStart",
                "type": "uint256"
            },
            {
                "name": "workDuration",
                "type": "uint256"
            },
            {
                "name": "registerDuration",
                "type": "uint256"
            },
            {
                "name": "crossFee",
                "type": "uint256"
            },
            {
                "name": "preGroupId",
                "type": "bytes32"
            },
            {
                "name": "chain",
                "type": "bytes"
            },
            {
                "name": "wkAddrs",
                "type": "address[]"
            },
            {
                "name": "senders",
                "type": "address[]"
            }
        ],
        "name": "registerStart",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "index",
                "type": "bytes32"
            },
            {
                "name": "PK",
                "type": "bytes"
            },
            {
                "name": "enodeID",
                "type": "bytes"
            },
            {
                "name": "delegateFee",
                "type": "uint256"
            }
        ],
        "name": "stakeIn",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "index",
                "type": "bytes32"
            },
            {
                "name": "pkAddr",
                "type": "address"
            }
        ],
        "name": "getStaker",
        "outputs": [
            {
                "name": "",
                "type": "bytes"
            },
            {
                "name": "",
                "type": "uint256"
            },
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "p",
                "type": "uint256"
            },
            {
                "name": "deposit",
                "type": "uint256"
            },
            {
                "name": "isDelegator",
                "type": "bool"
            }
        ],
        "name": "calIncentive",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "deposit",
                "type": "uint256"
            }
        ],
        "name": "calSkWeight",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "index",
                "type": "bytes32"
            }
        ],
        "name": "testIncentiveAll",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "index",
                "type": "bytes32"
            },
            {
                "name": "skPkAddr",
                "type": "address"
            }
        ],
        "name": "addDelegator",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "groupId",
                "type": "bytes32"
            }
        ],
        "name": "getSelectedSmNumber",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "groupId",
                "type": "bytes32"
            }
        ],
        "name": "toSelect",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "groupId",
                "type": "bytes32"
            },
            {
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "getSelectedSmInfo",
        "outputs": [
            {
                "name": "",
                "type": "address"
            },
            {
                "name": "",
                "type": "bytes"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "groupId",
                "type": "bytes32"
            },
            {
                "name": "wkAddress",
                "type": "address"
            }
        ],
        "name": "getSmInfo",
        "outputs": [
            {
                "name": "sender",
                "type": "address"
            },
            {
                "name": "PK",
                "type": "bytes"
            },
            {
                "name": "quited",
                "type": "bool"
            },
            {
                "name": "isWorking",
                "type": "bool"
            },
            {
                "name": "delegateFee",
                "type": "uint256"
            },
            {
                "name": "deposit",
                "type": "uint256"
            },
            {
                "name": "depositWeight",
                "type": "uint256"
            },
            {
                "name": "incentive",
                "type": "uint256"
            },
            {
                "name": "delegatorCount",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "groupId",
                "type": "bytes32"
            },
            {
                "name": "gpk",
                "type": "bytes"
            }
        ],
        "name": "setGpk",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "types",
                "type": "uint256[]"
            },
            {
                "name": "addrs",
                "type": "address[]"
            }
        ],
        "name": "testArray",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "groupId",
                "type": "bytes32"
            },
            {
                "name": "slashType",
                "type": "uint256[]"
            },
            {
                "name": "badAddrs",
                "type": "address[]"
            }
        ],
        "name": "setInvalidSm",
        "outputs": [
            {
                "name": "isContinue",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "groupId",
                "type": "bytes32"
            }
        ],
        "name": "getThresholdNumber",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "tokenOrigAccount",
                "type": "bytes"
            },
            {
                "name": "storemanGroup",
                "type": "bytes"
            },
            {
                "name": "txFeeRatio",
                "type": "uint256"
            }
        ],
        "name": "storemanGroupRegister",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "tokenOrigAccount",
                "type": "bytes"
            },
            {
                "name": "storemanGroup",
                "type": "bytes"
            }
        ],
        "name": "storemanGroupUnregister",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "tokenOrigAccount",
                "type": "bytes"
            },
            {
                "name": "storemanGroup",
                "type": "bytes"
            }
        ],
        "name": "storemanGroupWithdrawDeposit",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "tokenOrigAccount",
                "type": "bytes"
            },
            {
                "name": "storemanGroup",
                "type": "bytes"
            }
        ],
        "name": "storemanGroupAppendDeposit",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "tokenOrigAccount",
                "type": "bytes"
            },
            {
                "name": "storemanGroup",
                "type": "bytes"
            }
        ],
        "name": "getStoremanGroupInfo",
        "outputs": [
            {
                "name": "",
                "type": "address"
            },
            {
                "name": "",
                "type": "uint256"
            },
            {
                "name": "",
                "type": "uint256"
            },
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [],
        "name": "contribute",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    }
];
const createGpkAbi = "";
const metricAbi = [
    {
        "constant": true,
        "inputs": [],
        "name": "config",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [],
        "name": "acceptOwnership",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "mortgage",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_newOwner",
                "type": "address"
            }
        ],
        "name": "changeOwner",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "halted",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "newOwner",
        "outputs": [
            {
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "halt",
                "type": "bool"
            }
        ],
        "name": "setHalt",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "grpId",
                "type": "bytes"
            },
            {
                "indexed": true,
                "name": "hashX",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "name": "smIndex",
                "type": "uint8"
            },
            {
                "indexed": false,
                "name": "slshReason",
                "type": "uint8"
            }
        ],
        "name": "SMSlshLogger",
        "type": "event"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "grpId",
                "type": "bytes"
            },
            {
                "name": "startEpId",
                "type": "uint256"
            },
            {
                "name": "endEpId",
                "type": "uint256"
            }
        ],
        "name": "getPrdInctMetric",
        "outputs": [
            {
                "name": "",
                "type": "uint256[]"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "grpId",
                "type": "bytes"
            },
            {
                "name": "startEpId",
                "type": "uint256"
            },
            {
                "name": "endEpId",
                "type": "uint256"
            }
        ],
        "name": "getPrdSlshMetric",
        "outputs": [
            {
                "name": "",
                "type": "uint256[]"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "grpId",
                "type": "bytes"
            },
            {
                "name": "epId",
                "type": "uint256"
            },
            {
                "name": "smIndex",
                "type": "uint8"
            }
        ],
        "name": "getSmSuccCntByEpId",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "grpId",
                "type": "bytes"
            },
            {
                "name": "epId",
                "type": "uint256"
            },
            {
                "name": "smIndex",
                "type": "uint8"
            }
        ],
        "name": "getSlshCntByEpId",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "grpId",
                "type": "bytes"
            },
            {
                "name": "hashX",
                "type": "bytes32"
            },
            {
                "name": "smIndex",
                "type": "uint8"
            },
            {
                "name": "slshReason",
                "type": "uint8"
            }
        ],
        "name": "getRSlshProof",
        "outputs": [
            {
                "components": [
                    {
                        "components": [
                            {
                                "name": "polyData",
                                "type": "bytes"
                            },
                            {
                                "name": "polyDataR",
                                "type": "bytes"
                            },
                            {
                                "name": "polyDataS",
                                "type": "bytes"
                            }
                        ],
                        "name": "polyDataPln",
                        "type": "tuple"
                    },
                    {
                        "name": "m",
                        "type": "bytes"
                    },
                    {
                        "name": "rpkShare",
                        "type": "bytes"
                    },
                    {
                        "name": "gpkShare",
                        "type": "bytes"
                    },
                    {
                        "name": "sndrIndex",
                        "type": "uint8"
                    },
                    {
                        "name": "rcvrIndex",
                        "type": "uint8"
                    },
                    {
                        "name": "becauseSndr",
                        "type": "bool"
                    }
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "grpId",
                "type": "bytes"
            },
            {
                "name": "hashX",
                "type": "bytes32"
            },
            {
                "name": "smIndex",
                "type": "uint8"
            },
            {
                "name": "slshReason",
                "type": "uint8"
            }
        ],
        "name": "getSSlshProof",
        "outputs": [
            {
                "components": [
                    {
                        "components": [
                            {
                                "name": "polyCM",
                                "type": "bytes"
                            },
                            {
                                "name": "polyCMR",
                                "type": "bytes"
                            },
                            {
                                "name": "polyCMS",
                                "type": "bytes"
                            }
                        ],
                        "name": "polyCMData",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "name": "polyData",
                                "type": "bytes"
                            },
                            {
                                "name": "polyDataR",
                                "type": "bytes"
                            },
                            {
                                "name": "polyDataS",
                                "type": "bytes"
                            }
                        ],
                        "name": "polyDataPln",
                        "type": "tuple"
                    },
                    {
                        "name": "sndrIndex",
                        "type": "uint8"
                    },
                    {
                        "name": "rcvrIndex",
                        "type": "uint8"
                    },
                    {
                        "name": "becauseSndr",
                        "type": "bool"
                    }
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "grpId",
                "type": "bytes"
            },
            {
                "name": "hashX",
                "type": "bytes32"
            },
            {
                "name": "inctData",
                "type": "uint256"
            }
        ],
        "name": "wrInct",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "grpId",
                "type": "bytes"
            },
            {
                "name": "hashX",
                "type": "bytes32"
            },
            {
                "name": "rnwData",
                "type": "uint256"
            }
        ],
        "name": "wrRNW",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "grpId",
                "type": "bytes"
            },
            {
                "name": "hashX",
                "type": "bytes32"
            },
            {
                "name": "snwData",
                "type": "uint256"
            }
        ],
        "name": "wrSNW",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "grpId",
                "type": "bytes"
            },
            {
                "name": "hashX",
                "type": "bytes32"
            },
            {
                "name": "sndrAndRcvrIndex",
                "type": "uint8[2]"
            },
            {
                "name": "becauseSndr",
                "type": "bool"
            },
            {
                "name": "polyCM",
                "type": "bytes"
            },
            {
                "name": "polyCMR",
                "type": "bytes"
            },
            {
                "name": "polyCMS",
                "type": "bytes"
            }
        ],
        "name": "wrRSlshPolyCM",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "grpId",
                "type": "bytes"
            },
            {
                "name": "hashX",
                "type": "bytes32"
            },
            {
                "name": "sndrAndRcvrIndex",
                "type": "uint8[2]"
            },
            {
                "name": "becauseSndr",
                "type": "bool"
            },
            {
                "name": "polyData",
                "type": "bytes"
            },
            {
                "name": "polyDataR",
                "type": "bytes"
            },
            {
                "name": "polyDataS",
                "type": "bytes"
            }
        ],
        "name": "wrRSlshPolyData",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "grpId",
                "type": "bytes"
            },
            {
                "name": "hashX",
                "type": "bytes32"
            },
            {
                "name": "sndrAndRcvrIndex",
                "type": "uint8[2]"
            },
            {
                "name": "becauseSndr",
                "type": "bool"
            },
            {
                "name": "gpkShare",
                "type": "bytes"
            },
            {
                "name": "rpkShare",
                "type": "bytes"
            },
            {
                "name": "m",
                "type": "bytes"
            }
        ],
        "name": "wrSSlshShare",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "grpId",
                "type": "bytes"
            },
            {
                "name": "hashX",
                "type": "bytes32"
            },
            {
                "name": "sndrAndRcvrIndex",
                "type": "uint8[2]"
            },
            {
                "name": "becauseSndr",
                "type": "bool"
            },
            {
                "name": "polyData",
                "type": "bytes"
            },
            {
                "name": "polyDataR",
                "type": "bytes"
            },
            {
                "name": "polyDataS",
                "type": "bytes"
            }
        ],
        "name": "wrSSlshPolyPln",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "grpId",
                "type": "bytes"
            },
            {
                "name": "hashX",
                "type": "bytes32"
            },
            {
                "name": "smIndex",
                "type": "uint8"
            }
        ],
        "name": "checkRProof",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "configAddr",
                "type": "address"
            },
            {
                "name": "mortgageAddr",
                "type": "address"
            }
        ],
        "name": "setDependence",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const abiMap = {
    "CreateGpk": createGpkAbi,
    "Mortgage": mortgageAbi,
    "Metric": metricAbi
};

let metricCfg = {};
global.testnet = true;
(function () {
    if (typeof(global.testnet) == undefined) {
        global.testnet = true;
    }
    if (global.testnet) {
        console.log("use testnet config");
        metricCfg = require('./config-testnet');
    } else {
        console.log("use main config");
        metricCfg = require('./config-main');
    }
})();

module.exports = {metricCfg, abiMap};

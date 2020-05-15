const mortgageAbi = "";
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

let grpBuildCfg = {};
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

module.exports = {grpBuildCfg, abiMap};

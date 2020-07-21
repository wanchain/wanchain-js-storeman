const tmAbi=[
    {
        "constant": true,
        "inputs": [],
        "name": "MIN_WITHDRAW_WINDOW",
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
        "inputs": [],
        "name": "DEFAULT_PRECISE",
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
        "name": "MIN_DEPOSIT",
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
        "name": "htlcAddr",
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
                "name": "ratio",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "minDeposit",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "withdrawDelayTime",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "name",
                "type": "bytes"
            },
            {
                "indexed": false,
                "name": "symbol",
                "type": "bytes"
            },
            {
                "indexed": false,
                "name": "decimals",
                "type": "uint8"
            },
            {
                "indexed": false,
                "name": "tokenWanAddr",
                "type": "address"
            }
        ],
        "name": "TokenAddedLogger",
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
                "name": "ratio",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "minDeposit",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "withdrawDelayTime",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "name",
                "type": "bytes"
            },
            {
                "indexed": false,
                "name": "symbol",
                "type": "bytes"
            },
            {
                "indexed": false,
                "name": "decimals",
                "type": "uint8"
            },
            {
                "indexed": false,
                "name": "tokenWanAddr",
                "type": "address"
            }
        ],
        "name": "TokenUpdatedLogger",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "name": "tokenOrigAccount",
                "type": "bytes"
            }
        ],
        "name": "TokenRemovedLogger",
        "type": "event"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "tokenOrigAccount",
                "type": "bytes"
            }
        ],
        "name": "isTokenRegistered",
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
        "constant": false,
        "inputs": [
            {
                "name": "tokenOrigAccount",
                "type": "bytes"
            },
            {
                "name": "token2WanRatio",
                "type": "uint256"
            },
            {
                "name": "minDeposit",
                "type": "uint256"
            },
            {
                "name": "withdrawDelayTime",
                "type": "uint256"
            },
            {
                "name": "name",
                "type": "bytes"
            },
            {
                "name": "symbol",
                "type": "bytes"
            },
            {
                "name": "decimals",
                "type": "uint8"
            }
        ],
        "name": "addToken",
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
            }
        ],
        "name": "removeToken",
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
                "name": "token2WanRatio",
                "type": "uint256"
            },
            {
                "name": "minDeposit",
                "type": "uint256"
            },
            {
                "name": "withdrawDelayTime",
                "type": "uint256"
            },
            {
                "name": "name",
                "type": "bytes"
            },
            {
                "name": "symbol",
                "type": "bytes"
            },
            {
                "name": "decimals",
                "type": "uint8"
            },
            {
                "name": "tokenWanAddr",
                "type": "address"
            }
        ],
        "name": "updateToken",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "tokenOrigAccount",
                "type": "bytes"
            }
        ],
        "name": "getTokenInfo",
        "outputs": [
            {
                "name": "",
                "type": "bytes"
            },
            {
                "name": "",
                "type": "bytes"
            },
            {
                "name": "",
                "type": "uint8"
            },
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
                "name": "tokenOrigAccount",
                "type": "bytes"
            },
            {
                "name": "recipient",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "mintToken",
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
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "burnToken",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "addr",
                "type": "address"
            }
        ],
        "name": "setHtlcAddr",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];
const htlcAbi=[
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
        "constant": false,
        "inputs": [
            {
                "name": "tokenOrigAccount",
                "type": "bytes"
            },
            {
                "name": "xHash",
                "type": "bytes32"
            },
            {
                "name": "wanAddr",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            },
            {
                "name": "storemanGroupPK",
                "type": "bytes"
            },
            {
                "name": "r",
                "type": "bytes"
            },
            {
                "name": "s",
                "type": "bytes32"
            }
        ],
        "name": "inSmgLock",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "xHash",
                "type": "bytes32"
            },
            {
                "name": "value",
                "type": "uint256"
            },
            {
                "name": "tokenOrigAccount",
                "type": "bytes"
            },
            {
                "name": "userOrigAccount",
                "type": "bytes"
            },
            {
                "name": "storemanGroupPK",
                "type": "bytes"
            }
        ],
        "name": "outUserLock",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "x",
                "type": "bytes32"
            }
        ],
        "name": "inUserRedeem",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "x",
                "type": "bytes32"
            }
        ],
        "name": "outSmgRedeem",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "xHash",
                "type": "bytes32"
            }
        ],
        "name": "inSmgRevoke",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "xHash",
                "type": "bytes32"
            }
        ],
        "name": "outUserRevoke",
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
                "name": "xHash",
                "type": "bytes32"
            },
            {
                "name": "srcStoremanPK",
                "type": "bytes"
            },
            {
                "name": "value",
                "type": "uint256"
            },
            {
                "name": "dstStoremanPK",
                "type": "bytes"
            },
            {
                "name": "r",
                "type": "bytes"
            },
            {
                "name": "s",
                "type": "bytes32"
            }
        ],
        "name": "inDebtLock",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "x",
                "type": "bytes32"
            }
        ],
        "name": "inDebtRedeem",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "xHash",
                "type": "bytes32"
            }
        ],
        "name": "inDebtRevoke",
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
                "name": "storemanGroupPK",
                "type": "bytes"
            },
            {
                "name": "quota",
                "type": "uint256"
            },
            {
                "name": "txFeeRatio",
                "type": "uint256"
            }
        ],
        "name": "addStoremanGroup",
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
                "name": "storemanGroupPK",
                "type": "bytes"
            }
        ],
        "name": "deactivateStoremanGroup",
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
                "name": "storemanGroupPK",
                "type": "bytes"
            }
        ],
        "name": "delStoremanGroup",
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
                "name": "storemanGroupPK",
                "type": "bytes"
            },
            {
                "name": "quota",
                "type": "uint256"
            }
        ],
        "name": "updateStoremanGroup",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "storemanGroupPK",
                "type": "bytes"
            },
            {
                "name": "timeStamp",
                "type": "uint256"
            },
            {
                "name": "receiver",
                "type": "address"
            },
            {
                "name": "r",
                "type": "bytes"
            },
            {
                "name": "s",
                "type": "bytes32"
            }
        ],
        "name": "smgWithdrawFee",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "tokenManagerAddr",
                "type": "address"
            },
            {
                "name": "storemanGroupAdminAddr",
                "type": "address"
            },
            {
                "name": "ratio",
                "type": "uint256"
            }
        ],
        "name": "setEconomics",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getEconomics",
        "outputs": [
            {
                "name": "",
                "type": "address"
            },
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
                "name": "tokenOrigAccount",
                "type": "bytes"
            },
            {
                "name": "storemanGroupPK",
                "type": "bytes"
            }
        ],
        "name": "queryStoremanGroupQuota",
        "outputs": [
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
        "constant": true,
        "inputs": [
            {
                "name": "storemanGroupPK",
                "type": "bytes"
            }
        ],
        "name": "getStoremanFee",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];
const abiMap = new Map([
    ["htlc",htlcAbi],
    ["tm",tmAbi],
]);
module.exports = abiMap;
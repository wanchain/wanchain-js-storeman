const smgAbi = require('./osmAbi.json')


const gpkAbi = [{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"groupMap","outputs":[{"name":"groupId","type":"bytes32"},{"name":"round","type":"uint16"},{"name":"curveTypes","type":"uint8"},{"name":"ployCommitPeriod","type":"uint32"},{"name":"defaultPeriod","type":"uint32"},{"name":"negotiatePeriod","type":"uint32"},{"name":"smNumber","type":"uint16"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"smg","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"storeman","type":"address"}],"name":"SetPolyCommitLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"src","type":"address"},{"indexed":false,"name":"dest","type":"address"}],"name":"SetEncSijLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"src","type":"address"},{"indexed":false,"name":"dest","type":"address"},{"indexed":false,"name":"isValid","type":"bool"}],"name":"SetCheckStatusLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"src","type":"address"},{"indexed":false,"name":"dest","type":"address"}],"name":"RevealSijLogger","type":"event"},{"constant":false,"inputs":[{"name":"smgAddr","type":"address"}],"name":"setDependence","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"ployCommitPeriod","type":"uint32"},{"name":"defaultPeriod","type":"uint32"},{"name":"negotiatePeriod","type":"uint32"}],"name":"setPeriod","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"curveId","type":"uint8"},{"name":"curveAddress","type":"address"}],"name":"setCurve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"polyCommit","type":"bytes"}],"name":"setPolyCommit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"}],"name":"polyCommitTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"dest","type":"address"},{"name":"encSij","type":"bytes"}],"name":"setEncSij","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"},{"name":"isValid","type":"bool"}],"name":"setCheckStatus","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"}],"name":"encSijTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"dest","type":"address"},{"name":"sij","type":"uint256"},{"name":"ephemPrivateKey","type":"uint256"}],"name":"revealSij","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"},{"name":"dest","type":"address"}],"name":"checkEncSijTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"}],"name":"SijTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"}],"name":"terminate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"int32"}],"name":"getGroupInfo","outputs":[{"name":"queriedRound","type":"uint16"},{"name":"curve1Status","type":"uint8"},{"name":"curve1StatusTime","type":"uint256"},{"name":"curve2Status","type":"uint8"},{"name":"curve2StatusTime","type":"uint256"},{"name":"ployCommitPeriod","type":"uint32"},{"name":"defaultPeriod","type":"uint32"},{"name":"negotiatePeriod","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"}],"name":"getPolyCommit","outputs":[{"name":"polyCommit","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"},{"name":"dest","type":"address"}],"name":"getEncSijInfo","outputs":[{"name":"encSij","type":"bytes"},{"name":"checkStatus","type":"uint8"},{"name":"setTime","type":"uint256"},{"name":"checkTime","type":"uint256"},{"name":"sij","type":"uint256"},{"name":"ephemPrivateKey","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"index","type":"uint16"}],"name":"getPkShare","outputs":[{"name":"pkShare1","type":"bytes"},{"name":"pkShare2","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"}],"name":"getGpk","outputs":[{"name":"gpk1","type":"bytes"},{"name":"gpk2","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"}];

const metricAbi = [{
    "constant": false,
    "inputs": [],
    "name": "acceptOwnership",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "constant": true,
    "inputs": [],
    "name": "owner",
    "outputs": [{"name": "", "type": "address"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}, {
    "constant": false,
    "inputs": [{"name": "_newOwner", "type": "address"}],
    "name": "changeOwner",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "constant": true,
    "inputs": [],
    "name": "halted",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}, {
    "constant": true,
    "inputs": [],
    "name": "newOwner",
    "outputs": [{"name": "", "type": "address"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}, {
    "constant": false,
    "inputs": [{"name": "halt", "type": "bool"}],
    "name": "setHalt",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}, {"payable": true, "stateMutability": "payable", "type": "fallback"}, {
    "anonymous": false,
    "inputs": [{"indexed": true, "name": "grpId", "type": "bytes32"}, {
        "indexed": true,
        "name": "hashX",
        "type": "bytes32"
    }, {"indexed": true, "name": "smIndex", "type": "uint8"}, {
        "indexed": false,
        "name": "slshReason",
        "type": "uint8"
    }],
    "name": "SMSlshLogger",
    "type": "event"
}, {
    "anonymous": false,
    "inputs": [{"indexed": false, "name": "slshWriter", "type": "address"}, {
        "indexed": true,
        "name": "grpId",
        "type": "bytes32"
    }, {"indexed": true, "name": "hashX", "type": "bytes32"}, {
        "indexed": true,
        "name": "smIndex",
        "type": "uint8"
    }, {"indexed": false, "name": "slshReason", "type": "uint8"}],
    "name": "SMInvSlshLogger",
    "type": "event"
}, {
    "constant": true,
    "inputs": [],
    "name": "getDependence",
    "outputs": [{"name": "", "type": "address"}, {"name": "", "type": "address"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}, {
    "constant": true,
    "inputs": [{"name": "grpId", "type": "bytes32"}, {"name": "startEpId", "type": "uint256"}, {
        "name": "endEpId",
        "type": "uint256"
    }],
    "name": "getPrdInctMetric",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}, {
    "constant": true,
    "inputs": [{"name": "grpId", "type": "bytes32"}, {"name": "startEpId", "type": "uint256"}, {
        "name": "endEpId",
        "type": "uint256"
    }],
    "name": "getPrdSlshMetric",
    "outputs": [{"name": "", "type": "uint256[]"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}, {
    "constant": true,
    "inputs": [{"name": "grpId", "type": "bytes32"}, {"name": "epId", "type": "uint256"}, {
        "name": "smIndex",
        "type": "uint8"
    }],
    "name": "getSmSuccCntByEpId",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}, {
    "constant": true,
    "inputs": [{"name": "grpId", "type": "bytes32"}, {"name": "epId", "type": "uint256"}, {
        "name": "smIndex",
        "type": "uint8"
    }],
    "name": "getSlshCntByEpId",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}, {
    "constant": true,
    "inputs": [{"name": "grpId", "type": "bytes32"}, {"name": "hashX", "type": "bytes32"}, {
        "name": "smIndex",
        "type": "uint8"
    }, {"name": "slshReason", "type": "uint8"}],
    "name": "getRSlshProof",
    "outputs": [{
        "components": [{
            "components": [{"name": "polyCM", "type": "bytes"}, {
                "name": "polyCMR",
                "type": "bytes"
            }, {"name": "polyCMS", "type": "bytes"}], "name": "polyCMData", "type": "tuple"
        }, {
            "components": [{"name": "polyData", "type": "bytes"}, {
                "name": "polyDataR",
                "type": "bytes"
            }, {"name": "polyDataS", "type": "bytes"}], "name": "polyDataPln", "type": "tuple"
        }, {"name": "sndrIndex", "type": "uint8"}, {"name": "rcvrIndex", "type": "uint8"}, {
            "name": "becauseSndr",
            "type": "bool"
        }, {"name": "curveType", "type": "uint8"}], "name": "", "type": "tuple"
    }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}, {
    "constant": true,
    "inputs": [{"name": "grpId", "type": "bytes32"}, {"name": "hashX", "type": "bytes32"}, {
        "name": "smIndex",
        "type": "uint8"
    }, {"name": "slshReason", "type": "uint8"}],
    "name": "getSSlshProof",
    "outputs": [{
        "components": [{
            "components": [{"name": "polyData", "type": "bytes"}, {
                "name": "polyDataR",
                "type": "bytes"
            }, {"name": "polyDataS", "type": "bytes"}], "name": "polyDataPln", "type": "tuple"
        }, {"name": "m", "type": "bytes"}, {"name": "rpkShare", "type": "bytes"}, {
            "name": "gpkShare",
            "type": "bytes"
        }, {"name": "sndrIndex", "type": "uint8"}, {"name": "rcvrIndex", "type": "uint8"}, {
            "name": "becauseSndr",
            "type": "bool"
        }, {"name": "curveType", "type": "uint8"}], "name": "", "type": "tuple"
    }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}, {
    "constant": false,
    "inputs": [{"name": "grpId", "type": "bytes32"}, {"name": "hashX", "type": "bytes32"}, {
        "name": "inctData",
        "type": "uint256"
    }],
    "name": "wrInct",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "constant": false,
    "inputs": [{"name": "grpId", "type": "bytes32"}, {"name": "hashX", "type": "bytes32"}, {
        "name": "rnwData",
        "type": "uint256"
    }],
    "name": "wrRNW",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "constant": false,
    "inputs": [{"name": "grpId", "type": "bytes32"}, {"name": "hashX", "type": "bytes32"}, {
        "name": "snwData",
        "type": "uint256"
    }],
    "name": "wrSNW",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "constant": false,
    "inputs": [{"name": "grpId", "type": "bytes32"}, {
        "name": "hashX",
        "type": "bytes32"
    }, {
        "components": [{
            "components": [{"name": "polyCM", "type": "bytes"}, {
                "name": "polyCMR",
                "type": "bytes"
            }, {"name": "polyCMS", "type": "bytes"}], "name": "polyCMData", "type": "tuple"
        }, {
            "components": [{"name": "polyData", "type": "bytes"}, {
                "name": "polyDataR",
                "type": "bytes"
            }, {"name": "polyDataS", "type": "bytes"}], "name": "polyDataPln", "type": "tuple"
        }, {"name": "sndrIndex", "type": "uint8"}, {"name": "rcvrIndex", "type": "uint8"}, {
            "name": "becauseSndr",
            "type": "bool"
        }, {"name": "curveType", "type": "uint8"}], "name": "rslshData", "type": "tuple"
    }],
    "name": "wrRSlsh",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "constant": false,
    "inputs": [{"name": "grpId", "type": "bytes32"}, {
        "name": "hashX",
        "type": "bytes32"
    }, {
        "components": [{
            "components": [{"name": "polyData", "type": "bytes"}, {
                "name": "polyDataR",
                "type": "bytes"
            }, {"name": "polyDataS", "type": "bytes"}], "name": "polyDataPln", "type": "tuple"
        }, {"name": "m", "type": "bytes"}, {"name": "rpkShare", "type": "bytes"}, {
            "name": "gpkShare",
            "type": "bytes"
        }, {"name": "sndrIndex", "type": "uint8"}, {"name": "rcvrIndex", "type": "uint8"}, {
            "name": "becauseSndr",
            "type": "bool"
        }, {"name": "curveType", "type": "uint8"}], "name": "sslshData", "type": "tuple"
    }],
    "name": "wrSSlsh",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "constant": false,
    "inputs": [{"name": "configAddr", "type": "address"}, {"name": "smgAddr", "type": "address"}],
    "name": "setDependence",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}];
const abiMap = new Map([
    ["smg", smgAbi],
    ["gpk", gpkAbi],
    ["metric",metricAbi],
]);

module.exports = abiMap;
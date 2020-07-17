const smgAbi = [{"constant":true,"inputs":[],"name":"tokenManager","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"quotaInst","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"badAddrs","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"greateGpkAddr","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"badTypes","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"halted","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"metric","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"halt","type":"bool"}],"name":"setHalt","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":false,"name":"workStart","type":"uint256"},{"indexed":false,"name":"workDuration","type":"uint256"},{"indexed":false,"name":"registerDuration","type":"uint256"},{"indexed":true,"name":"preGroupId","type":"bytes32"}],"name":"registerStartEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"}],"name":"StoremanGroupUnregisterEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"tokenOrigAccount","type":"bytes"},{"indexed":false,"name":"storemanGroup","type":"bytes"},{"indexed":false,"name":"dismissTime","type":"uint256"}],"name":"StoremanGroupDismissedLogger","type":"event"},{"constant":false,"inputs":[{"name":"tmAddr","type":"address"},{"name":"metricAddr","type":"address"},{"name":"gpkAddr","type":"address"},{"name":"quotaAddr","type":"address"}],"name":"setDependence","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"backup","type":"uint256"}],"name":"setBackupCount","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getBackupCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"workStart","type":"uint256"},{"name":"workDuration","type":"uint256"},{"name":"registerDuration","type":"uint256"},{"name":"preGroupId","type":"bytes32"},{"name":"wkAddrs","type":"address[]"},{"name":"senders","type":"address[]"}],"name":"registerStart","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"chain1","type":"uint256"},{"name":"chain2","type":"uint256"},{"name":"curve1","type":"uint256"},{"name":"curve2","type":"uint256"}],"name":"setGroupChain","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"memberCountdesign","type":"uint256"},{"name":"threshold","type":"uint256"},{"name":"minStakeIn","type":"uint256"}],"name":"updateGroupConfig","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"pkAddr","type":"address"}],"name":"getGroupIdbyAddress","outputs":[{"name":"","type":"bytes32"},{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"wkAddr","type":"address"}],"name":"toIncentiveAll","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"PK","type":"bytes"},{"name":"enodeID","type":"bytes"},{"name":"delegateFee","type":"uint256"}],"name":"stakeIn","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"skPkAddr","type":"address"}],"name":"stakeAppend","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"skPkAddr","type":"address"}],"name":"stakeOut","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"skPkAddr","type":"address"}],"name":"stakeClaim","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"skPkAddr","type":"address"}],"name":"delegateIn","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"skPkAddr","type":"address"}],"name":"delegateOut","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"skPkAddr","type":"address"}],"name":"delegateClaim","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"}],"name":"getSelectedSmNumber","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"}],"name":"toSelect","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"}],"name":"toDismiss","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"index","type":"uint256"}],"name":"getSelectedSmInfo","outputs":[{"name":"","type":"address"},{"name":"","type":"bytes"},{"name":"","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"status","type":"uint8"}],"name":"toSetGroupStatus","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"wkAddress","type":"address"}],"name":"getStoremanInfo","outputs":[{"name":"sender","type":"address"},{"name":"PK","type":"bytes"},{"name":"pkAddress","type":"address"},{"name":"quited","type":"bool"},{"name":"delegateFee","type":"uint256"},{"name":"deposit","type":"uint256"},{"name":"delegateDeposit","type":"uint256"},{"name":"incentive","type":"uint256"},{"name":"delegatorCount","type":"uint256"},{"name":"groupId","type":"bytes32"},{"name":"nextGroupId","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"wkAddr","type":"address"},{"name":"deIndex","type":"uint256"}],"name":"getSmDelegatorAddr","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"wkAddr","type":"address"},{"name":"deAddr","type":"address"}],"name":"getSmDelegatorInfo","outputs":[{"name":"sender","type":"address"},{"name":"deposit","type":"uint256"},{"name":"incentive","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"wkAddr","type":"address"},{"name":"deAddr","type":"address"},{"name":"index","type":"uint256"}],"name":"getSmDelegatorInfoRecord","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"gpk1","type":"bytes"},{"name":"gpk2","type":"bytes"}],"name":"setGpk","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"slashType","type":"uint256[]"},{"name":"badAddrs","type":"address[]"}],"name":"setInvalidSm","outputs":[{"name":"isContinue","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"}],"name":"getThresholdByGrpId","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"}],"name":"storemanGroupUnregister","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"tokenOrigAccount","type":"bytes"},{"name":"storemanGroup","type":"bytes"}],"name":"storemanGroupDismiss","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"}],"name":"checkGroupDismissable","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"id","type":"bytes32"}],"name":"getStoremanGroupInfo","outputs":[{"name":"groupId","type":"bytes32"},{"name":"status","type":"uint8"},{"name":"deposit","type":"uint256"},{"name":"whiteCount","type":"uint256"},{"name":"memberCount","type":"uint256"},{"name":"startTime","type":"uint256"},{"name":"endTime","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"id","type":"bytes32"}],"name":"getStoremanGroupConfig","outputs":[{"name":"groupId","type":"bytes32"},{"name":"status","type":"uint8"},{"name":"deposit","type":"uint256"},{"name":"chain1","type":"uint256"},{"name":"chain2","type":"uint256"},{"name":"curve1","type":"uint256"},{"name":"curve2","type":"uint256"},{"name":"gpk1","type":"bytes"},{"name":"gpk2","type":"bytes"},{"name":"startTime","type":"uint256"},{"name":"endTime","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"id","type":"bytes32"}],"name":"getStoremanGroupTime","outputs":[{"name":"groupId","type":"bytes32"},{"name":"registerTime","type":"uint256"},{"name":"registerDuration","type":"uint256"},{"name":"startTime","type":"uint256"},{"name":"endTime","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"id","type":"bytes32"},{"name":"day","type":"uint256"}],"name":"checkGroupIncentive","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"contribute","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"smgID","type":"bytes32"}],"name":"smgTransfer","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"_crossChainCo","type":"uint256"},{"name":"_chainTypeCo","type":"uint256"}],"name":"setCoefficient","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]; 

const createGpkAbi = [{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"groupMap","outputs":[{"name":"groupId","type":"bytes32"},{"name":"round","type":"uint16"},{"name":"curveTypes","type":"uint8"},{"name":"ployCommitPeriod","type":"uint32"},{"name":"defaultPeriod","type":"uint32"},{"name":"negotiatePeriod","type":"uint32"},{"name":"smNumber","type":"uint16"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"smg","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"acceptOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"changeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"newOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"storeman","type":"address"}],"name":"SetPolyCommitLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"src","type":"address"},{"indexed":false,"name":"dest","type":"address"}],"name":"SetEncSijLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"src","type":"address"},{"indexed":false,"name":"dest","type":"address"},{"indexed":false,"name":"isValid","type":"bool"}],"name":"SetCheckStatusLogger","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"groupId","type":"bytes32"},{"indexed":true,"name":"round","type":"uint16"},{"indexed":true,"name":"curveIndex","type":"uint8"},{"indexed":false,"name":"src","type":"address"},{"indexed":false,"name":"dest","type":"address"}],"name":"RevealSijLogger","type":"event"},{"constant":false,"inputs":[{"name":"smgAddr","type":"address"}],"name":"setDependence","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"ployCommitPeriod","type":"uint32"},{"name":"defaultPeriod","type":"uint32"},{"name":"negotiatePeriod","type":"uint32"}],"name":"setPeriod","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"curveId","type":"uint8"},{"name":"curveAddress","type":"address"}],"name":"setCurve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"polyCommit","type":"bytes"}],"name":"setPolyCommit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"}],"name":"polyCommitTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"dest","type":"address"},{"name":"encSij","type":"bytes"}],"name":"setEncSij","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"},{"name":"isValid","type":"bool"}],"name":"setCheckStatus","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"}],"name":"encSijTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"dest","type":"address"},{"name":"sij","type":"uint256"},{"name":"ephemPrivateKey","type":"uint256"}],"name":"revealSij","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"},{"name":"dest","type":"address"}],"name":"checkEncSijTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"}],"name":"SijTimeout","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"curveIndex","type":"uint8"}],"name":"terminate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"int32"}],"name":"getGroupInfo","outputs":[{"name":"queriedRound","type":"uint16"},{"name":"curve1Status","type":"uint8"},{"name":"curve1StatusTime","type":"uint256"},{"name":"curve2Status","type":"uint8"},{"name":"curve2StatusTime","type":"uint256"},{"name":"ployCommitPeriod","type":"uint32"},{"name":"defaultPeriod","type":"uint32"},{"name":"negotiatePeriod","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"}],"name":"getPolyCommit","outputs":[{"name":"polyCommit","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"roundIndex","type":"uint16"},{"name":"curveIndex","type":"uint8"},{"name":"src","type":"address"},{"name":"dest","type":"address"}],"name":"getEncSijInfo","outputs":[{"name":"encSij","type":"bytes"},{"name":"checkStatus","type":"uint8"},{"name":"setTime","type":"uint256"},{"name":"checkTime","type":"uint256"},{"name":"sij","type":"uint256"},{"name":"ephemPrivateKey","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"},{"name":"index","type":"uint16"}],"name":"getPkShare","outputs":[{"name":"pkShare1","type":"bytes"},{"name":"pkShare2","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"groupId","type":"bytes32"}],"name":"getGpk","outputs":[{"name":"gpk1","type":"bytes"},{"name":"gpk2","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"}];

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
    ["CreateGpk", createGpkAbi],
    ["metric",metricAbi],
]);

module.exports = abiMap;
const schnorr = require('./tools');
const skSmg = new Buffer("097e961933fa62e3fef5cedef9a728a6a927a4b29f06a15c6e6c52c031a6cb2b", 'hex');

function test() {

    //===================Create sig=====================
    console.log("===================Create sig=====================");
    let typesArray;
    let parameters;
    typesArray = ['uint256', 'string'];
    parameters = ['2345675643', 'Hello!%'];

    console.log("=====pk===hex");
    let pk = schnorr.getPKBySk(skSmg);

    console.log(pk);

    console.log("=====s by encodeParameters ===hex");
    let s = schnorr.getS(skSmg, typesArray, parameters);
    console.log(s);

    console.log("=====s by raw message===hex");
    let rawMsg = "0x1234";
    let sByRaw = schnorr.getSByRawMsg(skSmg, rawMsg);
    console.log(sByRaw);

    console.log("=====R===hex");
    console.log(schnorr.getR());

    //===================Verify sig=====================
    // success
    console.log("===================Verify sig 1=====================");
    try{
        // let ret = schnorr.verifySig(schnorr.getR(),sByRaw,rawMsg,pk);

        let r = '0x049301fde59e26005a3179cfbfb7c5998dfbb4948004cbe16aa86808c75135e20520d514eaf859fdd8a0b11d6e9df75edd6e3e41d5b4722ab9c2ee6f4c58aeb805';
        let s = '0x1ddb65d2ccb9a77e6f55438e3d6ae0c38dbe43385d6b0dffa2e5a0efc90aff0c';
        let data = '0x595746796232357459576c75626d56304f6d567663326c764c6e5276613256754f6a41754d4441774d53424654314d364d446b7a4e6d45305a5441334d4451324d44677a4d6a5268597a59784d444e684f574d7759544e684f54686d4e6a5930595455784f574578596d56684d6a417a59575978595463324d57566c4d6d4a6a4e6d466c5a413d3d';
        let pk = '0x042649e5c8b192ab0f0dfb6111d08510d3b0d34371145e1fed69639fcc24eda931db1e6e10c55093e7a9b34ae0bcea1473e15f33ee2b885e6d88b758755c487276';
        let ret = schnorr.verifySig(r, s, data, pk);

        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }

    // 'H'
    console.log("===================Verify sig 2=====================");
    try {
        let rawMsg = "1234";
        let ret = schnorr.verifySig("0x04204eea36548db9064323cc88e965a7b8a59b3a191c15f6eca8cee45830866f3ee04c23dda7aabf0adb485a48cb6d34a2ffd8b98a64bf795c6ed88086c826c39H",
            sByRaw, rawMsg, pk);
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }

    // odd
    console.log("===================Verify sig 3=====================");
    try {
        let rawMsg = "1234";
        let ret = schnorr.verifySig(schnorr.getR(),
            "0xa1472c7ba8c91fa906f3491591b30a72a7c353cedf48eca35c28d4b1fe45a1b", rawMsg, pk);
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }

    // empty
    console.log("===================Verify sig 4=====================");
    try {
        let rawMsg = "0x";
        let ret = schnorr.verifySig(schnorr.getR(),
            sByRaw, rawMsg, pk);
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }
    // len < 2
    console.log("===================Verify sig 5=====================");
    try {
        let rawMsg = "1234";
        let ret = schnorr.verifySig(schnorr.getR(),
            sByRaw, rawMsg, "0x1");
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }
    // len< 130
    console.log("===================Verify sig 6=====================");
    try {
        let rawMsg = "1234";
        let ret = schnorr.verifySig("0x04204eea36548db9064323cc88e965a7b8a59b3a191c15f6eca8cee45830866f3ee04c23dda7aabf0adb485a48cb6d34a2ffd8b98a64bf795c6ed88086c826c3",
            sByRaw, rawMsg, pk);
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }

    // len > 130
    console.log("===================Verify sig 7=====================");
    try {
        let rawMsg = "1234";
        let ret = schnorr.verifySig("0x04204eea36548db9064323cc88e965a7b8a59b3a191c15f6eca8cee45830866f3ee04c23dda7aabf0adb485a48cb6d34a2ffd8b98a64bf795c6ed88086c826c39eee",
            sByRaw, rawMsg, pk);
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }

    // point not on curve
    console.log("===================Verify sig 8=====================");
    try {
        let rawMsg = "1234";
        let ret = schnorr.verifySig("0x04204eea36548db9064323cc88e965a7b8a59b3a191c15f6eca8cee45830866f3ee04c23dda7aabf0adb485a48cb6d34a2ffd8b98a64bf795c6ed88086c826c39f",
            sByRaw, rawMsg, pk);
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }
    // raw msg not match the signature
    console.log("===================Verify sig 9=====================");
    try {
        let rawMsg = "0x123456";
        let ret = schnorr.verifySig(schnorr.getR(),
            sByRaw, rawMsg, pk);
        if (ret) {
            console.log("verifySig success");
        } else {
            console.log("verifySig fail");
        }
    } catch (err) {
        console.log("verifySig fail");
        console.log(err.toString());
    }
}

test();
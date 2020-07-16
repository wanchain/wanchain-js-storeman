"use strict"

const {getGrpInfoInst} = require('./grpInfo');

function test() {

    getGrpInfoInst();
    global.grpInfo.init();
    global.grpInfo.run();
}

test();
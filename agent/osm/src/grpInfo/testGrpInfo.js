"use strict"

const {getGrpInfoInst} = require('./grpInfo');

function test() {
    getGrpInfoInst();
    global.grpInfo.run();
}

test();
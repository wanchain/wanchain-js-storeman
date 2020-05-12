"use strict"

const {getIncntSlshWriter} = require('./incntSlshWriter');

const xHashInct  = '0xec4916dd28fc4c10d78e287ca5d9cc51ee1ae73cbfde08c6b37324cbfaac8bc5';
const xRNW       = '0x0000000000000000000000000000000000000000000000000000000000000002';

function test(){
    // let isw = getIncntSlshWriter();
    // isw.run();

    getIncntSlshWriter();
    global.incntSlshWriter.run();

    let incSr = {
        GrpId: "0x67726f75494431",
        IncntData: "0x0f",
        R: "0x04c94709ccfa6e2d0d0ffcb75418c104e614f43cb29b82a7c2d1cf90870bf088dcf98350bacd8ecc636b05109994cb29c239b436e0487719e877967beba26742cf",
        RNW: "0x",
        RSlsh: null,
        ResultType: 0,
        S: "0x5cedb42d1f9790320da49197d88eba43a8699925b4d0839886926023fe740c86",
        SNW: "0x",
        SSlsh: null
    }

    let slshSr = {
        GrpId: "0x67726f75494431",
        IncntData: "0x",
        R: "0x",
        RNW: "0x0e",
        RSlsh: null,
        ResultType: 1,
        S: "0x",
        SNW: "0x",
        SSlsh: null
    }

    global.incntSlshWriter.handleInctSlsh(xHashInct,incSr);
    global.incntSlshWriter.handleInctSlsh(xRNW,slshSr);

}

test();
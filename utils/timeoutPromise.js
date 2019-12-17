"use strict"

module.exports = class TimeoutPromise extends Promise {
    constructor(callback, ms = 30 * 1000, hint = 'PTIMEOUT') {
        let timeout;
        let wrapperPromise = Promise.race([
            new Promise(callback),
            new Promise((resolve, reject) => {
                timeout = setTimeout(() => {
                    reject(new Error(hint));
                }, ms);
            }),
        ]);

        return wrapperPromise.then((data) => {
            clearTimeout(timeout);
            return data;
        }).catch((error) => {
            clearTimeout(timeout);
            throw error; // if timeout, reject the hint error
        })

        //   super((resolve, reject) => {
        //       wrapperPromise.then((data) => {
        //           clearTimeout(timeout);
        //           resolve(data);
        //       }).catch((error) => {
        //           clearTimeout(timeout);
        //           reject(error); // if timeout, reject the hint error
        //       })
        //   });
    }
}
/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

function generateNonce() {
    const randomBytes = crypto.randomBytes(4); // 4 bytes for a 32-bit unsigned integer
    const nonceDecimal = randomBytes.readUInt32BE(0); // Convert random bytes to a decimal representation
    return nonceDecimal;
  }
  // Example usage:
  //const nonce = generateNonce();
  //console.log(nonce);

class dataTransfer extends Contract {
    // generate Nonce 
    // initLedger
    // writeData
    // readData
    // updatedata
    // Deletedata
    // Dataexists
    // getAlldatas

    // updateToPublicChain

    async initLedger(ctx){
        const datas = [
            {
                Name: "sequencer",
                Nonce:0,
                logSig:"a5e873b0df0da2a1a057b4b272f88ba6",
                dataHash:"e20414f9731ddcaf6d9c5a45457ff595",
                IP:"162.45.69.1",
            },
            {
                Name: "healthcare_system",
                Nonce:1,
                logSig:"555bf8344ca0caf09b42f55e185526d8",
                dataHash:"9ff28bfa80b1beaca18e167df071db6e",
                IP:"175.48.0.1",
            }
        ]
        for (const data of datas) {
            data.docType = 'data';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(data.Nonce.toString(), Buffer.from(stringify(sortKeysRecursive(data))));//key,value
        }
        return "success";
    }

    async writeData(ctx, name, logsig, datahash, ip){
        nonce = generateNonce();
        const data = {
            Name : name,
            Nonce : nonce,
            logSig : logsig,
            dataHash : datahash,
            IP : ip
        }
        await ctx.stub.putState(nonce, Buffer.from(stringify(data)));
        return JSON.stringify(data)
    }

    async readData(ctx, nonce){
        const dataJSON = await ctx.stub.getState(nonce); // get the data from chaincode state
        if (!dataJSON || dataJSON.length === 0) {
            throw new Error(`The data ${nonce} does not exist`);
        }
        return dataJSON.toString();
    }

    async Updatedata(ctx, name, nonce, logsig, datahash, ip) {
        const exists = await this.DataExists(ctx, nonce);
        if (!exists) {
            throw new Error(`The data ${nonce} does not exist`);
        }

        // overwriting original data with new data
        const updateddata = {
            Name : name,
            Nonce : nonce,
            logSig : logsig,
            dataHash : datahash,
            IP : ip
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(nonce, Buffer.from(stringify(sortKeysRecursive(updateddata))));
    }

    async DeleteData(ctx, nonce) {
        const exists = await this.dataExists(ctx, nonce);
        if (!exists) {
            throw new Error(`The data ${nonce} does not exist`);
        }
        return ctx.stub.deleteState(nonce);
    }


    // dataExists returns true when data with given ID exists in world state.
    async DataExists(ctx, nonce) {
        const dataJSON = await ctx.stub.getState(nonce);
        return dataJSON && dataJSON.length > 0;
    }

    // GetAlldatas returns all datas found in the world state.
    async GetAlldatas(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all datas in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }





}
module.exports = dataTransfer;

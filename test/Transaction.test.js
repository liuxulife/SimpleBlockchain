import { Transaction } from "../src/Transaction.js";
import { createSignedTx, signKey } from "./helpers.js";
import assert from 'assert';
import sha256 from "crypto-js/sha256.js";

describe("Transaction class", function () {
    let txObj = null;

    const fromAddress = 'fromAddress';
    const toAddress = 'toAddress';
    const amount = 100;

    beforeEach(function () {
        txObj = new Transaction(fromAddress, toAddress, amount);
    });

    describe("Constructor", function () {
        it("Should correctly save the parameters", function () {
            assert.strict.equal(txObj.fromAddress, 'fromAddress');
            assert.strict.equal(txObj.toAddress, 'toAddress');
            assert.strict.equal(txObj.amount, 100);

        })

        it('Should automatically set the timestamp', function () {
            const actualTime = txObj.timestamp;
            const minTime = Date.now() - 1000;
            const maxTime = Date.now() + 1000;

            assert(actualTime > minTime && actualTime < maxTime, 'Tx does not have a valid timestamp');
        })
    })

    describe("calculateTxHash", function () {
        it("Should correctly calcluate the hash of the transaction", function () {

            // const hash = txObj.calculateTxHash();
            // const expectedHash = sha256(fromAddress + toAddress + amount, txObj.timestamp).toString();
            txObj.timestamp = 1;
            const hash = txObj.calculateTxHash();
            const expectedHash = sha256(fromAddress + toAddress + amount, txObj.timestamp).toString();
            console.log(expectedHash);

            assert.strict.equal(hash, expectedHash);

        })

        it("Should should output a different hash when the transaction is tampered with", function () {
            const originHash = txObj.calculateTxHash();
            txObj.amount = 50;
            const newHash = txObj.calculateTxHash();
            assert.strict.notEqual(originHash, newHash);
        });
    });

    describe("sign", function () {
        it("Should not sign the transaction while the fromAddress is not the private key owner", function () {
            txObj.fromAddress = "some-other-address";

            assert.throws(() => txObj.sign(signKey), Error);
        })

        it("Should correctly sign the transaction", function () {
            txObj = createSignedTx();

            const txObjHash = txObj.calculateTxHash();
            const sig = signKey.sign(txObjHash, 'base64');
            const signature = sig.toDER('hex');

            assert.strict.equal(txObj.signature, signature);
        })


    })

    describe("txIsValid", function () {
        it("Should return true while transaction is mining reward", function () {
            txObj.fromAddress = null;
            assert(txObj.txIsValid());
        });

        it("Should throw error while signature is invalid", function () {
            delete txObj.signature;
            assert.throws(() => txObj.txIsValid(), Error);

            txObj.signature = "";
            assert.throws(() => txObj.txIsValid(), Error);
        })

        it("Should return false while sign badly transaction", function () {
            txObj = createSignedTx(10);

            txObj.amount = 100;

            assert(!txObj.txIsValid());
        })

        it("Should return true while correctly signed transaction", function () {
            txObj = createSignedTx(50);
            assert(txObj.txIsValid());
        })
    })

})

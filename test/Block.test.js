import assert from 'assert';
import { Block } from '../src/Blcok.js';
import { createSignedTx } from './helpers.js';

let blockObj = null;

beforeEach(function () {
    blockObj = new Block(1000, [createSignedTx()], 'a1');
});

describe('Block class', function () {
    describe('Constructor', function () {
        it('should correctly save some parameters', function () {
            assert.strict.equal(blockObj.timestamp, 1000);
            assert.strict.equal(blockObj.previousHash, 'a1');
            assert.strict.equal(blockObj.nonce, 0);
            assert.strict.deepEqual(blockObj.transactions, [createSignedTx()]);
        });

        it('should correctly save parameters, without giving "previousHash"', function () {
            blockObj = new Block(1000, [createSignedTx()]);
            assert.strict.equal(blockObj.timestamp, 1000);
            assert.strict.equal(blockObj.previousHash, '');
            assert.strict.equal(blockObj.nonce, 0);
            assert.strict.deepEqual(blockObj.transactions, [createSignedTx()]);
        });

    });

    describe('calculateHash', function () {
        it('should correctly calculate the hash of the block', function () {
            blockObj.timestamp = 1;
            blockObj.mineBlock(1);

            assert.strict.equal(
                blockObj.hash,
                '078ecf7380b09827ae670ff6b6a5ff6a00f5c13fb902ff9a016d7d4e45596cb9'
            )
        });

        it('should change when tamper with tx', function () {
            const originHash = blockObj.calculateHash();
            blockObj.timestamp = 100;

            assert.strict.notEqual(
                blockObj.calculateHash(),
                originHash
            );
        });
    });



    describe('has valid transactions', function () {
        it('should return true when all tx are valid', function () {
            blockObj.transactions = [
                createSignedTx(),
                createSignedTx(),
                createSignedTx()
            ];

            assert(blockObj.hasValidTransactions());
        });

        it('should return false when a single tx is bad', function () {
            const baxTx = createSignedTx();
            baxTx.amount = 999;

            blockObj.transactions = [
                createSignedTx(),
                baxTx,
                createSignedTx()
            ];

            assert(!blockObj.hasValidTransactions());
        });

    });

});
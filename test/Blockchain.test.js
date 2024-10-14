import assert from 'assert';
import { Blockchain } from "../src/Blockchain.js";



describe("Blockchain class", function () {
    let blockchain = null;
    const dataPath = "data/blockchain.json";
    beforeEach(function () {
        blockchain = new Blockchain(dataPath);
    });

    describe("constructor", function () {
        it("Should save some parameters", function () {
            assert.strict.equal(dataPath, blockchain.dataPath);
            assert.strict.equal(blockchain.difficulty, 2);
            assert.strict.equal(blockchain.miningReward, 100);
            assert.strict.deepEqual(blockchain.pendingTransactions, []);
        })
    })

    describe("createGenesisBlock", function () {
        it("Should correctly create a genesis block", function () {


        })
    })
})
import sha256 from 'crypto-js/sha256.js';
import { Transaction } from './Transaction.js';
// Block class
// What we need to realize 
// 1. The constructor will initialize the block
// 2. The calculateHash method will calculate the hash of the block
// 3. mine Block
export class Block {

    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }


    calculateHash() {
        return sha256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }

    // mint block
    // The block is mined when the hash of the block is less than the difficulty target set by the network
    mineBlock(difficulty) {
        // what the substring mean is that the hash should start from 0 to difficulty
        // if the hash is 0000, then the substring will be 0000
        // if the hash is 0001, then the substring will be 0001
        // and why we need to compare the hash with the difficulty?
        // because we need to find the hash which is less than the difficulty
        // if the difficulty is 4, then the hash should start with 0000

        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("Block is mined:", this.hash);
    }



    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.txIsValid()) {
                return false;
            }
        }
        return true;
    }
}
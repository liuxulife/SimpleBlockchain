import { callbackify } from "util";
import { Block } from "./Blcok.js";
import { Transaction } from "./Transaction.js";
import fs from 'fs';
import { debug, dir, error } from "console";
import { toASCII } from "punycode";
import { Cipher } from "crypto";

// we want to store the blockchain in a file so that the peer can load the blockchain data from the file
// and we need to consider some situations: 
// 1. when initialize the blockchain 
// 2. when add a block
// 3. when exit the program


export class Blockchain {

    constructor(dataPath) {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.dataPath = dataPath;
        this.miningReward = 100;
        this.pendingTransactions = [];

        this.loadChainFromFile();

        process.on("exit", () => { this.saveChainToFile() })
    }

    createGenesisBlock() {
        return new Block(Date.parse("01/01/2024"), [], "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    // addBlock(newBlock) {
    //     newBlock.previousHash = this.getLatestBlock().hash;
    //     newBlock.mineBlock(this.difficulty);
    //     this.chain.push(newBlock);
    //     this.saveChainToFile();
    // }

    mineBlockWithPendingTransactions(miningRewardAddress) {
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx)

        const newBlock = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        newBlock.mineBlock(this.difficulty);
        // console.debug("Block is mined");
        this.chain.push(newBlock);

        this.saveChainToFile();
        this.pendingTransactions = [];  // refresh the pendingTransactions
    }

    addTransactionsToBlock(transaction) {
        if (!transaction.txIsValid()) {
            throw new error("Transaction is invalid");
        }

        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new error("Transaction need to include the fromAddress and toAddress")
        }

        if (transaction.amount <= 0) {
            throw new error("Transaction amount should be higher than 0");
        }

        const walletBalance = this.getWalletBalance(transaction.fromAddress);
        if (walletBalance < transaction.amount) {
            throw new error("The balance of the wallet dont have enough money")
        }

        const pendingTxForWallet = this.pendingTransactions.filter(
            tx => tx.fromAddress === transaction.fromAddress
        )

        // if the wallet have other pending transaction and we need to calculate the total
        // transaction amount
        if (pendingTxForWallet.length > 0) {
            const totalPendingAmount = pendingTxForWallet.map(tx => tx.amount).reduce((prev, curr) => prev + curr);

            const totalAmount = totalPendingAmount + transaction.amount;
            if (totalAmount > walletBalance) {
                throw new error("Pending transacion total amount is higher than wallet balance")
            }

        }

        this.pendingTransactions.push(transaction)
        console.debug("Transaction is added: %s", transaction);
    }

    getWalletBalance(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                if (transaction.fromAddress === address) {
                    balance -= transaction.amount;
                }
                if (transaction.toAddress === address) {
                    balance += transaction.amount;
                }
            }
        }
        console.debug(`The wallet balance of address ${address} is ${balance}`);
        return balance;
    }

    getAllTransactionsForWallet() {

    }

    isChainValid(chain) {
        const targetChain = chain || this.chain;
        for (let i = 1; i < targetChain.length; i++) {
            const currentBlock = targetChain[i];
            const previousBlock = targetChain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
            if (!currentBlock.hasValidTransactions()) {
                return false;
            }
        }
        return true;
    }

    // save the blockchain to a file
    saveChainToFile() {
        try {
            if (this.isChainValid() === false) {
                console.error("Blockchain is invalid, not saving to file");
                return;
            }

            const jsonContent = JSON.stringify(this.chain, null, 2);
            fs.writeFileSync(this.dataPath, jsonContent, "utf-8");

        } catch (error) {
            console.error("Error saving the blockchain to a file ", error);
        }
    }
    //  loadChainFromFile() { }
    loadChainFromFile() {
        try {
            if (fs.existsSync(this.dataPath)) {
                const fileContent = fs.readFileSync(this.dataPath, 'utf-8');
                const loadedChain = JSON.parse(fileContent);
                this.chain = loadedChain.map((blockdata) => {
                    const block = new Block(blockdata.index, blockdata.timestamp, blockdata.data, blockdata.previousHash);
                    block.nonce = blockdata.nonce;
                    block.hash = block.calculateHash();
                    return block;
                });



                if (this.isChainValid() === false) {
                    console.error("Blockchain is not valid after loading from the file");
                    process.exit(1);
                }
            }
        } catch (error) {
            console.error("Error loading the blockchain from the file", error);
        }
    }

}
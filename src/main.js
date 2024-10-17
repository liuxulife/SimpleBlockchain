import { Blockchain } from "./Blockchain.js";
import { Transaction } from "./Transaction.js";
import { Block } from "./Block.js";
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { P2PServer } from "./P2PServer.js";

// var EC = require('elliptic').ec;
// // Create and initialize EC context
// // (better do it once and reuse it)
// var ec = new EC('secp256k1');

// ES 模块导入方式（解决CommonJS与ES模块兼容性）
import pkg from 'elliptic';  // 默认导入整个包
const { ec: EC } = pkg;      // 解构提取 EC
// 创建并初始化 EC 实例（使用 secp256k1 曲线）
const ec = new EC('secp256k1');


const argv = yargs(process.argv)
    .option('dataPath', {
        alias: 'd',
        description: 'The path to save the blockchain data',
        type: 'string',
    })
    .option('port', {
        alias: 'p',
        description: 'The port to listen for P2P server',
        type: 'number',
    })
    .option('host', {
        alias: 'h',
        description: 'The host to listen for P2P server',
        type: 'string',
    })
    .option('peers', {
        alias: 'ps',
        description: 'The seed peers to connect to',
        type: 'array',
    }
    )
    .help()
    .alias('help', 'h')
    .argv;

const myKey = ec.keyFromPrivate('7c4c45907dec40c91bab3480c39032e90049f1a44f3e18c3e07c23e3273995cf')
const myWalletAddress = myKey.getPublic('hex');

const blockchainDataPath = argv.dataPath || '../data/blockchain.json';
const myBlockchain = new Blockchain(blockchainDataPath);

myBlockchain.mineBlockWithPendingTransactions(myWalletAddress);

const tx1 = new Transaction(myWalletAddress, 'address2', 100);
tx1.sign(myKey);
myBlockchain.addTransactionsToBlock(tx1);
console.log("Mining block 1...");
myBlockchain.mineBlockWithPendingTransactions(myWalletAddress);
myBlockchain.getWalletBalance(myWalletAddress)
myBlockchain.getWalletBalance("address2")


const tx2 = new Transaction(myWalletAddress, 'address1', 50);
tx2.sign(myKey);
myBlockchain.addTransactionsToBlock(tx2);

console.log("Mining block 2...");
myBlockchain.mineBlockWithPendingTransactions(myWalletAddress);

myBlockchain.getWalletBalance(myWalletAddress)
myBlockchain.getWalletBalance("address1")


const port = argv.port || 12315;
const host = argv.host || 'localhost';
const seedPeers = argv.peers || ['localhost:12315',];
const myP2PServer = new P2PServer(myBlockchain, port, host, seedPeers);
myP2PServer.listen();



// // after transaction is added, mine a new block
// console.log(
//     `Balance of myAddress is ${myBlockchain.getWalletBalance(myWalletAddress)}`
// );
// console.log("Is blockchain valid? " + myBlockchain.isChainValid());


// console.log("getBlockchain", myBlockchain);

// myBlockchain.addBlock(
//     new Block(
//         Date.now(),
//         {
//             amount: 10,
//         }
//     )
// );

// console.log("Mining block 2...");
// myBlockchain.addBlock(new Block("12/07/2017", { amount: 10 }));



// myBlockchain.chain[1].data = JSON.stringify({ amount: 100 });
// console.debug("Is blockchain valid? " + myBlockchain.isChainValid());
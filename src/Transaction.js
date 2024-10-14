import sha256 from 'crypto-js/sha256.js';

// var EC = require('elliptic').ec;
// // Create and initialize EC context
// // (better do it once and reuse it)
// var ec = new EC('secp256k1');

// ES 模块导入方式（解决CommonJS与ES模块兼容性）
import pkg from 'elliptic';  // 默认导入整个包
const { ec: EC } = pkg;      // 解构提取 EC
// 创建并初始化 EC 实例（使用 secp256k1 曲线）
const ec = new EC('secp256k1');


export class Transaction {

    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
    }

    calculateTxHash() {
        return sha256(this.fromAddress + this.toAddress + this.amount, this.timestamp).toString();
    }

    /**
    * Signs a transaction with the given signingKey (which is an Elliptic keypair
    * object that contains a private key). The signature is then stored inside the
    * transaction object and later stored on the blockchain.
     */
    sign(signingKey) {
        if (signingKey.getPublic('hex') !== this.fromAddress) {
            throw new error("You cant sign the transaction with other private key");
        }

        const hashTx = this.calculateTxHash();
        const sig = signingKey.sign(hashTx, 'base64');

        this.signature = sig.toDER('hex');
    }

    /**
     * check the transaction is valid
     */
    txIsValid() {
        if (this.fromAddress === null) {
            return true;
        }

        if (!this.signature || this.signature.length === 0) {
            throw new error("No signature in transaction");
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');

        return publicKey.verify(this.calculateTxHash(), this.signature)
    }
}
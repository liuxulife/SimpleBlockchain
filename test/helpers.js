import { Transaction } from '../src/Transaction.js';
import pkg from 'elliptic';
const { ec: EC } = pkg;
const ec = new EC('secp256k1');
export const signKey = ec.keyFromPrivate('7c4c45907dec40c91bab3480c39032e90049f1a44f3e18c3e07c23e3273995cf');

// create the signed transaction to use in the tests
export function createSignedTx(amount = 10) {
    const txObject = new Transaction(signKey.getPublic('hex'), 'address2', amount);
    txObject.timestamp = 1;

    txObject.sign(signKey);

    return txObject;
}

export function createBlockchain(dataPath) {
    
}

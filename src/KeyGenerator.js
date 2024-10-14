import pkg from 'elliptic';
const { ec: EC } = pkg;
const ec = new EC('secp256k1');

const key = ec.genKeyPair();
const publicKey = key.getPublic('hex');
const privateKey = key.getPrivate('hex');

console.log('Public key:', publicKey);
console.log('Private key:', privateKey);
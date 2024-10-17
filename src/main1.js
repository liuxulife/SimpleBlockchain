import { Blockchain } from "./Blockchain.js";
import { P2PServer } from "./P2PServer.js";


const port = argv.port || 12315;
const host = argv.host || 'localhost';
const seedPeers = argv.peers || ['localhost:12315',];
const myP2PServer = new P2PServer(myBlockchain, port, host, seedPeers);
myP2PServer.listen();


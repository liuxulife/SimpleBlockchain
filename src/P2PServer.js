// import { send } from "process";
import { Block } from "./Blcok.js";
import { Blockchain } from "./Blockchain.js";
import net from 'net';
// import { type } from "os";

const Message = {
    type: ['BLOCKCHAIN_REQUEST', 'BLOCKCHAIN_RESPONSE', 'PEERS_REQUEST', 'PEERS_RESPONSE', 'KEEP_ALIVE'],
    data: null
}

/**
 * P2P Server
 * The P2P server will listen for incoming connections from other peers
 * and broadcast the blockchain to the peers
 * What we need to do:
 * 1. The constructor will initialize the P2P server. We need to maintain a map of peers and we need to use the port and host to listen for incoming connections
 * 2. We want to use the seed node to connect to the network and broadcast the blockchain to the network
 * 
 * We need to realize some functions:
 * 1. start p2p server
 * 2. connect to seed peers
 */
export class P2PServer {

    constructor(blockchain, port = 12315, host = "localhost", seedPeers = ['localhost:12315',],) {
        this.blockchain = blockchain;
        this.port = port;
        this.host = host;
        this.seedPeers = seedPeers;
        this.peers = new Map();
    }

    // start the p2p server
    listen() {
        const server = net.createServer((socket) => {
            this.handleConnection(socket);
        });

        server.listen(this.port, this.host, () => {
            console.debug(`Listening for P2P connections on ${this.host}:${this.port}`);

            this.connectToSeedPeers();
        })

        this.keepAlive();
    }


    handleMessage(socket, message) {
        switch (message.type) {
            case 'BLOCKCHAIN_REQUEST':
                console.debug('Received blockchain request');
                this.sendBlockchain(socket);
                break;
            case "BLOCKCHAIN_RESPONSE":
                this.handleBlockchainResponse(message.data);
                break;
            case "PEERS_REQUEST":
                this.sendPeers(socket, message.data);
                break;
            case "PEERS_RESPONSE":
                this.handlePeersResponse(message.data);
                break;
            case "KEEP_ALIVE":
                console.debug('Received keep alive message');
                break;
            default:
                console.error('Received unknown message type');
        }
    }


    keepAlive() {
        setInterval(() => {
            console.debug('Sending keep alive message');
            // every one miunte, we will send the keep alive message to the peers
            this.broadCast(JSON.stringify({
                type: 'KEEP_ALIVE',
                data: null
            }));
        }, 1000);

        // every 10 seconds, we will console the peers and the height of the blockchain
        setInterval(() => {
            console.debug('Peers:', Array.from(this.peers.keys()));
            console.debug('Blockchain height:', this.blockchain.chain.length);
        }, 1000 * 10);
    }

    // broadcast the message to the network
    broadCast(message) {
        console.log("Broadcasting message to peers");
        this.peers.forEach((peer) => {
            peer.write(message + '\n');
        });
    }


    /**
     * something we want to do: 
     * 1. When a peer connects to the server, we want to send the blockchain to the peer 
     * {
     *  1. a peer request the blockchain.  =
     *  2. the server sends the blockchain to the peer = 
     *     handle the blockchain response from the peer =
     *  3. a peer request the seeds list =
     *  4. send the seeds list to the peer =
     *  5. handle the response message about the seed list from the peer = 
     *  6. remove the peer =
     * }
     * 2. broadcast the blockchain to the network while a new block is added to the blockchain = 
     * 3. connect to another peer  = 
     * 4. try to connect to the seed peers = 
     * 5. keep the connection alive = 
     * 
     * 6. handle the socket connection  =
     * 7. handle the socket error 
     * 8. handle the socket close  =
     */

    // here are the blockchain logic
    requestBlockchain(socket) {
        const message = {
            type: 'BLOCKCHAIN_REQUEST',
            data: null
        }
        this.sendToSocket(socket, message);
    }

    sendBlockchain(socket) {
        const message = {
            type: 'BLOCKCHAIN_RESPONSE',
            data: this.blockchain.chain
        }
        this.sendToSocket(socket, message);
    }

    handleBlockchainResponse(data) {
        console.debug("Received blockchain response");
        const newBlockchain = data.map(blockData => {
            const block = new Block(blockData.timestamp, blockData.transactions, blockData.previousHash);
            block.nonce = blockData.nonce;
            block.hash = blockData.hash;
            return block;
        });

        if (newBlockchain.length > this.blockchain.chain.length && this.blockchain.isChainValid(newBlockchain)) {
            console.debug("Replacing blockchain");
            this.blockchain.chain = newBlockchain;
            this.blockchain.saveChainToFile();
        } else {
            console.debug("Received blockchain is invalid or shorter than current blockchain");
        }
    }

    // and here are the peer logic
    requestPeers(socket) {
        const message = {
            type: 'PEERS_REQUEST',
            data: {
                host: this.host,
                port: this.port
            }
        }
        this.sendToSocket(socket, message);
    }

    sendPeers(socket, data) {
        this.peers.set(`${data.host}:${data.port}`, socket);
        const peersArray = Array.from(this.peers.keys());

        const message = {
            type: 'PEERS_RESPONSE',
            data: peersArray
        }
        this.sendToSocket(socket, message);
    }

    handlePeersResponse(data) {
        console.debug("Received peers response", data);

        data.forEach(peerAddress => {
            if (!this.peers.has(peerAddress) && this.seedPeers.indexOf !== -1) {

                const [host, port] = peerAddress.split(':');
                this.connectToPeer(host, parseInt(port));
            }
        });
    }

    connectToSeedPeers() {
        this.seedPeers.forEach((peerAddress) => {
            const [host, port] = peerAddress.split(':');
            if (host === this.host && port === this.port) {
                return;
            }
            this.connectToPeer(host, parseInt(port));
        });
    }

    connectToPeer(host, port) {
        if (this.peers.has(`${host}:${port}`)) {
            console.debug(`Already connected to peer ${host}:${port}`);
            return;
        }

        if (host === this.host && port === this.port) {
            console.debug(`Cannot connect to self`);
            return;
        }

        const socket = net.createConnection(port, host, () => {
            this.handleConnection(socket);
        });

        this.setUpSocketEventHandlers(socket);
        console.debug(`Connected to peer ${host}:${port}`);

        this.peers.set(`${host}:${port}`, socket);
    }


    removePeer(socket) {
        const key = `${socket.remoteAddress}:${socket.remotePort}`;
        this.peers.delete(key);
    }


    // the socket logic
    // handle the connection
    setUpSocketEventHandlers(socket) {
        socket.on('data', (data) => {
            this.handleSocketData(socket, data);
        });
        socket.on('close', () => {
            this.closeSocket(socket);
        });
        socket.on('error', (error) => {
            this.handleSocketError(socket, error);
        });
    }

    handleConnection(socket) {
        console.debug("New connection");

        this.setUpSocketEventHandlers(socket);
        this.requestBlockchain(socket);
        this.requestPeers(socket);
    }

    // send the message to the socket  
    sendToSocket(socket, message) {
        const messageString = JSON.stringify(message) + '\n';
        console.debug(`Sending message: ${messageString}`);
        socket.write(messageString);
    }

    // handle the data
    handleSocketData(socket, data) {
        const message = data.toString().split('\n').filter(messageStr => messageStr);

        message.forEach((messageStr) => {
            try {
                const message = JSON.parse(messageStr);
                this.handleMessage(socket, message);
            } catch (error) {
                console.error('Error parsing message', error);
            }
        })
    }

    // handle the close
    closeSocket(socket) {
        console.debug('Closing socket');
        this.removePeer(socket);
    }

    //handle the error
    handleSocketError(socket, error) {
        console.error('Socket error', error);
        this.removePeer(socket);
    }

}


'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var webSocket = require('ws');
var Block = require('./model/BlockModel');
var http_port = process.env.HTTP_PORT || 3001;
var p2p_port = process.env.P2P_PORT || 6001;
var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

var SHA256 = require("crypto-js/sha256");
var sockets = [];
var MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
};
var blockChain = [createGenesisBlock()]

/*function getPort() {
    tcpPortUsed.check(6001, '127.0.0.1')
        .then(function (inUse) {
            if (inUse) {
                portfinder.getPort((err, port) => {
                    initP2PServer(port);
                })
            } else {
                initP2PServer(6001);
            }

        }, function (err) {
            console.log(err)
            portfinder.getPort((err, port) => {
                initP2PServer(port);
            })
        }).catch(err => {
        portfinder.getPort((err, port) => {
            initP2PServer(port);
        })
    });
}

getPort();*/

function createGenesisBlock() {
    return new Block(0, "0", 0, "Genesis");
}


function addABlock(data) {
    var lastBlock = blockChain[blockChain.length - 1];
    var nextIndex = lastBlock.index +1;
    blockChain.push(new Block(nextIndex, lastBlock.hash, new Date().getMilliseconds(), data))
}


// 0000beb3f1dadcf4bac70bd6b37c01ec95a73d2d1745d4863cf4406759e8da9a
// 0000beb3f1dadcf4bac70bd6b37c01ec95a73d2d1745d4863cf4406759e8da9a
// 0000d9460b0ac2b26ca31244805a1df19fc86bf3254b4a49f9e4afd099c2004a
addABlock("Nos");
addABlock("Freddy");
addABlock("Martin");
addABlock("Richard");
console.log(blockChain)

function validateChain() {
    var valid = true
    for (var i = 0; i < blockChain.length; i++) {
        if (i + 1 < blockChain.length)
            if (blockChain[i].hash!== blockChain[i + 1].previousHash)
                valid = false;
    }
    return valid;
}

console.log(validateChain())

var initHttpServer =() => {

    var app = express();
    app.use(bodyParser.json());
    app.get('/blocks', (req, res) => res.send(JSON.stringify(blockChain)));
    app.post('/mineBlock', (req, res) => {
        var newBlock = req.body.data;
        addABlock(newBlock);
        broadcast(responseLatestMsg());
        console.log('New Block added : ', JSON.stringify(newBlock));
        res.send();
    });
    app.get('/peers', (req, res) => {
        res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });
    app.post('/addPeer', (req, res) =>{
        connectToPeers([req.body.peer]);
        res.send();
    });
    app.listen(http_port, () => console.log('Listening on port : ' + http_port));
};

var initP2PServer = () => {
    var server = new webSocket.Server({port: p2p_port});
    server.on('connection', ws => initConnection(ws));
    console.log('listening websocket p2p port on: ' + p2p_port);

};

var initConnection = (ws) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
};

var initMessageHandler = (ws) => {
    ws.on('message', (data) => {
        var message = JSON.parse(data);
        console.log('Received message' + JSON.stringify(message));
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                write(ws, responseLatestMsg());
                break;
            case MessageType.QUERY_ALL:
                write(ws, responseChainMsg());
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                handleBlockchainResponse(message);
                break;
        }
    });
};

var initErrorHandler = (ws) => {
    var closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};

var connectToPeers = (newPeers) => {
    newPeers.forEach((peer) => {
        var ws = new webSocket(peer);
        ws.on('open', () => initConnection(ws));
        ws.on('error', () => {
            console.log('connection failed')
        });
    });
};

var handleBlockchainResponse = (message) => {
    var receivedBlocks = JSON.parse(message.data).sort((b1, b2) => (b1.index - b2.index));
    var latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    var latestBlockHeld = getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log('blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            console.log("We can append the received block to our chain");
            blockChain.push(latestBlockReceived);
            broadcast(responseLatestMsg());
        } else if (receivedBlocks.length === 1) {
            console.log("We have to query the chain from our peer");
            broadcast(queryAllMsg());
        } else {
            console.log("Received blockchain is longer than current blockchain");
            replaceChain(receivedBlocks);
        }
    } else {
        console.log('received blockchain is not longer than received blockchain. Do nothing');
    }
};

var replaceChain = (newBlocks) => {
    if (isValidChain(newBlocks) && newBlocks.length > blockChain.length) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockChain = newBlocks;
        broadcast(responseLatestMsg());
    } else {
        console.log('Received blockchain invalid');
    }
};

var isValidChain = (blockchainToValidate) => {
    if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(getGenesisBlock())) {
        return false;
    }
    var tempBlocks = [blockchainToValidate[0]];
    for (var i = 1; i < blockchainToValidate.length; i++) {
        if (isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
            tempBlocks.push(blockchainToValidate[i]);
        } else {
            return false;
        }
    }
    return true;
};

var getLatestBlock = () => blockChain[blockChain.length - 1];
var queryChainLengthMsg = () => ({'type': MessageType.QUERY_LATEST});
var queryAllMsg = () => ({'type': MessageType.QUERY_ALL});
var responseChainMsg = () =>({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(blockChain)
});
var responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([getLatestBlock()])
});

var write = (ws, message) => ws.send(JSON.stringify(message));
var broadcast = (message) => sockets.forEach(socket => write(socket, message));

connectToPeers(initialPeers);
initHttpServer();
initP2PServer();
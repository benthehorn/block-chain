'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var webSocket = require('ws');
var Block = require('./model/BlockModel');
var http_port = process.env.HTTP_PORT || 3001;
var tcpPortUsed = require('tcp-port-used');
var portfinder = require('portfinder');


var bc = require('./blockchainModule');

function getPort() {
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

getPort();
var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

var SHA256 = require("crypto-js/sha256");
var sockets = [];
var MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
};



// 0000beb3f1dadcf4bac70bd6b37c01ec95a73d2d1745d4863cf4406759e8da9a
// 0000beb3f1dadcf4bac70bd6b37c01ec95a73d2d1745d4863cf4406759e8da9a
// 0000d9460b0ac2b26ca31244805a1df19fc86bf3254b4a49f9e4afd099c2004a
bc.addBlock("Nos");
bc.addBlock("Freddy");
bc.addBlock("Martin");
bc.addBlock("Richard");
console.log(bc.getChain())

function validateChain() {
    var valid = true
    for (var i = 0; i < bc.getLength(); i++) {
        if (i + 1 < bc.getLength())
            if (bc.getChain()[i].hash !== bc.getChain()[i + 1].previousHash)
                valid = false;
    }
    return valid;
}

console.log(validateChain())

var initHttpServer = () => {

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
    app.post('/addPeer', (req, res) => {
        connectToPeers([req.body.peer]);
        res.send();
    });
    portfinder.getPort((err, port) => {
        app.listen(port, () => console.log('Listening on port : ' + port));
    })

}

var initP2PServer = (portIn) => {
    var server = new webSocket.Server({port: portIn});
    server.on('connection', ws => initConnection(ws));
    console.log('listening websocket p2p port on: ' + portIn);

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
    var latestBlockReceived = bc.getLatestBlock();
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
            bc.replaceChain(receivedBlocks);
        }
    } else {
        console.log('received blockchain is not longer than received blockchain. Do nothing');
    }
};


var queryChainLengthMsg = () => ({'type': MessageType.QUERY_LATEST});
var queryAllMsg = () => ({'type': MessageType.QUERY_ALL});
var responseChainMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(bc.getChain())
});
var responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([bc.getLatestBlock()])
});

var write = (ws, message) => ws.send(JSON.stringify(message));
var broadcast = (message) => sockets.forEach(socket => write(socket, message));

connectToPeers(initialPeers);
initHttpServer();

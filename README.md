# block-chain
School assignment about Blockchains.

## Implementation:

We are using node js for our implementation. A docker compose file will create a peer to peer
network that will use http and web sockets to communicate between nodes.

## Block:

Our block is constructed as a class like so:

```
constructor(index, previousHash, timestamp, data) {
        this._previousHash = previousHash;
        this._index = index;
        this._timestamp = timestamp;
        this._data = data;
        this.nonceGenerator();
    }



    nonceGenerator() {
        this._nonce = 0;
        this._hash = SHA256(this._index+this._data+this._previousHash+this._timestamp).toString();
        while (this._hash.substr(0, 4) !== "0000") {
            this._nonce++;
            this._hash = SHA256(this._nonce+this._hash).toString()
        }

    }
```

As can be seen, we create the nonce (proof of work) using a difficulty of 4 for the data integrity.

And we always start a chain with a genesis block, with attributes set to zero.

```
function createGenesisBlock() {
    return new Block(0, "0", 0, "Genesis");

}

```

Blocks are stored in an Array.

When the program is first run, a sample block chain is created, and we can see that the hashes are
correctly synchronized., with the hash of the first block being the previous hash of the next.

```
Block {
    _previousHash: '00004f9e999536c39cb44b2353f38aaa20c55366fbd28ba4f35148750defa36c',
    _index: 3,
    _timestamp: 705,
    _data: 'Martin',
    _nonce: 209814,
    _hash: '00002acf3a4d82850ae488e581c9fb7d5b7708c70e0d1484a56084768d3a85c3' },
  Block {
    _previousHash: '00002acf3a4d82850ae488e581c9fb7d5b7708c70e0d1484a56084768d3a85c3',
    _index: 4,
    _timestamp: 72,
    _data: 'Richard',
    _nonce: 100210,
    _hash: '00008b583ea8c865f136837a4974e4f66a282124db90db3b178592ce9e9d8232' } ]

```

Still to do:
Using the npm portfinder module.
The following function won't work with docker, because it finds open ports, then uses them.
This is a problem we couldn't solve, as the docker compose file requires ports to be defined:

```
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

```

But if it were to work, we would have a true p2p network, where the initial node would search for others,
then become the server if none were found.
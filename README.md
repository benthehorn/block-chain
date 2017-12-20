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
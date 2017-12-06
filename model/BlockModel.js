
var SHA256 = require("crypto-js/sha256");
module.exports = class Block {




    get hash() {
        return this._hash;
    }

    set hash(value) {
        this._hash = value;
    }

    get index() {
        return this._index;
    }

    get previousHash() {
        return this._previousHash;
    }

    get timestamp() {
        return this._timestamp;
    }

    get data() {
        return this._data;
    }

    get nonce(){
        return this._nonce;
    }
    set nonce(nonce ){
         this._nonce = nonce;
    }

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




}
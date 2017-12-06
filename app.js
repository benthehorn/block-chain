var Block = require('./model/BlockModel');


var SHA256 = require("crypto-js/sha256");


var blockChain = [createGenesisBlock()]

function createGenesisBlock() {
    return new Block(0, "0", 0, "Ben Genesis");
}


function addABlock(data) {
    var lastBlock = blockChain[blockChain.length - 1];
    blockChain.push(new Block(++lastBlock.index, lastBlock.hash, new Date().getMilliseconds(), data))
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
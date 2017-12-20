var Block = require('./model/BlockModel');


var blockChain = [createGenesisBlock()]

function createGenesisBlock() {
    return new Block(0, "0", 0, "Ben Genesis");

}

module.exports = {

    addBlock: function (data) {
        var lastBlock = blockChain[blockChain.length - 1];
        var nextIndex = lastBlock.index + 1;
        blockChain.push(new Block(nextIndex, lastBlock.hash, new Date().getMilliseconds(), data))
        return true;
    },
    replaceChain: function (chain) {

        var replaceChain = (newBlocks) => {
            if (isValidChain(newBlocks) && newBlocks.length > blockChain.length) {
                console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
                blockChain = newBlocks;
                broadcast(responseLatestMsg());
            } else {
                console.log('Received blockchain invalid');
            }
        };
    },
    isValidChain: (blockchainToValidate) => {
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
    }, getChain: function () {
        return blockChain;
    }, setChain: function (newChain, allchains) {
        var correct = 0;
        allchains.forEach(chain => {
            var small;
            var big;
            if (chain.length > newChain.length) {
                small = newChain;
                big = chain;
            }
            small.forEach((item, index) => {
                if (item === big[index]) {
                    correct++;
                } else {
                    correct--;
                }
            })
        });
        (correct >= 0)? blockChain=newChain : false ;
        return (correct >= 0) ? true : false;
    }
    , getLatestBlock: () => blockChain[blockChain.length - 1]
    , queryChainLengthMsg: () => ({'type': MessageType.QUERY_LATEST})
    , getLength: function () {
        return blockChain.length;
    }

};


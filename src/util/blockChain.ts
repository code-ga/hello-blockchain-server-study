import { BlockChainClass } from "../core/Blockchain/BlockChainClass";

const blockchain = new BlockChainClass();
blockchain.init().then(() => {
    console.log("init");
});

export { blockchain };
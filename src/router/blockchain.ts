import { ec as EC } from "elliptic";
import { Router } from "express";
import { getChain } from "../core/util/db";

const BlockChainRouter = Router();
var ec = new EC("secp256k1");

BlockChainRouter.get("/blockchain", async (req, res) => {
    const data = await getChain();
    res.json({
        data,
    });
});


export default BlockChainRouter;

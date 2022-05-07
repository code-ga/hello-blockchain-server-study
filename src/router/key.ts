import { Router } from "express";
import { generateKeyPair } from "./../core/util/keygeneraction";

const KeyRouter = Router();

KeyRouter.get("/create", (req, res) => {
  const key = generateKeyPair();
  const publicKey = key.publicKey;
  const privateKey = key.privateKey;
  res.json({
    publicKey,
    privateKey,
  });
});

export default KeyRouter;

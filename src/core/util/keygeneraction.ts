import EC from "elliptic"

const ec = new EC.ec("secp256k1")

export const generateKeyPair = () => {
  const keyPair = ec.genKeyPair()
  const publicKey = keyPair.getPublic("hex")
  const privateKey = keyPair.getPrivate("hex")
  return { publicKey, privateKey , keyPair }
}
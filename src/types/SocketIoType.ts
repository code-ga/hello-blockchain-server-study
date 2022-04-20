export interface ServerToClientEvents {
  checkConnection: (server: boolean) => void;
  startMining: (data: { urlCall: string }) => void;
}

export interface ClientToServerEvents {
  connectOk: () => void;
  registerMiner: (data: { MinerPublicKey: string }) => void;
  startMining: () => void;
}

export interface InterServerEvents {}

export interface SocketData {}

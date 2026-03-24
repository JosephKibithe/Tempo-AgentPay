export const TEMPO_MAINNET = {
  chainId: 4217,
  currency: 'USD',
  rpc: 'https://rpc.tempo.xyz',
  ws: 'wss://rpc.tempo.xyz',
  explorer: 'https://explore.tempo.xyz',
};

export const TEMPO_TESTNET = {
  chainId: 42431,
  rpc: 'https://rpc.moderato.tempo.xyz',
  ws: 'wss://rpc.moderato.tempo.xyz',
  explorer: 'https://explore.testnet.tempo.xyz',
};

// Assuming moderato (testnet) for MVP
export const networkConfig = TEMPO_TESTNET;

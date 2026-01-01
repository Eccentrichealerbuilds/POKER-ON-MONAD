/**
 * Entropy Dealer V2 - Commit-Reveal VRF Scheme
 * Uses backend for card dealing, only commits/verifies on-chain
 */

import {
  createPublicClient,
  http,
  Address,
  Hex,
  parseEventLogs,
  decodeEventLog,
  getContract,
  PublicClient,
  encodeFunctionData,
} from "viem";
import { defineChain } from "viem";

// ---------------------- Chain definition ----------------------
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
    public: { http: ["https://testnet-rpc.monad.xyz"] },
  },
});

// ---------------------- V2 Contract Address ----------------------
export const DEALER_ADDRESS = "0x5100d804d20DEb4DC0C29cA501A51cF4e8dc9d23" as Address;

// ---------------------- V2 ABI ----------------------
export const dealerAbiV2 = [
  {
    "inputs": [
      { "internalType": "bytes32", "name": "gameId", "type": "bytes32" },
      { "internalType": "bytes32", "name": "saltHash", "type": "bytes32" }
    ],
    "name": "commitSalt",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "gameId", "type": "bytes32" }],
    "name": "requestShuffle",
    "outputs": [{ "internalType": "uint64", "name": "seq", "type": "uint64" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "gameId", "type": "bytes32" },
      { "internalType": "bytes32", "name": "salt", "type": "bytes32" },
      { "internalType": "uint8[]", "name": "dealtCards", "type": "uint8[]" },
      { "internalType": "uint8[]", "name": "cardPositions", "type": "uint8[]" }
    ],
    "name": "revealAndVerify",
    "outputs": [{ "internalType": "bool", "name": "valid", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "gameId", "type": "bytes32" }],
    "name": "getGameState",
    "outputs": [
      { "internalType": "bytes32", "name": "saltHash", "type": "bytes32" },
      { "internalType": "bytes32", "name": "pythSeed", "type": "bytes32" },
      { "internalType": "bool", "name": "vrfFulfilled", "type": "bool" },
      { "internalType": "bool", "name": "gameEnded", "type": "bool" },
      { "internalType": "bool", "name": "verified", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getShuffleFee",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "gameId", "type": "bytes32" },
      { "indexed": false, "internalType": "bytes32", "name": "saltHash", "type": "bytes32" },
      { "indexed": false, "internalType": "address", "name": "host", "type": "address" }
    ],
    "name": "SaltCommitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "gameId", "type": "bytes32" },
      { "indexed": false, "internalType": "uint64", "name": "sequenceNumber", "type": "uint64" }
    ],
    "name": "ShuffleRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "gameId", "type": "bytes32" },
      { "indexed": false, "internalType": "bytes32", "name": "pythSeed", "type": "bytes32" }
    ],
    "name": "VRFFulfilled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "gameId", "type": "bytes32" },
      { "indexed": false, "internalType": "bytes32", "name": "salt", "type": "bytes32" },
      { "indexed": false, "internalType": "bytes32", "name": "finalSeed", "type": "bytes32" },
      { "indexed": false, "internalType": "bool", "name": "valid", "type": "bool" }
    ],
    "name": "GameVerified",
    "type": "event"
  }
] as const;

// ---------------------- Helpers ----------------------

export function getPublicClient(): PublicClient {
  return createPublicClient({ chain: monadTestnet, transport: http(monadTestnet.rpcUrls.default.http[0]) });
}

export function getDealerContract(client: PublicClient) {
  return getContract({ address: DEALER_ADDRESS, abi: dealerAbiV2, client });
}

export async function fetchShuffleFee(): Promise<bigint> {
  const publicClient = getPublicClient();
  const contract = getDealerContract(publicClient);
  return contract.read.getShuffleFee();
}

// Encode commitSalt call
export function encodeCommitSaltData(gameId: Hex, saltHash: Hex): Hex {
  return encodeFunctionData({
    abi: dealerAbiV2,
    functionName: 'commitSalt',
    args: [gameId, saltHash]
  });
}

// Encode requestShuffle call (V2 requires gameId)
export function encodeRequestShuffleData(gameId: Hex): Hex {
  return encodeFunctionData({
    abi: dealerAbiV2,
    functionName: 'requestShuffle',
    args: [gameId]
  });
}

// Encode revealAndVerify call
export function encodeRevealAndVerifyData(
  gameId: Hex,
  salt: Hex,
  dealtCards: number[],
  cardPositions: number[]
): Hex {
  return encodeFunctionData({
    abi: dealerAbiV2,
    functionName: 'revealAndVerify',
    args: [gameId, salt, dealtCards, cardPositions]
  });
}

// Wait for VRFFulfilled event
export async function waitForVRFFulfilled(
  gameId: Hex,
  onFulfilled: (pythSeed: string) => void
): Promise<() => void> {
  const publicClient = getPublicClient();
  const contract = getDealerContract(publicClient);
  
  const currentBlock = await publicClient.getBlockNumber();
  let fromBlock = currentBlock - 50n;
  if (fromBlock < 0n) fromBlock = 0n;
  
  console.log('[V2] Watching for VRFFulfilled event from block:', fromBlock.toString());
  console.log('[V2] Looking for gameId:', gameId);
  
  // Check existing events first
  try {
    const logs = await publicClient.getLogs({
      address: DEALER_ADDRESS,
      event: {
        type: 'event',
        name: 'VRFFulfilled',
        inputs: [
          { name: 'gameId', type: 'bytes32', indexed: true },
          { name: 'pythSeed', type: 'bytes32', indexed: false }
        ]
      },
      fromBlock,
      toBlock: 'latest'
    });
    
    for (const log of logs) {
      const decoded = decodeEventLog({
        abi: [{
          type: 'event',
          name: 'VRFFulfilled',
          inputs: [
            { name: 'gameId', type: 'bytes32', indexed: true },
            { name: 'pythSeed', type: 'bytes32', indexed: false }
          ]
        }],
        data: log.data,
        topics: log.topics
      });
      
      if (decoded.args.gameId === gameId) {
        console.log('[V2] Found existing VRFFulfilled event!');
        onFulfilled(decoded.args.pythSeed as string);
        return () => {};
      }
    }
  } catch (error) {
    console.log('[V2] Error checking existing events:', error);
  }
  
  // Watch for new events
  const unwatch = contract.watchEvent.VRFFulfilled({
    gameId: gameId as `0x${string}`,
  }, {
    fromBlock: currentBlock,
    onLogs: (logs: any[]) => {
      console.log('[V2] Received VRFFulfilled event logs:', logs.length);
      for (const log of logs) {
        if (log.args.gameId === gameId) {
          console.log('[V2] Found matching VRFFulfilled event!');
          try { unwatch(); } catch {}
          onFulfilled(log.args.pythSeed as string);
        }
      }
    },
  });
  
  return unwatch;
}

// Parse sequence number from ShuffleRequested event
export function parseSequenceFromReceipt(receipt: any): bigint {
  const parsed = parseEventLogs({ abi: dealerAbiV2, logs: receipt.logs });
  const evt = parsed.find((l) => l.eventName === "ShuffleRequested");
  if (!evt) throw new Error("ShuffleRequested event not found");
  if (!(evt.args as any).sequenceNumber) throw new Error("Sequence number not found");
  return BigInt((evt.args as any).sequenceNumber);
}

// Get game state from contract
export async function getGameState(gameId: Hex): Promise<{
  saltHash: Hex;
  pythSeed: Hex;
  vrfFulfilled: boolean;
  gameEnded: boolean;
  verified: boolean;
}> {
  const publicClient = getPublicClient();
  const contract = getDealerContract(publicClient);
  const [saltHash, pythSeed, vrfFulfilled, gameEnded, verified] = await contract.read.getGameState([gameId]);
  return { saltHash, pythSeed, vrfFulfilled, gameEnded, verified };
}

// Generate a unique gameId from room code and hand counter
export function generateGameId(roomCode: string, handCounter: number): Hex {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${roomCode}-${handCounter}`);
  // Simple hash - in production use keccak256
  let hash = 0n;
  for (let i = 0; i < data.length; i++) {
    hash = (hash * 31n + BigInt(data[i])) % (2n ** 256n);
  }
  return ('0x' + hash.toString(16).padStart(64, '0')) as Hex;
}

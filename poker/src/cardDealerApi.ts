/**
 * Card Dealer API Client
 * Connects to backend for commit-reveal VRF card dealing
 */

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface ApiResponse<T = any> {
  ok: boolean;
  error?: string;
  [key: string]: any;
}

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T & ApiResponse> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.error || 'API request failed');
  }
  return data;
}

/**
 * Initialize a new game - generates salt and returns saltHash for on-chain commitment
 */
export async function initializeGame(gameId: string): Promise<{ saltHash: string }> {
  const data = await apiCall<{ saltHash: string }>('/api/game/init', {
    method: 'POST',
    body: JSON.stringify({ gameId }),
  });
  return { saltHash: data.saltHash };
}

/**
 * Notify backend that VRF has been fulfilled with pythSeed
 */
export async function notifyVRFFulfilled(gameId: string, pythSeed: string): Promise<void> {
  await apiCall('/api/game/vrf-fulfilled', {
    method: 'POST',
    body: JSON.stringify({ gameId, pythSeed }),
  });
}

/**
 * Deal hole cards to a player
 */
export async function dealCards(
  gameId: string,
  player: string,
  count: number = 2
): Promise<{ cards: number[]; cardStrings: string[] }> {
  const data = await apiCall<{ cards: number[]; cardStrings: string[] }>('/api/game/deal', {
    method: 'POST',
    body: JSON.stringify({ gameId, player, count }),
  });
  return { cards: data.cards, cardStrings: data.cardStrings };
}

/**
 * Deal community cards (flop/turn/river)
 */
export async function dealCommunityCards(
  gameId: string,
  count: number,
  burn: boolean = true
): Promise<{ cards: number[]; cardStrings: string[] }> {
  const data = await apiCall<{ cards: number[]; cardStrings: string[] }>('/api/game/community', {
    method: 'POST',
    body: JSON.stringify({ gameId, count, burn }),
  });
  return { cards: data.cards, cardStrings: data.cardStrings };
}

/**
 * Get a player's cards
 */
export async function getPlayerCards(
  gameId: string,
  player: string
): Promise<{ cards: number[]; cardStrings: string[] }> {
  const data = await apiCall<{ cards: number[]; cardStrings: string[] }>(
    `/api/game/${encodeURIComponent(gameId)}/player/${encodeURIComponent(player)}/cards`
  );
  return { cards: data.cards, cardStrings: data.cardStrings };
}

/**
 * Get community cards
 */
export async function getCommunityCards(
  gameId: string
): Promise<{ cards: number[]; cardStrings: string[] }> {
  const data = await apiCall<{ cards: number[]; cardStrings: string[] }>(
    `/api/game/${encodeURIComponent(gameId)}/community`
  );
  return { cards: data.cards, cardStrings: data.cardStrings };
}

/**
 * Get verification data for on-chain reveal
 */
export async function getVerificationData(
  gameId: string
): Promise<{ salt: string; dealtCards: number[]; cardPositions: number[] }> {
  const data = await apiCall<{ salt: string; dealtCards: number[]; cardPositions: number[] }>(
    `/api/game/${encodeURIComponent(gameId)}/verification`
  );
  return { salt: data.salt, dealtCards: data.dealtCards, cardPositions: data.cardPositions };
}

/**
 * Cleanup game after verification
 */
export async function cleanupGame(gameId: string): Promise<void> {
  await apiCall(`/api/game/${encodeURIComponent(gameId)}`, {
    method: 'DELETE',
  });
}

/**
 * Convert card index (0-51) to Card object for engine compatibility
 */
export function cardIndexToCard(cardIndex: number): { rank: number; suit: number } {
  // Match the contract's encoding: suitIdx = val % 4, rankIdx = val / 4
  const suitIdx = cardIndex % 4;
  const rankIdx = Math.floor(cardIndex / 4);
  const rankVal = rankIdx + 2; // Rank enum 2-14 (2=Two, 14=Ace)
  
  // Suit mapping: 0=Hearts, 1=Diamonds, 2=Clubs, 3=Spades
  return { rank: rankVal, suit: suitIdx };
}

/**
 * Convert array of card indices to packed deck format (for engine compatibility)
 */
export function cardsToPackedDeck(cards: number[]): string {
  // Convert to hex string matching the contract format
  const hex = cards.map(c => c.toString(16).padStart(2, '0')).join('');
  return '0x' + hex;
}

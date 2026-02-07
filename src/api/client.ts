import { config } from '../config.js';

export type Market = 'US' | 'EU';

export interface CardSet {
  slug: string;
  name: string;
}

export interface CountryPrice {
  avg: number | null;
  low: number | null;
  high: number | null;
  saleCount: number;
}

export interface TierPrice {
  avg: number | null;
  low: number | null;
  high: number | null;
  saleCount: number;
  lastUpdated?: string | null;
  country?: Record<string, CountryPrice>;
  avg1d?: number | null;
  avg7d?: number | null;
  avg30d?: number | null;
  median3d?: number | null;
  median7d?: number | null;
  median30d?: number | null;
}

export interface CardPrices {
  ebay?: Record<string, TierPrice>;
  tcgplayer?: Record<string, TierPrice>;
  cardmarket?: Record<string, TierPrice>;
  cardmarket_unsold?: Record<string, TierPrice>;
}

export interface CardListItem {
  id: string;
  name: string;
  cardNumber: string | null;
  set: CardSet;
  variant?: string;
  rarity: string | null;
  image: string | null;
  market: Market;
  currency: string;
  lastUpdated: string | null;
}

export interface Card extends CardListItem {
  refs?: {
    tcgplayerId: string | null;
    cardmarketId: string | null;
  };
  prices: CardPrices;
  gradedOptions?: string[];
  conditionOptions?: string[];
  topPrice?: number | null;
  totalSaleCount?: number;
  hasGraded?: boolean;
}

export interface Pagination {
  hasMore: boolean;
  nextCursor: string | null;
  count: number;
}

export interface PriceHistoryEntry {
  date: string;
  source: string;
  avg: number | null;
  low: number | null;
  high: number | null;
  saleCount?: number;
  median3d?: number | null;
  median7d?: number | null;
  median30d?: number | null;
  avg1d?: number | null;
  avg7d?: number | null;
  avg30d?: number | null;
  country?: Record<string, CountryPrice>;
}

const BASE_URL = 'https://api.poketrace.com/v1';
const MAX_RETRIES = 3;

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  const response = await fetch(url, {
    headers: { 'X-API-Key': config.poktraceApiKey },
  });

  if (response.status !== 429) return response;
  if (retries <= 0) throw new Error('Rate limit exceeded after max retries');

  const retryAfter = Number(response.headers.get('Retry-After') ?? '1');
  await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
  return fetchWithRetry(url, retries - 1);
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetchWithRetry(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function searchCards(query: string, limit = 5, market = 'US'): Promise<CardListItem[]> {
  const params = new URLSearchParams({ search: query, limit: String(limit), market });
  const res = await apiGet<{ data: CardListItem[]; pagination: Pagination }>(`/cards?${params}`);
  return res.data;
}

export async function getCard(id: string): Promise<Card> {
  const res = await apiGet<{ data: Card }>(`/cards/${encodeURIComponent(id)}`);
  return res.data;
}

export async function getPriceHistory(
  id: string,
  tier: string,
  period = '30d'
): Promise<PriceHistoryEntry[]> {
  const params = new URLSearchParams({ period });
  const res = await apiGet<{ data: PriceHistoryEntry[]; pagination: Pagination }>(
    `/cards/${encodeURIComponent(id)}/prices/${encodeURIComponent(tier)}/history?${params}`
  );
  return res.data;
}

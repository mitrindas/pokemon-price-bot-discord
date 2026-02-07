import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';

export interface TrackedCardData {
  channelId: string;
  lastPrices: Record<string, number | null>;
  addedAt: string;
  addedBy: string;
}

export interface StoreData {
  [guildId: string]: {
    [cardId: string]: TrackedCardData;
  };
}

const STORE_PATH = join(process.cwd(), 'data', 'tracked.json');

function ensureDir(): void {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
}

function readStore(): StoreData {
  try {
    const raw = readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(raw) as StoreData;
  } catch {
    return {};
  }
}

function writeStore(data: StoreData): void {
  ensureDir();
  const tmp = STORE_PATH + '.tmp';
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  renameSync(tmp, STORE_PATH);
}

export function getTrackedCards(guildId: string): Record<string, TrackedCardData> {
  const store = readStore();
  return store[guildId] ?? {};
}

export function addTrackedCard(guildId: string, cardId: string, data: TrackedCardData): void {
  const store = readStore();
  if (!store[guildId]) {
    store[guildId] = {};
  }
  store[guildId][cardId] = data;
  writeStore(store);
}

export function removeTrackedCard(guildId: string, cardId: string): boolean {
  const store = readStore();
  if (!store[guildId]?.[cardId]) return false;

  delete store[guildId][cardId];
  if (Object.keys(store[guildId]).length === 0) {
    delete store[guildId];
  }
  writeStore(store);
  return true;
}

export function getAllTracked(): StoreData {
  return readStore();
}

export function updateLastPrices(guildId: string, cardId: string, prices: Record<string, number | null>): void {
  const store = readStore();
  if (!store[guildId]?.[cardId]) return;

  store[guildId][cardId].lastPrices = prices;
  writeStore(store);
}

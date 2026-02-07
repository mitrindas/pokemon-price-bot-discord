import cron, { type ScheduledTask } from 'node-cron';
import { Client, TextChannel } from 'discord.js';
import { getCard } from '../api/client.js';
import type { Card } from '../api/client.js';
import { getAllTracked, updateLastPrices } from '../storage/json-store.js';
import { buildNotificationEmbed } from '../utils/embeds.js';
import { config } from '../config.js';

let cronTask: ScheduledTask | null = null;
let discordClient: Client | null = null;

function getCurrentPrices(card: Card): Record<string, number | null> {
  if (card.market === 'US') {
    return {
      tcgplayer_near_mint: card.prices.tcgplayer?.['NEAR_MINT']?.avg ?? null,
      ebay_near_mint: card.prices.ebay?.['NEAR_MINT']?.avg ?? null,
    };
  }
  return {
    cardmarket_aggregated: card.prices.cardmarket?.['AGGREGATED']?.avg ?? null,
    cardmarket_unsold_near_mint: card.prices.cardmarket_unsold?.['NEAR_MINT']?.avg ?? null,
  };
}

function exceedsThreshold(oldPrice: number, newPrice: number): boolean {
  if (oldPrice === 0) return newPrice !== 0;
  const pctChange = Math.abs((newPrice - oldPrice) / oldPrice) * 100;
  return pctChange >= config.priceChangeThreshold;
}

async function checkPrices(): Promise<void> {
  if (!discordClient) return;

  const allTracked = getAllTracked();
  const guildIds = Object.keys(allTracked);
  if (guildIds.length === 0) return;

  for (const guildId of guildIds) {
    const cards = allTracked[guildId];
    const cardIds = Object.keys(cards);

    for (const cardId of cardIds) {
      try {
        const tracked = cards[cardId];
        const card = await getCard(cardId);

        const newPrices = getCurrentPrices(card);
        const priceKeys = Object.keys(newPrices);

        for (const key of priceKeys) {
          const oldPrice = tracked.lastPrices[key];
          const newPrice = newPrices[key];

          if (oldPrice === null || oldPrice === undefined) continue;
          if (newPrice === null) continue;
          if (!exceedsThreshold(oldPrice, newPrice)) continue;

          const channel = await discordClient.channels.fetch(tracked.channelId).catch(() => null);
          if (!channel || !(channel instanceof TextChannel)) continue;

          const label = key.replace(/_/g, ' ');
          const embed = buildNotificationEmbed(card, oldPrice, newPrice, label);
          await channel.send({ embeds: [embed] }).catch((err) => {
            console.error(`Failed to send notification for ${cardId} in guild ${guildId}:`, err);
          });
        }

        updateLastPrices(guildId, cardId, newPrices);
      } catch (err) {
        console.error(`Error checking prices for card ${cardId} in guild ${guildId}:`, err);
      }
    }
  }
}

export function startTracking(client: Client): void {
  discordClient = client;
  cronTask = cron.schedule('0 * * * *', () => {
    checkPrices().catch((err) => {
      console.error('Unhandled error in price check:', err);
    });
  });
  console.log('Price tracking started (hourly checks)');
}

export function stopTracking(): void {
  if (!cronTask) return;
  cronTask.stop();
  cronTask = null;
  discordClient = null;
  console.log('Price tracking stopped');
}

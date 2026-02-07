import { EmbedBuilder } from 'discord.js';
import type { Card, CardListItem, TierPrice, PriceHistoryEntry } from '../api/client.js';
import { formatPrice, formatPercentChange, formatDate, truncate } from './formatters.js';

const COLOR_GOLD = 0xf1c40f;
const COLOR_GREEN = 0x2ecc71;
const COLOR_RED = 0xe74c3c;
const COLOR_BLUE = 0x3498db;

function tierLabel(tier: string): string {
  return tier.replace(/_/g, ' ');
}

function formatTier(tier: string, data: TierPrice, currency: string): string {
  const parts = [`**${tierLabel(tier)}**: ${formatPrice(data.avg, currency)}`];
  if (data.low !== null) parts.push(`Low ${formatPrice(data.low, currency)}`);
  if (data.high !== null) parts.push(`High ${formatPrice(data.high, currency)}`);
  return parts.join(' | ');
}

export function buildSearchResultsEmbed(cards: CardListItem[], query: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`Search results for "${truncate(query, 50)}"`)
    .setColor(COLOR_GOLD);

  if (cards.length === 0) {
    embed.setDescription('No cards found.');
    return embed;
  }

  const lines = cards.map(
    (c, i) =>
      `**${i + 1}.** ${c.name} — ${c.set.name} #${c.cardNumber ?? '?'}${c.variant ? ` (${c.variant})` : ''}`
  );
  embed.setDescription(lines.join('\n'));
  embed.setFooter({
    text: `${cards.length} result${cards.length === 1 ? '' : 's'} | ${cards[0]?.market ?? 'US'} market`,
  });
  return embed;
}

export function buildPriceEmbed(card: Card): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`${card.name} — ${card.set.name} #${card.cardNumber ?? '?'}`)
    .setColor(COLOR_BLUE)
    .setFooter({
      text: `${card.market} market | ${card.rarity ?? 'Unknown'}${card.variant ? ` | ${card.variant}` : ''}`,
    });

  if (card.image) {
    embed.setThumbnail(card.image);
  }

  if (card.topPrice !== undefined && card.topPrice !== null) {
    embed.setDescription(`**Top Price:** ${formatPrice(card.topPrice, card.currency)}`);
  }

  const isGraded = (t: string) => /^(PSA|CGC|BGS|SGC|ACE|TAG)_/.test(t);

  if (card.market === 'US') {
    if (card.prices.tcgplayer) {
      const lines = Object.entries(card.prices.tcgplayer)
        .slice(0, 6)
        .map(([tier, data]) => formatTier(tier, data, card.currency));
      if (lines.length > 0) {
        embed.addFields({ name: 'TCGPlayer', value: lines.join('\n') });
      }
    }

    if (card.prices.ebay) {
      const entries = Object.entries(card.prices.ebay);
      const raw = entries.filter(([t]) => !isGraded(t));
      const graded = entries.filter(([t]) => isGraded(t));

      if (raw.length > 0) {
        const lines = raw.slice(0, 4).map(([tier, data]) => formatTier(tier, data, card.currency));
        embed.addFields({ name: 'eBay', value: lines.join('\n'), inline: true });
      }
      if (graded.length > 0) {
        const lines = graded
          .slice(0, 6)
          .map(([tier, data]) => formatTier(tier, data, card.currency));
        embed.addFields({ name: 'eBay — Graded', value: lines.join('\n') });
      }
    }
  } else {
    // EU: Cardmarket Price Trend (AGGREGATED tier)
    if (card.prices.cardmarket) {
      const agg = card.prices.cardmarket['AGGREGATED'];
      if (agg) {
        const lines = [`**Price Trend:** ${formatPrice(agg.avg, card.currency)}`];
        if (agg.avg7d != null) lines.push(`7d avg: ${formatPrice(agg.avg7d, card.currency)}`);
        if (agg.avg30d != null) lines.push(`30d avg: ${formatPrice(agg.avg30d, card.currency)}`);
        embed.addFields({ name: 'Cardmarket', value: lines.join('\n'), inline: true });
      }
    }

    // EU: Cardmarket Active Listings
    if (card.prices.cardmarket_unsold) {
      const lines = Object.entries(card.prices.cardmarket_unsold)
        .slice(0, 6)
        .map(([tier, data]) => formatTier(tier, data, card.currency));
      if (lines.length > 0) {
        embed.addFields({ name: 'Cardmarket — Listings', value: lines.join('\n') });
      }
    }
  }

  return embed;
}

function buildSparkline(values: (number | null)[]): string {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return 'No data';

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min || 1;
  const bars = ['\u2581', '\u2582', '\u2583', '\u2584', '\u2585', '\u2586', '\u2587', '\u2588'];

  return nums
    .map((v) => bars[Math.round(((v - min) / range) * (bars.length - 1))])
    .join('');
}

export function buildHistoryEmbed(
  card: Card,
  history: PriceHistoryEntry[],
  tier: string,
  period: string
): EmbedBuilder {
  const avgValues = history.map((p) => p.avg);
  const sparkline = buildSparkline(avgValues);

  const firstVal = avgValues.find((v) => v !== null);
  const lastVal = [...avgValues].reverse().find((v) => v !== null);
  const change =
    firstVal != null && lastVal != null ? formatPercentChange(firstVal, lastVal) : 'N/A';

  const embed = new EmbedBuilder()
    .setTitle(`Price History — ${card.name}`)
    .setColor(COLOR_BLUE)
    .setDescription(
      [
        `**Tier:** ${tierLabel(tier)} | **Period:** ${period}`,
        `**Trend:** ${sparkline}`,
        `**Change:** ${change}`,
        `**Data points:** ${history.length}`,
      ].join('\n')
    );

  if (history.length > 0) {
    const first = history[0];
    const last = history[history.length - 1];
    embed.addFields(
      {
        name: 'Start',
        value: `${formatDate(first.date)}\nAvg: ${formatPrice(first.avg, card.currency)}`,
        inline: true,
      },
      {
        name: 'End',
        value: `${formatDate(last.date)}\nAvg: ${formatPrice(last.avg, card.currency)}`,
        inline: true,
      }
    );
  }

  if (card.image) {
    embed.setThumbnail(card.image);
  }

  return embed;
}

export function buildNotificationEmbed(
  card: Card,
  oldPrice: number,
  newPrice: number,
  source: string
): EmbedBuilder {
  const isIncrease = newPrice >= oldPrice;
  const color = isIncrease ? COLOR_GREEN : COLOR_RED;
  const arrow = isIncrease ? '\u2B06' : '\u2B07';
  const pctChange = formatPercentChange(oldPrice, newPrice);

  const embed = new EmbedBuilder()
    .setTitle(`${arrow} Price Alert — ${card.name}`)
    .setColor(color)
    .setDescription(
      [
        `**${card.set.name}** #${card.cardNumber ?? '?'}`,
        `**Source:** ${source}`,
        '',
        `${formatPrice(oldPrice, card.currency)} \u2192 ${formatPrice(newPrice, card.currency)} (${pctChange})`,
      ].join('\n')
    );

  if (card.image) {
    embed.setThumbnail(card.image);
  }

  return embed;
}

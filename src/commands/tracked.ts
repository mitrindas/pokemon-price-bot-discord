import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getTrackedCards } from '../storage/json-store.js';
import { getCard } from '../api/client.js';
import { formatPrice } from '../utils/formatters.js';

export const data = new SlashCommandBuilder()
  .setName('tracked')
  .setDescription('List all tracked cards in this server');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  const cards = getTrackedCards(interaction.guildId);
  const cardIds = Object.keys(cards);

  if (cardIds.length === 0) {
    await interaction.reply({ content: 'No cards are being tracked in this server.', ephemeral: true });
    return;
  }

  await interaction.deferReply();

  const lines: string[] = [];
  for (const cardId of cardIds) {
    const tracked = cards[cardId];
    try {
      const card = await getCard(cardId);
      let priceStr: string;
      if (card.market === 'US') {
        const tcg = card.prices.tcgplayer?.['NEAR_MINT']?.avg;
        const ebay = card.prices.ebay?.['NEAR_MINT']?.avg;
        priceStr = `TCG: ${formatPrice(tcg ?? null, 'USD')} | eBay: ${formatPrice(ebay ?? null, 'USD')}`;
      } else {
        const cm = card.prices.cardmarket?.['AGGREGATED']?.avg;
        priceStr = `CM: ${formatPrice(cm ?? null, 'EUR')}`;
      }
      lines.push(
        `**${card.name}** — ${card.set.name} #${card.cardNumber ?? '?'} (${card.market})\n` +
          `${priceStr} | Channel: <#${tracked.channelId}>`
      );
    } catch {
      lines.push(`**${cardId}** — Failed to fetch current data`);
    }
  }

  const embed = new EmbedBuilder()
    .setTitle('Tracked Cards')
    .setColor(0xf1c40f)
    .setDescription(lines.join('\n\n'))
    .setFooter({ text: `${cardIds.length} card${cardIds.length === 1 ? '' : 's'} tracked` });

  await interaction.editReply({ embeds: [embed] });
}

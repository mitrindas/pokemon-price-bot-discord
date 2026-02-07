import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType } from 'discord.js';
import { getCard } from '../api/client.js';
import type { Card } from '../api/client.js';
import { addTrackedCard, getTrackedCards } from '../storage/json-store.js';
import type { TrackedCardData } from '../storage/json-store.js';

function extractTrackingPrices(card: Card): Record<string, number | null> {
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

export const data = new SlashCommandBuilder()
  .setName('track')
  .setDescription('Start tracking a card for price changes')
  .addStringOption((opt) =>
    opt.setName('card_id').setDescription('Card ID to track').setRequired(true)
  )
  .addChannelOption((opt) =>
    opt
      .setName('channel')
      .setDescription('Channel for notifications (default: current)')
      .addChannelTypes(ChannelType.GuildText)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  const cardId = interaction.options.getString('card_id', true);
  const channel = interaction.options.getChannel('channel') ?? interaction.channel;

  if (!channel) {
    await interaction.reply({ content: 'Could not determine target channel.', ephemeral: true });
    return;
  }

  await interaction.deferReply();

  try {
    const existing = getTrackedCards(interaction.guildId);
    if (existing[cardId]) {
      await interaction.editReply(`Card \`${cardId}\` is already being tracked in this server.`);
      return;
    }

    const card = await getCard(cardId);
    const lastPrices = extractTrackingPrices(card);

    const tracked: TrackedCardData = {
      channelId: channel.id,
      lastPrices,
      addedAt: new Date().toISOString(),
      addedBy: interaction.user.id,
    };

    addTrackedCard(interaction.guildId, cardId, tracked);
    await interaction.editReply(
      `Now tracking **${card.name}** (${card.set.name} #${card.cardNumber ?? '?'}). Notifications will be sent to <#${channel.id}>.`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await interaction.editReply(`Failed to track card: ${message}`);
  }
}

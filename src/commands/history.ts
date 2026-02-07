import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getCard, getPriceHistory } from '../api/client.js';
import { buildHistoryEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('history')
  .setDescription('Show price history for a card')
  .addStringOption((opt) =>
    opt.setName('card_id').setDescription('Card ID to look up').setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName('tier').setDescription('Price tier (default: NEAR_MINT)')
  )
  .addStringOption((opt) =>
    opt
      .setName('period')
      .setDescription('Time period')
      .addChoices(
        { name: '7 days', value: '7d' },
        { name: '30 days', value: '30d' },
        { name: '90 days', value: '90d' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const cardId = interaction.options.getString('card_id', true);
  const tier = interaction.options.getString('tier') ?? 'NEAR_MINT';
  const period = interaction.options.getString('period') ?? '30d';

  await interaction.deferReply();

  try {
    const [card, history] = await Promise.all([
      getCard(cardId),
      getPriceHistory(cardId, tier, period),
    ]);

    const embed = buildHistoryEmbed(card, history, tier, period);
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await interaction.editReply(`Failed to fetch price history: ${message}`);
  }
}

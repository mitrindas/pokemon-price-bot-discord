import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getCard } from '../api/client.js';
import { buildPriceEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('price')
  .setDescription('Get detailed price breakdown for a card')
  .addStringOption((opt) =>
    opt.setName('card_id').setDescription('Card ID to look up').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const cardId = interaction.options.getString('card_id', true);

  await interaction.deferReply();

  try {
    const card = await getCard(cardId);
    const embed = buildPriceEmbed(card);
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await interaction.editReply(`Failed to fetch price: ${message}`);
  }
}

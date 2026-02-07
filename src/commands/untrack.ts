import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { removeTrackedCard } from '../storage/json-store.js';

export const data = new SlashCommandBuilder()
  .setName('untrack')
  .setDescription('Stop tracking a card')
  .addStringOption((opt) =>
    opt.setName('card_id').setDescription('Card ID to stop tracking').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  const cardId = interaction.options.getString('card_id', true);
  const removed = removeTrackedCard(interaction.guildId, cardId);

  if (!removed) {
    await interaction.reply({ content: `Card \`${cardId}\` is not being tracked.`, ephemeral: true });
    return;
  }

  await interaction.reply(`Stopped tracking card \`${cardId}\`.`);
}

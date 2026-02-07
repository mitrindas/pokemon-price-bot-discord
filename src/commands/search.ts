import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { searchCards } from '../api/client.js';
import { buildSearchResultsEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('search')
  .setDescription('Search for Pokemon cards by name')
  .addStringOption((opt) =>
    opt.setName('query').setDescription('Card name to search for').setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName('market')
      .setDescription('Market region (default: US)')
      .addChoices(
        { name: 'US (TCGPlayer + eBay)', value: 'US' },
        { name: 'EU (Cardmarket)', value: 'EU' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const query = interaction.options.getString('query', true);
  const market = interaction.options.getString('market') ?? 'US';

  await interaction.deferReply();

  try {
    const cards = await searchCards(query, 5, market);
    const embed = buildSearchResultsEmbed(cards, query);

    if (cards.length === 0) {
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const priceButtons = cards.map((card, i) =>
      new ButtonBuilder()
        .setCustomId(`price:${card.id}`)
        .setLabel(`${i + 1}. Price`)
        .setStyle(ButtonStyle.Primary)
    );
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(priceButtons));

    const trackButtons = cards.map((card, i) =>
      new ButtonBuilder()
        .setCustomId(`track:${card.id}`)
        .setLabel(`${i + 1}. Track`)
        .setStyle(ButtonStyle.Secondary)
    );
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(trackButtons));

    await interaction.editReply({ embeds: [embed], components: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await interaction.editReply(`Failed to search cards: ${message}`);
  }
}

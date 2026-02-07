import { Client, Events, GatewayIntentBits, type ButtonInteraction } from 'discord.js';
import { config } from './config.js';
import { commands } from './commands/index.js';
import { startTracking, stopTracking } from './services/tracker.js';
import { getCard } from './api/client.js';
import type { Card } from './api/client.js';
import { buildPriceEmbed } from './utils/embeds.js';
import { addTrackedCard, getTrackedCards } from './storage/json-store.js';
import type { TrackedCardData } from './storage/json-store.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  startTracking(client);
});

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

async function handlePriceButton(interaction: ButtonInteraction, cardId: string): Promise<void> {
  await interaction.deferReply();
  const card = await getCard(cardId);
  const embed = buildPriceEmbed(card);
  await interaction.editReply({ embeds: [embed] });
}

async function handleTrackButton(interaction: ButtonInteraction, cardId: string): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'This can only be used in a server.', ephemeral: true });
    return;
  }

  if (!interaction.channelId) {
    await interaction.reply({ content: 'Could not determine target channel.', ephemeral: true });
    return;
  }

  await interaction.deferReply();

  const existing = getTrackedCards(interaction.guildId);
  if (existing[cardId]) {
    await interaction.editReply(`Card \`${cardId}\` is already being tracked in this server.`);
    return;
  }

  const card = await getCard(cardId);
  const lastPrices = extractTrackingPrices(card);

  const tracked: TrackedCardData = {
    channelId: interaction.channelId,
    lastPrices,
    addedAt: new Date().toISOString(),
    addedBy: interaction.user.id,
  };

  addTrackedCard(interaction.guildId, cardId, tracked);
  await interaction.editReply(
    `Now tracking **${card.name}** (${card.set.name} #${card.cardNumber ?? '?'}). Notifications will be sent to <#${interaction.channelId}>.`
  );
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    const [action, ...rest] = interaction.customId.split(':');
    const cardId = rest.join(':');

    try {
      if (action === 'price') {
        await handlePriceButton(interaction, cardId);
        return;
      }
      if (action === 'track') {
        await handleTrackButton(interaction, cardId);
        return;
      }
    } catch (err) {
      console.error(`Error handling button ${interaction.customId}:`, err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: `Error: ${msg}`, ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ content: `Error: ${msg}`, ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error executing /${interaction.commandName}:`, err);
    const reply = { content: 'An error occurred while running this command.', ephemeral: true } as const;
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

function shutdown(): void {
  console.log('Shutting down...');
  stopTracking();
  client.destroy();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

client.login(config.discordToken);

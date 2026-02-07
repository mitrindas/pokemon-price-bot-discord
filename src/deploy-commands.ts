import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import { commands } from './commands/index.js';

const rest = new REST({ version: '10' }).setToken(config.discordToken);

const commandData = commands.map((cmd) => cmd.data.toJSON());

console.log(`Deploying ${commandData.length} slash commands...`);

try {
  await rest.put(Routes.applicationCommands(config.clientId), { body: commandData });
  console.log('Successfully deployed slash commands globally.');
} catch (err) {
  console.error('Failed to deploy commands:', err);
  process.exit(1);
}

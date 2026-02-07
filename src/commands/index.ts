import { Collection, type ChatInputCommandInteraction, type SharedNameAndDescription } from 'discord.js';

import * as search from './search.js';
import * as price from './price.js';
import * as track from './track.js';
import * as untrack from './untrack.js';
import * as tracked from './tracked.js';
import * as history from './history.js';

export interface Command {
  data: SharedNameAndDescription & { toJSON: () => unknown };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commandModules: Command[] = [search, price, track, untrack, tracked, history];

export const commands = new Collection<string, Command>();
for (const cmd of commandModules) {
  commands.set(cmd.data.name, cmd);
}

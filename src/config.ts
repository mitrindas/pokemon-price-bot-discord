import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  discordToken: requireEnv('DISCORD_TOKEN'),
  clientId: requireEnv('DISCORD_CLIENT_ID'),
  poktraceApiKey: requireEnv('POKETRACE_API_KEY'),
  priceChangeThreshold: Number(process.env.PRICE_CHANGE_THRESHOLD ?? '5'),
} as const;

# Pokemon Card Price Tracker Discord Bot

A Discord bot for monitoring and tracking Pokemon TCG card prices. Look up US market prices (TCGPlayer + eBay) or EU market prices (Cardmarket sold and active listings), set up automated price alerts, and view historical price trends — all from your Discord server.



## Preview

<p align="center">
  <img src="https://github.com/user-attachments/assets/bd1a0786-c92e-4687-a71b-e80963bfc156" width="600" />
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/389e789c-d394-47e0-8521-31212abf5794" width="700" />
</p>



## Features

- **US market prices out of the box** — TCGPlayer + eBay prices work on the free API tier
- **EU market support** — Optionally search EU cards (Cardmarket sold/active listings) with a paid API plan
- **Card search** — Search across thousands of Pokemon cards by name
- **Price history and trends** — View price trends over time with sparkline charts
- **Graded card prices** — See PSA, BGS, and CGC graded card valuations
- **Automated price monitoring** — Track cards and receive alerts when prices change significantly
- **Per-server tracking** — Each Discord server manages its own watchlist independently
- **Hourly price checks** — Tracked cards are polled every hour for price movements
- **Configurable alert threshold** — Set the percentage change that triggers a notification

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v22 or later
- A Discord bot token (see setup below)
- A [PokeTrace API](https://poketrace.com) key — the free tier includes US market prices (TCGPlayer + eBay), which covers most use cases. EU prices (Cardmarket) require a paid plan.

### Creating a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**
2. Give your application a name (e.g., "Pokemon Price Bot") and click **Create**
3. Copy the **Application ID** from the General Information page — this is your `DISCORD_CLIENT_ID`
4. Go to the **Bot** tab on the left sidebar and click **Reset Token** to generate a bot token — this is your `DISCORD_TOKEN`. Copy it now, you won't be able to see it again.
5. Under the Bot tab, make sure **Message Content Intent** is disabled (not needed) and **Server Members Intent** is disabled (not needed)

### Inviting the Bot to Your Server

1. Go to the **OAuth2** tab in the Developer Portal
2. Under **OAuth2 URL Generator**, select the `bot` and `applications.commands` scopes
3. Under **Bot Permissions**, select: `Send Messages`, `Embed Links`, `Use Slash Commands`
4. Copy the generated URL and open it in your browser to invite the bot to your server

For more details, see the official [discord.js guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html).

### Getting a PokeTrace API Key

1. Go to [poketrace.com](https://poketrace.com) and create a free account
2. Navigate to [Dashboard](https://poketrace.com/dashboard) and copy your API key
3. The free tier gives you 500 requests/day — enough for personal use and small servers

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/pokemon-price-discord-bot.git
cd pokemon-price-discord-bot
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file from the example:

```bash
cp .env.example .env
```

4. Fill in your `.env` with the values from the steps above:

```
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_application_id
POKETRACE_API_KEY=your_poketrace_api_key
PRICE_CHANGE_THRESHOLD=5
```

5. Build the project:

```bash
npm run build
```

6. Register slash commands with Discord (only needed once, or when commands change):

```bash
npm run deploy-commands
```

> Slash commands can take up to an hour to appear globally. For instant testing, you can modify `deploy-commands.ts` to register guild-specific commands instead.

7. Start the bot:

```bash
npm start
```

You should see `Logged in as YourBot#1234` in the console. Try `/search charizard` in your server to verify it works.

## Commands

| Command | Description |
|---------|-------------|
| `/search <query> [market]` | Search for Pokemon cards by name (US or EU) |
| `/price <card_id>` | View detailed price breakdown for a card |
| `/history <card_id> [tier] [period]` | View price history with trend chart |
| `/track <card_id>` | Add a card to your server's watchlist |
| `/untrack <card_id>` | Remove a card from your server's watchlist |
| `/tracked` | Show all tracked cards in your server |

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_TOKEN` | Yes | — | Bot token from the Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Yes | — | Application client ID from Discord |
| `POKETRACE_API_KEY` | Yes | — | API key for fetching card prices |
| `PRICE_CHANGE_THRESHOLD` | No | `5` | Minimum price change percentage to trigger an alert |

## Supported Markets

| Market | Region | Data |
|--------|--------|------|
| **TCGPlayer** | US | Market price, average, low, high |
| **eBay** | US | Average, low, high (recent sales) |
| **Cardmarket** | EU | Sold prices + active listing prices |
| **Graded** | US / EU | PSA, BGS, CGC valuations |

> **Note:** US and EU cards are separate — a US card shows TCGPlayer and eBay prices, while an EU card shows Cardmarket sold and active listing prices. Use the `market` option in `/search` to switch between regions. The free API tier covers US prices, which is enough for most users.

## How Price Tracking Works

1. Use `/track <card_id>` to add a card to your server's watchlist
2. The bot checks prices every hour for all tracked cards
3. When a price moves more than the configured threshold (default 5%), the bot sends an alert to the channel where the card was tracked
4. Use `/untrack <card_id>` to stop monitoring a card

Tracked card data is stored locally in `data/tracked.json` and persists across restarts.

## Project Structure

```
src/
  api/client.ts         # PokeTrace API client with retry logic
  commands/             # Slash command definitions and handlers
  services/tracker.ts   # Hourly price polling and notification service
  storage/json-store.ts # JSON file-based persistence
  utils/embeds.ts       # Discord embed builders
  utils/formatters.ts   # Price and date formatting helpers
  config.ts             # Environment configuration
  index.ts              # Bot entry point
  deploy-commands.ts    # Slash command registration script
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgements

Price data provided by the [PokeTrace API](https://poketrace.com). If you're building your own project, check out their [LLM integration prompt](https://poketrace.com/docs/llm-integration) for a quick start.

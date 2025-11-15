# EasyTransfer 2.0 - Telegram Bot

Telegram bot interface built with grammY for EasyTransfer 2.0 money transfer system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your bot token and backend URL
```

3. Get Telegram Bot Token:
   - Talk to [@BotFather](https://t.me/BotFather)
   - Create new bot or use existing one
   - Copy token to `.env`

## Development

```bash
# Start in development mode (polling)
npm run dev

# Build
npm run build

# Production
npm start
```

## Deployment Modes

### Development (Long Polling)
Set in `.env`:
```
BOT_MODE=polling
```

### Production (Webhook)
Set in `.env`:
```
BOT_MODE=webhook
WEBHOOK_URL=https://api.easytransfer.com/bot/webhook
```

## Commands

- `/start` - Welcome message
- `/send` - Interactive transfer mode
- `/send <amount> <phone>` - Quick transfer shortcut

## Documentation

See `docs/telegram-bot-spec.md` for complete specification.

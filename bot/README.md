# EasyTransfer 2.0 - Telegram Bot

Telegram bot for EasyTransfer 2.0 money transfer system. Allows users to submit transfer requests via interactive or shortcut commands.

## Features

- 🤖 **Interactive Mode**: Step-by-step transfer flow
- ⚡ **Shortcut Mode**: One-command transfers (`/send <amount> <phone>`)
- 🔐 **Secure**: Token-based authentication with backend
- 🌐 **Arabic UI**: RTL support with English digits
- 📊 **Safe Logging**: Sanitized logs (no OTP codes, masked phone numbers)
- 🔔 **Notifications**: Real-time transfer results and OTP delivery
- 🚀 **Flexible**: Polling (dev) or Webhook (production)

## Commands

- `/start` - Welcome message and usage instructions
- `/send` - Interactive transfer mode (step-by-step)
- `/send <amount> <phone>` - Shortcut transfer mode
- `/health` - Bot health check

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
WEBHOOK_URL=https://yourdomain.com/bot/webhook
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment guide.

## Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide (VPS, Docker, webhook setup)
- **[IMPLEMENTATION_TASKS.md](./IMPLEMENTATION_TASKS.md)** - Development checklist and implementation details
- **[../docs/telegram-bot-spec.md](../docs/telegram-bot-spec.md)** - Full bot specification

## Technologies

- **grammY** v1.20.0 - Telegram bot framework
- **TypeScript** 5.3.0
- **Express** 4.18.0 - Internal endpoints server
- **@grammyjs/conversations** 2.1.0 - Conversation management

## Security

✅ Token-based authentication (X-Bot-Token)  
✅ Secret validation (X-Bot-Secret)  
✅ Optional IP allowlist  
✅ No sensitive data in logs (OTP codes never logged)  
✅ Phone number masking (09123****)  
✅ HTTPS required for webhooks

## Commands

- `/start` - Welcome message
- `/send` - Interactive transfer mode
- `/send <amount> <phone>` - Quick transfer shortcut

## Documentation

See `docs/telegram-bot-spec.md` for complete specification.

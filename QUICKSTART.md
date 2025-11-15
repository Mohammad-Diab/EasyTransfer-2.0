# EasyTransfer 2.0 - Quick Start Guide

This guide will help you set up and run all components of EasyTransfer 2.0.

## Prerequisites

- **Node.js** v18+ (for Backend, Bot, Web)
- **PostgreSQL** v14+ (or SQLite for development)
- **Android Studio** (for Android app)
- **Telegram Bot Token** (from @BotFather)

## Setup Order

Follow this order for initial setup:

### 1. Backend API (Required First)

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run prisma:generate

# Run migrations (creates database tables)
npm run prisma:migrate

# Start backend server
npm run start:dev
```

Backend will run on: http://localhost:3000

### 2. Telegram Bot

```bash
cd bot

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your BOT_TOKEN and BACKEND_API_URL

# Start bot (development mode - polling)
npm run dev
```

### 3. Web UI

```bash
cd web

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3000

# Start development server
npm run dev
```

Web UI will run on: http://localhost:3001

### 4. Android App

1. Open Android Studio
2. Open the `android/` folder
3. Wait for Gradle sync
4. Configure server URL in the app
5. Run on emulator or physical device

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/easytransfer"
JWT_SECRET="your-secret-key"
BOT_SERVICE_TOKEN="your-bot-token"
PORT=3000
```

### Bot (.env)
```env
BOT_TOKEN="your-telegram-bot-token"
BOT_MODE="polling"
BACKEND_API_URL="http://localhost:3000"
BOT_SERVICE_TOKEN="same-as-backend"
```

### Web (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## Common Commands

### Backend
```bash
npm run start:dev     # Development mode
npm run build         # Build for production
npm run start:prod    # Production mode
npm run prisma:studio # Database GUI
```

### Bot
```bash
npm run dev           # Development (polling)
npm run build         # Build
npm start             # Production
```

### Web
```bash
npm run dev           # Development mode
npm run build         # Build for production
npm start             # Production mode
```

## Testing the System

1. **Create a user in database:**
   - Use Prisma Studio: `cd backend && npm run prisma:studio`
   - Or create via SQL

2. **Link Telegram account:**
   - Set `telegram_user_id` in users table

3. **Test transfer via bot:**
   - Open Telegram
   - Find your bot
   - Send: `/send 1000 0912345678`

4. **View in Web UI:**
   - Open http://localhost:3001
   - Login with phone number
   - See transfers

## Troubleshooting

### Backend not connecting to database
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Run migrations: `npm run prisma:migrate`

### Bot not responding
- Verify BOT_TOKEN is correct
- Check BACKEND_API_URL points to running backend
- Ensure BOT_SERVICE_TOKEN matches backend

### Web UI API errors
- Verify NEXT_PUBLIC_API_URL is correct
- Check backend is running on port 3000
- Check CORS settings in backend

### Android app can't connect
- Ensure backend is accessible from device
- Use 10.0.2.2:3000 for Android emulator (not localhost)
- Check INTERNET permission is granted

## Production Deployment

See individual README files in each component folder:
- `backend/README.md`
- `bot/README.md`
- `web/README.md`
- `android/README.md`

## Documentation

Complete specifications available in `docs/`:
- `backend-spec.md` - Backend API specification
- `telegram-bot-spec.md` - Bot specification
- `web-ui-spec.md` - Web UI specification
- `android-app-spec.md` - Android app specification

## Support

For issues or questions, refer to the specification documents or create an issue in the repository.

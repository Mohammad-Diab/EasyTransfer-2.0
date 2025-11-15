# EasyTransfer 2.0 - Telegram Bot Deployment Guide

## Overview

The EasyTransfer 2.0 Telegram Bot supports two deployment modes:
- **Polling Mode**: For local development and testing
- **Webhook Mode**: For production deployments

## Prerequisites

- Node.js 18+ and npm
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Backend API running and accessible
- (Production only) HTTPS domain with valid SSL certificate

## Environment Configuration

### Required Environment Variables

```bash
# Bot Configuration
BOT_TOKEN=your-telegram-bot-token-from-botfather
BOT_MODE=polling  # or 'webhook' for production
WEBHOOK_URL=https://yourdomain.com/bot/webhook  # Required for webhook mode

# Backend API
BACKEND_API_URL=http://localhost:3000
BOT_SERVICE_TOKEN=your-static-bot-service-token-change-in-production

# Security (for internal endpoints)
INTERNAL_SECRET=your-internal-secret-for-bot-callbacks
INTERNAL_PORT=3100
ALLOWED_IPS=  # Optional: comma-separated IPs, leave empty to allow all

# Environment
NODE_ENV=development  # or 'production'
```

### Generate Secure Tokens

```bash
# Generate BOT_SERVICE_TOKEN
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate INTERNAL_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Local Development (Polling Mode)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
BOT_TOKEN=your-bot-token
BOT_MODE=polling
BACKEND_API_URL=http://localhost:3000
BOT_SERVICE_TOKEN=your-service-token
INTERNAL_SECRET=your-internal-secret
INTERNAL_PORT=3100
NODE_ENV=development
```

### 3. Build and Start

```bash
# Build TypeScript
npm run build

# Start bot
npm start

# Or use development mode with auto-reload
npm run dev
```

### 4. Test the Bot

1. Open Telegram and find your bot
2. Send `/start` to see welcome message
3. Try `/send` for interactive mode
4. Try `/send 100 0912345678` for shortcut mode
5. Test `/health` command

## Production Deployment (Webhook Mode)

### Option 1: Deploy to VPS/Cloud Server

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Clone and Build

```bash
# Clone repository
git clone https://github.com/yourusername/easytransfer-2.0.git
cd easytransfer-2.0/bot

# Install dependencies
npm install

# Build
npm run build
```

#### 3. Configure Environment

Create `.env` file:

```bash
BOT_TOKEN=your-bot-token
BOT_MODE=webhook
WEBHOOK_URL=https://yourdomain.com/bot/webhook
BACKEND_API_URL=https://api.yourdomain.com
BOT_SERVICE_TOKEN=your-production-service-token
INTERNAL_SECRET=your-production-internal-secret
INTERNAL_PORT=3100
ALLOWED_IPS=backend-server-ip
NODE_ENV=production
```

#### 4. Setup Nginx as Reverse Proxy

Install Nginx:

```bash
sudo apt install nginx
```

Create Nginx configuration (`/etc/nginx/sites-available/bot`):

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Bot webhook endpoint
    location /bot/webhook {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Internal endpoints (backend access only)
    location /internal/ {
        proxy_pass http://localhost:3100;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Optional: Restrict to backend IP
        # allow backend-server-ip;
        # deny all;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3100;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

#### 6. Start Bot with PM2

```bash
# Start bot
pm2 start dist/index.js --name easytransfer-bot

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

#### 7. Monitor and Manage

```bash
# View logs
pm2 logs easytransfer-bot

# Restart bot
pm2 restart easytransfer-bot

# Stop bot
pm2 stop easytransfer-bot

# Monitor
pm2 monit
```

### Option 2: Deploy with Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3100

CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  bot:
    build: .
    restart: unless-stopped
    ports:
      - "3100:3100"
    environment:
      - BOT_TOKEN=${BOT_TOKEN}
      - BOT_MODE=webhook
      - WEBHOOK_URL=${WEBHOOK_URL}
      - BACKEND_API_URL=${BACKEND_API_URL}
      - BOT_SERVICE_TOKEN=${BOT_SERVICE_TOKEN}
      - INTERNAL_SECRET=${INTERNAL_SECRET}
      - INTERNAL_PORT=3100
      - NODE_ENV=production
    env_file:
      - .env
```

Deploy:

```bash
docker-compose up -d
```

## Telegram Webhook Setup

The bot automatically sets the webhook URL when starting in webhook mode. Verify it's set correctly:

```bash
curl https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo
```

Expected response:
```json
{
  "ok": true,
  "result": {
    "url": "https://yourdomain.com/bot/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## Testing Webhook Locally with ngrok

For local webhook testing:

1. Install [ngrok](https://ngrok.com/)
2. Start ngrok:
   ```bash
   ngrok http 3100
   ```
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Update `.env`:
   ```bash
   BOT_MODE=webhook
   WEBHOOK_URL=https://abc123.ngrok.io/bot/webhook
   ```
5. Restart bot

## Internal Endpoints

Backend calls these endpoints to notify the bot:

### POST /internal/notify-result
Notify user of transfer result.

**Headers:**
```
Content-Type: application/json
X-Bot-Secret: your-internal-secret
```

**Body:**
```json
{
  "telegram_user_id": 123456789,
  "transfer_id": 42,
  "status": "success",
  "reason": "optional error reason"
}
```

### POST /internal/send-otp
Send OTP code to user.

**Headers:**
```
Content-Type: application/json
X-Bot-Secret: your-internal-secret
```

**Body:**
```json
{
  "telegram_user_id": 123456789,
  "code": "123456"
}
```

### GET /health
Health check endpoint (no auth required).

**Response:**
```json
{
  "status": "ok",
  "service": "bot-internal-server"
}
```

## Security Checklist

- [ ] Use strong, random tokens (32+ bytes)
- [ ] Never commit `.env` file to version control
- [ ] Use HTTPS for webhook in production
- [ ] Configure firewall to restrict access to internal endpoints
- [ ] Enable IP allowlist for internal endpoints (optional)
- [ ] Rotate tokens regularly
- [ ] Monitor logs for security events
- [ ] Keep dependencies updated (`npm audit`)

## Troubleshooting

### Bot not receiving updates (webhook mode)

1. Check webhook info:
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
   ```

2. Verify SSL certificate is valid
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Check bot logs: `pm2 logs easytransfer-bot`

### Internal endpoints returning 403

1. Verify `X-Bot-Secret` header matches `INTERNAL_SECRET`
2. Check IP allowlist if configured
3. Review security logs

### Backend can't reach bot

1. Ensure bot server is accessible from backend
2. Check firewall rules
3. Verify INTERNAL_PORT is correct
4. Test health endpoint: `curl http://bot-server:3100/health`

## Monitoring

### PM2 Monitoring

```bash
pm2 monit
pm2 logs easytransfer-bot --lines 100
```

### Health Check

```bash
curl https://yourdomain.com/health
```

### Log Analysis

Logs are structured JSON for easy parsing:

```bash
# View errors only
pm2 logs easytransfer-bot | grep ERROR

# View security events
pm2 logs easytransfer-bot | grep "Security event"
```

## Updating the Bot

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Rebuild
npm run build

# Restart
pm2 restart easytransfer-bot
```

## Support

For issues or questions, refer to:
- Main documentation: `/docs/telegram-bot-spec.md`
- Implementation tasks: `IMPLEMENTATION_TASKS.md`
- Backend API docs: `/backend/README.md`

# Telegram Bot OTP Integration

## Overview

The backend now sends OTP codes to users via the Telegram bot instead of returning them in API responses. This implements production-ready authentication security.

## Architecture

```
User → Backend API → Bot Internal Server → Telegram User
         (Auth Service)   (POST /internal/send-otp)
```

### Flow Diagram

```
1. User requests OTP (Web UI or Android App)
   ↓
2. Backend generates 6-digit OTP code
   ↓
3. Backend hashes and stores OTP in database
   ↓
4. Backend calls Bot's /internal/send-otp endpoint
   ↓
5. Bot sends OTP to user via Telegram
   ↓
6. User receives OTP in Telegram
   ↓
7. User enters OTP in Web UI or Android App
   ↓
8. Backend verifies OTP and issues JWT token
```

## Implementation

### Backend Changes

#### 1. **BotClientService** (`backend/src/bot/bot-client.service.ts`)

New service that handles all communication with the Telegram bot's internal endpoints.

**Methods:**
- `sendOtp(telegramUserId: string, code: string)` - Send OTP to user
- `notifyTransferResult(telegramUserId, transferId, status, reason)` - Send transfer notifications

**Configuration:**
- `BOT_INTERNAL_URL` - Bot server URL (default: `http://localhost:3100`)
- `BOT_INTERNAL_SECRET` - Shared secret for authentication

**Features:**
- Automatic retry logic (future enhancement)
- Comprehensive error logging
- Secure header-based authentication

#### 2. **AuthService Updates** (`backend/src/auth/auth.service.ts`)

**Before (DEV):**
```typescript
// TODO: Send OTP via Telegram bot
return { message: 'OTP sent to Telegram', code }; // DEV: Remove code in production
```

**After (PRODUCTION):**
```typescript
// Send OTP via Telegram bot
await this.botClient.sendOtp(user.telegram_user_id.toString(), code);
return { message: 'OTP sent to Telegram' };
```

**Changes:**
- Removed OTP code from API responses
- Integrated BotClientService
- OTP now sent via Telegram only
- Both Web and Android OTP delivery use the same method

#### 3. **Module Dependencies**

Updated `AuthModule` to import `BotModule`:

```typescript
@Module({
  imports: [
    PassportModule,
    BotModule, // ← Added for BotClientService
    JwtModule.registerAsync({...}),
  ],
  providers: [AuthService, JwtStrategy, BotTokenStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
```

### Bot Changes

**No changes required!** The bot's internal server already has the `/internal/send-otp` endpoint implemented.

## Configuration

### Backend Environment Variables

Add to `backend/.env`:

```env
# Telegram Bot Configuration
BOT_INTERNAL_URL="http://localhost:3100"
BOT_INTERNAL_SECRET="your-internal-secret-matching-bot-config"
BOT_SERVICE_TOKEN="your-static-bot-service-token"
```

### Bot Environment Variables

Ensure `bot/.env` has:

```env
INTERNAL_SECRET="same-secret-as-backend-BOT_INTERNAL_SECRET"
INTERNAL_PORT=3100
```

**⚠️ CRITICAL:** `BOT_INTERNAL_SECRET` (backend) **MUST** match `INTERNAL_SECRET` (bot)

## Security

### Secrets Generation

Generate strong random secrets:

```bash
# Backend → Bot secret (BOT_INTERNAL_SECRET)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Bot → Backend service token (BOT_SERVICE_TOKEN)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Authentication Flow

1. **Backend → Bot Communication:**
   - Backend sends `X-Bot-Secret` header
   - Bot validates secret matches `INTERNAL_SECRET`
   - Bot optionally validates IP allowlist

2. **Security Features:**
   - OTP code NEVER logged or returned in API responses
   - HTTPS required in production
   - Shared secret validation
   - Optional IP allowlist for internal endpoints

## Testing

### Local Testing (Development)

1. **Start Bot:**
   ```bash
   cd bot
   npm run dev
   ```
   Bot runs on `http://localhost:3100`

2. **Start Backend:**
   ```bash
   cd backend
   npm run start:dev
   ```
   Backend runs on `http://localhost:3000`

3. **Test OTP Request:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/web/request-otp \
     -H "Content-Type: application/json" \
     -d '{"phone":"0912345678"}'
   ```

4. **Verify:**
   - Backend logs: `OTP sent to user <telegram_user_id>`
   - Bot logs: `OTP delivery requested for user <user_id>`
   - Telegram: User receives OTP message

### Production Testing

1. **Verify Environment:**
   ```bash
   # Backend
   echo $BOT_INTERNAL_URL  # Should be https://your-bot-domain.com
   echo $BOT_INTERNAL_SECRET  # Should be 64-char hex

   # Bot
   echo $INTERNAL_SECRET  # Should match backend's BOT_INTERNAL_SECRET
   ```

2. **Test OTP Flow:**
   - Request OTP via Web UI
   - Check user receives OTP in Telegram
   - Verify OTP works for login
   - Confirm no OTP in API responses

3. **Check Logs:**
   - Backend: No OTP codes in logs
   - Bot: No OTP codes in logs
   - Only log "OTP sent" events

## Error Handling

### Bot Unreachable

If bot server is down or unreachable:

```typescript
// Backend throws error
throw new Error('Failed to send OTP via Telegram');

// User sees error:
{
  "statusCode": 500,
  "message": "Failed to send OTP via Telegram"
}
```

**Resolution:**
- Verify bot server is running
- Check `BOT_INTERNAL_URL` configuration
- Check network connectivity
- Review bot logs for errors

### Invalid Secret

If `X-Bot-Secret` doesn't match:

```typescript
// Bot returns 403 Forbidden
{
  "error": "Forbidden"
}
```

**Resolution:**
- Verify `BOT_INTERNAL_SECRET` (backend) matches `INTERNAL_SECRET` (bot)
- Check for typos or extra whitespace
- Regenerate secrets if needed

### IP Allowlist Mismatch

If bot has IP allowlist enabled:

```typescript
// Bot returns 403 Forbidden
{
  "error": "IP not allowed"
}
```

**Resolution:**
- Add backend server IP to bot's `ALLOWED_IPS`
- Or disable IP allowlist in development
- In production, use private network or VPN

## Monitoring

### Key Metrics

- **OTP Delivery Success Rate:** Track bot API call success/failure
- **OTP Delivery Latency:** Time from request to Telegram delivery
- **Failed Deliveries:** Log and alert on failures

### Logs to Monitor

**Backend:**
```
[INFO] OTP sent to user 123456789
[ERROR] Failed to send OTP to user 123456789: Connection refused
```

**Bot:**
```
[INFO] OTP delivery requested for user 12345
[INFO] Notification sent: otp - User: 123456789
[ERROR] Error sending OTP: User not found
```

## Troubleshooting

### OTP Not Received

1. **Check bot server status:**
   ```bash
   curl http://localhost:3100/health
   # Should return: {"status":"ok","service":"bot-internal-server"}
   ```

2. **Check backend logs:**
   - Look for "OTP sent to user" message
   - Look for error messages

3. **Check bot logs:**
   - Look for "OTP delivery requested" message
   - Look for Telegram API errors

4. **Verify user exists:**
   - User must have `telegram_user_id` in database
   - User must have started conversation with bot

### OTP Delivery Slow

- Check network latency between backend and bot
- Check Telegram API response time
- Consider adding request timeout handling

### Security Audit Checklist

- [ ] OTP code never in API responses
- [ ] OTP code never in logs
- [ ] `BOT_INTERNAL_SECRET` is strong (32+ bytes)
- [ ] HTTPS enabled in production
- [ ] IP allowlist configured (optional)
- [ ] Secrets not committed to git
- [ ] Environment variables properly set

## Migration from DEV to PRODUCTION

### Before (Development)

```typescript
// API response included OTP code
return { message: 'OTP sent to Telegram', code: '123456' };
```

### After (Production)

```typescript
// API response NEVER includes OTP code
return { message: 'OTP sent to Telegram' };
```

### Deployment Steps

1. **Update backend `.env`:**
   ```env
   BOT_INTERNAL_URL="https://your-bot-domain.com"
   BOT_INTERNAL_SECRET="<64-char-hex-secret>"
   ```

2. **Update bot `.env`:**
   ```env
   INTERNAL_SECRET="<same-secret-as-backend>"
   ```

3. **Deploy bot first:**
   ```bash
   cd bot
   npm run build
   pm2 start dist/index.js --name easytransfer-bot
   ```

4. **Deploy backend:**
   ```bash
   cd backend
   npm run build
   pm2 start dist/main.js --name easytransfer-backend
   ```

5. **Test OTP flow:**
   - Request OTP via Web UI
   - Verify delivery in Telegram
   - Confirm login works

## Next Steps

- [ ] Implement transfer notification integration (see TRANSFER_NOTIFICATION.md)
- [ ] Add retry logic for failed bot API calls
- [ ] Set up monitoring and alerting
- [ ] Load test OTP delivery under high load
- [ ] Document backup OTP delivery method (SMS/Email)

## Related Documentation

- **Bot Specification:** `docs/telegram-bot-spec.md`
- **Backend Specification:** `docs/backend-spec.md`
- **Deployment Guide:** `bot/DEPLOYMENT.md`
- **Transfer Notifications:** `backend/TRANSFER_NOTIFICATION.md` (to be created)

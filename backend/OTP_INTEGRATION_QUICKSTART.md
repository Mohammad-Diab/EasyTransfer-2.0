# Telegram Bot OTP Integration - Quick Reference

## ✅ What Was Implemented

### Backend Changes

1. **New Service:** `BotClientService` (`src/bot/bot-client.service.ts`)
   - Handles all communication with Telegram bot
   - Methods: `sendOtp()`, `notifyTransferResult()`
   - Secure HTTP client with secret-based authentication

2. **Updated:** `AuthService` (`src/auth/auth.service.ts`)
   - Removed DEV mock responses that returned OTP codes
   - Integrated `BotClientService` for OTP delivery
   - Both Web and Android OTP requests now send via Telegram

3. **Updated:** `AuthModule` (`src/auth/auth.module.ts`)
   - Imports `BotModule` for `BotClientService` access

4. **Updated:** `BotModule` (`src/bot/bot.module.ts`)
   - Exports `BotClientService` for use in other modules

5. **Updated:** `.env.example`
   - Added `BOT_INTERNAL_URL` (default: `http://localhost:3100`)
   - Added `BOT_INTERNAL_SECRET` for authentication
   - Removed unused `TELEGRAM_BOT_TOKEN` variable

### Bot Changes

**None required!** The bot already has the `/internal/send-otp` endpoint implemented.

## 🔧 Configuration Required

### Backend `.env`

```env
# Bot Communication
BOT_INTERNAL_URL="http://localhost:3100"
BOT_INTERNAL_SECRET="<64-char-hex-secret>"
BOT_SERVICE_TOKEN="<64-char-hex-secret>"
```

### Bot `.env`

```env
# Must match backend's BOT_INTERNAL_SECRET
INTERNAL_SECRET="<same-secret-as-backend>"
INTERNAL_PORT=3100
```

### Generate Secrets

```bash
# Generate BOT_INTERNAL_SECRET (same value in both .env files)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 How It Works

### OTP Request Flow

```
1. POST /api/auth/web/request-otp (phone: "0912345678")
   ↓
2. Backend generates OTP: "123456"
   ↓
3. Backend hashes and stores in database
   ↓
4. Backend calls: POST http://localhost:3100/internal/send-otp
   Headers: X-Bot-Secret: <secret>
   Body: { telegram_user_id: "123456789", code: "123456" }
   ↓
5. Bot sends message to Telegram user
   ↓
6. User receives: "🔐 رمز التحقق الخاص بك: 123456"
   ↓
7. User enters OTP in Web UI
   ↓
8. POST /api/auth/web/verify-otp (phone, code)
   ↓
9. Backend verifies and issues JWT token
```

### Security Features

- ✅ OTP code NEVER returned in API responses (production-ready)
- ✅ OTP code NEVER logged (sanitized by logger)
- ✅ Secret-based authentication (X-Bot-Secret header)
- ✅ Optional IP allowlist support
- ✅ Separate secrets for bot→backend and backend→bot

## 🧪 Testing

### 1. Start Both Services

```bash
# Terminal 1: Bot
cd bot
npm run dev

# Terminal 2: Backend
cd backend
npm run start:dev
```

### 2. Test OTP Request

```bash
curl -X POST http://localhost:3000/api/auth/web/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"0912345678"}'
```

**Expected Response:**
```json
{
  "message": "OTP sent to Telegram"
}
```

**NOT This (DEV mode - removed):**
```json
{
  "message": "OTP sent to Telegram",
  "code": "123456"  // ❌ NO LONGER RETURNED
}
```

### 3. Check Logs

**Backend:**
```
[INFO] OTP sent to user 123456789
```

**Bot:**
```
[INFO] OTP delivery requested for user 12345
[INFO] Notification sent: otp - User: 123456789
```

**Telegram:**
```
🔐 رمز التحقق الخاص بك: 123456

يرجى عدم مشاركة هذا الرمز مع أحد.
الرمز صالح لمدة 5 دقائق.
```

### 4. Verify OTP

```bash
curl -X POST http://localhost:3000/api/auth/web/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"0912345678","code":"123456"}'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "phone": "0912345678",
    "name": "John Doe",
    "role": "user"
  }
}
```

## 🐛 Troubleshooting

### OTP Not Received

**Problem:** User doesn't receive OTP in Telegram

**Solutions:**
1. Check bot is running: `curl http://localhost:3100/health`
2. Check backend logs for errors
3. Verify `BOT_INTERNAL_SECRET` matches `INTERNAL_SECRET`
4. Verify user has `telegram_user_id` in database
5. Verify user has started conversation with bot

### 403 Forbidden Error

**Problem:** Backend gets 403 from bot

**Solutions:**
1. Verify secrets match:
   ```bash
   # Backend .env
   BOT_INTERNAL_SECRET="abc123..."
   
   # Bot .env
   INTERNAL_SECRET="abc123..."  # MUST BE SAME
   ```

2. Check IP allowlist (if enabled):
   ```env
   # Bot .env
   ALLOWED_IPS=""  # Empty = disabled (dev)
   ALLOWED_IPS="127.0.0.1,10.0.0.5"  # Enabled (prod)
   ```

### Connection Refused

**Problem:** Backend can't connect to bot

**Solutions:**
1. Verify bot is running
2. Check `BOT_INTERNAL_URL` is correct
3. Check bot is listening on correct port:
   ```env
   INTERNAL_PORT=3100
   ```

## 📋 Production Checklist

- [ ] Generate strong secrets (32+ bytes)
- [ ] Set `BOT_INTERNAL_SECRET` = `INTERNAL_SECRET`
- [ ] Update `BOT_INTERNAL_URL` to production URL (HTTPS)
- [ ] Enable HTTPS on bot server
- [ ] Configure IP allowlist (optional)
- [ ] Verify OTP not in API responses
- [ ] Verify OTP not in logs
- [ ] Test complete OTP flow
- [ ] Set up monitoring for failed OTP deliveries
- [ ] Document secrets in secure password manager

## 📚 Documentation

- **Full Guide:** `backend/OTP_INTEGRATION.md`
- **Bot Spec:** `docs/telegram-bot-spec.md`
- **Backend Spec:** `docs/backend-spec.md`
- **Deployment:** `bot/DEPLOYMENT.md`

## ✨ Benefits

- ✅ **Security:** OTP codes never exposed in API responses
- ✅ **User Experience:** Users receive OTP directly in Telegram
- ✅ **Production-Ready:** Follows security best practices
- ✅ **Scalable:** Bot and backend can scale independently
- ✅ **Maintainable:** Clear separation of concerns

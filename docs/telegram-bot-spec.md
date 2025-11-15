# Telegram Bot Specification (Node.js) – Final Simplified Version

## 1. Technology Stack

### 1.1 Core Technologies
- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Framework**: grammY
  - Modern, type-safe Telegram Bot API framework
  - Built specifically for TypeScript
  - Excellent performance and developer experience
  - Official documentation: https://grammy.dev/

### 1.2 Deployment Modes

**Development:**
- Long Polling mode
- No external webhook configuration required
- Suitable for local testing
- Enable with: `bot.start()`

**Production:**
- Webhook mode (HTTPS required)
- Backend exposes webhook endpoint
- Telegram sends updates to: `https://api.easytransfer.com/bot/webhook`
- Enable with: `bot.handleUpdate(req.body)`

### 1.3 Backend Communication

**API Client Structure:**
```typescript
// backendClient.ts - Centralized API communication
class BackendClient {
  private readonly baseURL: string;
  private readonly serviceToken: string;

  constructor() {
    this.baseURL = process.env.BACKEND_API_URL!;
    this.serviceToken = process.env.BOT_SERVICE_TOKEN!;
  }

  private async request(endpoint: string, data?: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.serviceToken}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async authorize(telegramUserId: number) {
    return this.request('/api/bot/authorize', { telegram_user_id: telegramUserId });
  }

  async submitTransfer(telegramUserId: number, phone: string, amount: number) {
    return this.request('/api/bot/transfers', {
      telegram_user_id: telegramUserId,
      recipient_phone: phone,
      amount,
    });
  }
}

export const backendClient = new BackendClient();
```

### 1.4 Authentication Pattern

**Service Token (Static):**
- Bot uses a static service token for all Backend API calls
- Token configured in environment: `BOT_SERVICE_TOKEN`
- Sent in `Authorization: Bearer <token>` header
- Backend validates token before processing requests
- No user-specific JWT - user identity passed via `telegram_user_id` parameter

### 1.5 Project Structure
```
bot/
├── src/
│   ├── index.ts              # Entry point, bot initialization
│   ├── bot.ts                # grammY bot instance setup
│   ├── commands/
│   │   ├── send.ts           # /send command handler
│   │   └── start.ts          # /start command handler
│   ├── middlewares/
│   │   └── auth.ts           # Authorization middleware
│   ├── services/
│   │   └── backendClient.ts  # Backend API client
│   └── config/
│       └── env.ts            # Environment configuration
├── .env.example
├── package.json
└── tsconfig.json
```

### 1.6 Environment Configuration
```env
# Bot Configuration
BOT_TOKEN=<telegram_bot_token>
BOT_MODE=polling|webhook
WEBHOOK_URL=https://api.easytransfer.com/bot/webhook  # production only

# Backend Integration
BACKEND_API_URL=https://api.easytransfer.com
BOT_SERVICE_TOKEN=<static_service_token>

# Security (Optional)
INTERNAL_SECRET=<random_secret_key>  # For backend→bot callbacks
ALLOWED_IPS=10.0.0.5,10.0.0.6       # IP allowlist for internal endpoints

# Environment
NODE_ENV=production|development
```

### 1.7 Key Dependencies
```json
{
  "dependencies": {
    "grammy": "^1.20.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0"
  }
}
```

## 2. Bot Architecture & Responsibilities

### Core Principle: Frontend Interface Only

The bot serves exclusively as a **presentation layer**. All business logic resides in the Backend.

**Bot Responsibilities:**
- Receive user commands
- Forward requests to Backend API
- Display Backend responses to users

**Backend Responsibilities:**
- Business logic validation
- Permission checks
- Request processing
- OTP generation and validation
- Status management
- Tier matching and limits

## 3. User Identity & Authorization

### Identification
- Users are identified by **Telegram User ID**
- Every user action includes their Telegram ID in Backend requests

### Authorization Flow
1. Bot sends user's Telegram ID to Backend with each request
2. Backend responds with `allowed: true/false`
3. If `allowed: false`:
   ```
   عذراً، لا تملك صلاحية استخدام هذا البوت.
   ```
   No further actions are executed.

## 4. Transfer Command `/send`

### A) Interactive Mode

**Flow:**
1. User sends: `/send`
2. Bot prompts: "الرجاء إدخال رقم الهاتف"
3. User provides phone number
4. Bot prompts: "الرجاء إدخال المبلغ"
5. User provides amount
6. Bot sends both to Backend API
7. Bot responds:
   ```
   تم استلام طلبك، وسيتم تنفيذ التحويل قريباً.
   ```

### B) Shortcut Mode

**Format:**
```
/send <amount> <phone>
```

**Example:**
```
/send 50 0912345678
```

**Bot Processing:**
1. Parse command arguments
2. Perform basic format validation
3. Send request to Backend
4. Respond with:
   ```
   تم استلام طلبك، وسيتم تنفيذ التحويل قريباً.
   ```

**Note:** All business logic (tiers, matching, limits, validation) handled by Backend only.

## 5. Transfer Result Notifications

### Backend → Bot Communication

**Backend calls protected bot endpoint with:**
```json
{
  "telegram_user_id": "123456789",
  "request_id": "req_abc123",
  "status": "success|failed",
  "phone": "091234****",
  "amount": 50,
  "message": "optional failure reason"
}
```

### Bot Response to User

**Success:**
```
✅ تم تنفيذ عملية التحويل (ID: req_abc123) بنجاح.
```

**Failure:**
```
❌ فشلت عملية التحويل (ID: req_abc123). السبب: <message>
```

**Important:** Bot does NOT determine success/failure - it only displays Backend results.

## 6. OTP / Verification Codes

### Responsibility Separation
- **Backend/Auth Service**: Generate and validate OTPs
- **Bot**: Deliver OTPs to users only

### Delivery Flow

**Backend sends to bot:**
```json
{
  "telegram_user_id": "123456789",
  "code": "123456"
}
```

**Bot sends to user:**
```
رمز التحقق الخاص بك هو: 123456
```

**Security Notes:**
- Bot does NOT store OTP codes
- Bot does NOT validate OTP codes
- OTP codes are never logged

## 7. Input Validation (Minimal Client-Side)

### Bot-Level Validation (Basic Only)

**Phone Number:**
- Must contain digits only
- No complex validation (Backend handles this)

**Amount:**
- Must be a positive number
- No limit checks (Backend handles this)

**Shortcut Format:**
```
Invalid: /send abc xyz
Response: يرجى استخدام الصيغة: /send <amount> <phone>
```

### Backend-Level Validation (Complete)
All comprehensive validation occurs in the Backend:
- Phone number format and existence
- Amount limits per tier
- User permissions
- Rate limiting
- Business rules

## 8. Error Handling

### Backend Unreachable
```
حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً.
```

### Confirmation Policy
Bot NEVER confirms a request unless Backend actually receives and acknowledges it.

### Error Scenarios
- Network timeout → Show error message
- Backend 5xx → Show error message
- Backend 4xx → Display Backend error message
- Invalid response → Log and show generic error

## 9. Internal Security

### Protected Endpoints

Bot exposes internal endpoints for:
- Transfer result notifications
- OTP delivery

**Security Requirements:**
1. **Secret Token Header**: All internal requests must include authentication header
   ```
   X-Bot-Secret: <configured_secret_token>
   ```
2. **IP Allowlist**: (Optional) Restrict to Backend IP addresses only

**Rejection Policy:**
- Missing authentication → Reject with 401
- Invalid token → Reject with 403
- Log all rejected attempts

### Environment Variables
```env
BOT_TOKEN=<telegram_bot_token>
BACKEND_API_URL=https://api.easytransfer.com
INTERNAL_SECRET=<random_secret_key>
ALLOWED_IPS=10.0.0.5,10.0.0.6  # Optional
```

## 10. Logging (Minimal, Safe)

### What to Log

**✅ Safe to Log:**
- `/send` command received (without parameters)
- Backend API call initiated
- Backend response status codes
- Success/failure notification sent
- OTP delivery event (WITHOUT the code itself)
- Authorization check results
- Error messages and stack traces

**❌ Never Log:**
- OTP codes
- Full phone numbers (mask if needed)
- User passwords or tokens
- Sensitive user data

### Log Format Example
```
[2025-11-14 10:30:45] INFO: /send command received from user 123456789
[2025-11-14 10:30:46] INFO: Backend API called - POST /transfers
[2025-11-14 10:30:47] INFO: Backend response: 200 OK
[2025-11-14 10:30:47] INFO: Confirmation sent to user 123456789
[2025-11-14 10:35:12] INFO: OTP delivery requested for user 123456789
[2025-11-14 10:35:12] INFO: OTP sent successfully
```

## 11. Implementation Checklist

### Phase 1: Core Setup
- [ ] Initialize Node.js project with Telegraf
- [ ] Configure environment variables
- [ ] Set up webhook/polling based on environment
- [ ] Implement basic command handler for `/send`

### Phase 2: Backend Integration
- [ ] Create Backend API client
- [ ] Implement authorization check
- [ ] Implement transfer request submission
- [ ] Add error handling for API calls

### Phase 3: Notification System
- [ ] Create protected endpoint for transfer results
- [ ] Implement secret token validation
- [ ] Add IP allowlist (optional)
- [ ] Format and send success/failure messages

### Phase 4: OTP Integration
- [ ] Create protected endpoint for OTP delivery
- [ ] Implement secure code delivery
- [ ] Ensure no code storage or logging

### Phase 5: Testing & Security
- [ ] Test interactive mode
- [ ] Test shortcut mode
- [ ] Verify all security measures
- [ ] Test error scenarios
- [ ] Review logs for sensitive data leaks

## 12. API Endpoints Reference

### Backend API (Bot calls these)

**Authorization Check:**
```
POST /api/bot/authorize
{
  "telegram_user_id": "123456789"
}
Response: { "allowed": true/false }
```

**Submit Transfer Request:**
```
POST /api/bot/transfers
{
  "telegram_user_id": "123456789",
  "phone": "0912345678",
  "amount": 50
}
Response: { "request_id": "req_abc123", "status": "pending" }
```

### Bot Internal Endpoints (Backend calls these)

**Transfer Result Notification:**
```
POST /internal/notify-result
Headers: X-Bot-Secret: <secret>
{
  "telegram_user_id": "123456789",
  "request_id": "req_abc123",
  "status": "success|failed",
  "phone": "091234****",
  "amount": 50,
  "message": "optional"
}
```

**OTP Delivery:**
```
POST /internal/send-otp
Headers: X-Bot-Secret: <secret>
{
  "telegram_user_id": "123456789",
  "code": "123456"
}
```

## 13. Deployment Notes

### Production (Webhook)
- Configure webhook URL with Telegram
- Use HTTPS with valid SSL certificate
- Set webhook secret token for additional security
- Monitor webhook endpoint health

### Development (Polling)
- Use polling mode for local testing only
- Never use polling in production (inefficient)
- Test all scenarios before webhook deployment

### Environment Separation
```env
# Production
NODE_ENV=production
BOT_MODE=webhook
WEBHOOK_URL=https://bot.easytransfer.com

# Development
NODE_ENV=development
BOT_MODE=polling
```

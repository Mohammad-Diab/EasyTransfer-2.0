# EasyTransfer 2.0 - AI Coding Agent Instructions

## Project Overview

EasyTransfer 2.0 is a money transfer system with three components:
1. **Telegram Bot** - For end-users to make transfer requests
2. **Web UI** - For users and admins to view transfers and manage the system
3. **Android App** - For executing USSD transfer requests on mobile devices

The Telegram Bot and Web UI are **presentation layers**, while the Android App is an **execution agent**. All business logic happens in the backend API.

## Core Architecture Principles

### Separation of Concerns
- **Telegram Bot**: User interface for transfers (receives commands, displays responses)
- **Web UI**: Dashboard interface for viewing transfers and admin management
- **Android App**: USSD execution agent (receives instructions, executes USSD, reports results)
- **Backend API**: All business logic, validation, permissions, OTP generation, tier matching, statistics
- **Frontends/App NEVER**: Make business decisions, calculate statistics, validate amounts, or check limits

### Communication Flow
```
Telegram User → Bot → Backend API → Database
Web User → Web UI → Backend API → Database
Android App ← Backend API (instructions) → Android App (USSD execution) → Backend API (results)
```

## Technology Stack

### Telegram Bot
- **Runtime**: Node.js
- **Framework**: Telegraf
- **Deployment**: Webhooks (production), Polling (local dev only)

### Web UI
- **Framework**: React, Vue.js, or Angular (to be decided)
- **Language**: Arabic (RTL) with English digits
- **UI Library**: Material-UI or Ant Design (with RTL support)

### Android App
- **Language**: Kotlin
- **Architecture**: USSD executor agent
- **Features**: Dual SIM support, secure storage, background execution
- **Communication**: WebSocket/FCM for real-time instructions

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js or Fastify
- **Database**: PostgreSQL
- **ORM**: Prisma, TypeORM, or Sequelize
- **Authentication**: JWT tokens

### Shared
- **Language**: Arabic for user-facing messages
- **Security**: Token-based authentication, encrypted storage for sensitive data

## Key Files & Structure

```
docs/
  telegram-bot-spec.md          # Complete bot specification
  web-ui-spec.md                 # Complete Web UI specification
  android-app-spec.md            # Complete Android app specification
  backend-spec.md                # Complete backend API specification
.github/
  copilot-instructions.md        # This file
bot/                             # Telegram bot implementation
web/                             # Web UI implementation
android/                         # Android app implementation
backend/                         # Backend API implementation
```

## Critical Implementation Rules

### 1. Authorization Pattern
**Every user action must check authorization first:**
```javascript
// Always send telegram_user_id to backend
const response = await backendAPI.authorize(ctx.from.id);
if (!response.allowed) {
  return ctx.reply('عذراً، لا تملك صلاحية استخدام هذا البوت.');
}
// Proceed with action
```

### 2. Welcome Message `/start`

**Display user account info from Telegram and bot usage instructions:**
- Extract user info from Telegram context: `ctx.from`
- Display formatted message with name, username, telegram_id
- Include instructions for `/send` (interactive & shortcut modes)
- Include instructions for `/balance` command
- No Backend API call needed

**Example Implementation:**
```javascript
bot.command('start', async (ctx) => {
  const user = ctx.from;
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
  const username = user.username ? `@${user.username}` : '-';
  
  await ctx.reply(`
مرحباً بك في EasyTransfer 2.0! 👋

معلومات حسابك:
الاسم: ${name}
اسم المستخدم: ${username}
معرف تيليجرام: ${user.id}

لإرسال تحويل، استخدم أحد الطريقتين:
📱 الطريقة التفاعلية: /send
⚡ الطريقة السريعة: /send <المبلغ> <رقم الهاتف>

للاستعلام عن الرصيد: /balance
  `);
});
```

### 3. Balance Inquiry `/balance`

**Allow users to check operator balance via USSD:**

**Step 1: Operator Selection**
- Display inline keyboard with Syriatel and MTN buttons
- User must select operator (no text input)

**Step 2: Submit Job**
- Send to Backend: `POST /api/bot/balance { telegram_user_id, operator }`
- Display waiting message: "⏳ يتم الآن الاستعلام عن الرصيد… يرجى الانتظار."

**Step 3: Receive Result** (via `/internal/notify-balance`)
- Success: Display full USSD response text
- Failure: Display error message
- Timeout (60s): Display timeout message

**Key Points:**
- No database storage (in-memory jobs only)
- No cooldown rules
- No parsing (send raw USSD text)
- 60-second timeout handled by Backend

### 4. Transfer Commands

**Interactive Mode:**
- `/send` → Ask for phone → Ask for amount → Submit to backend
- Always confirm receipt: "تم استلام طلبك، وسيتم تنفيذ التحويل قريباً."

**Shortcut Mode:**
- `/send <amount> <phone>` → Parse → Validate format only → Submit to backend
- Invalid format: "يرجى استخدام الصيغة: /send <amount> <phone>"

### 5. Validation Boundaries

**Bot validates (minimal):**
- Phone contains digits only
- Amount is a positive number
- Command format is correct

**Backend validates (complete):**
- Phone number exists and is valid
- Amount within tier limits
- User has sufficient balance
- Rate limiting
- All business rules

### 6. Notification System

Bot exposes protected endpoints for backend callbacks:

**Transfer Results:**
```javascript
// POST /internal/notify-result
// Requires: X-Bot-Secret header
// Displays: ✅ success or ❌ failure message
```

**Balance Results:**
```javascript
// POST /internal/notify-balance
// Requires: X-Bot-Secret header
// Displays: 💰 full USSD response text or ❌ error
```

**OTP Delivery:**
```javascript
// POST /internal/send-otp
// Requires: X-Bot-Secret header
// Sends code to user (NEVER stores it)
```

### 7. Security Requirements

**Internal Endpoints Protection:**
```javascript
// Always verify secret token
if (req.headers['x-bot-secret'] !== process.env.INTERNAL_SECRET) {
  return res.status(403).json({ error: 'Forbidden' });
}

// Optional: IP allowlist
const allowedIPs = process.env.ALLOWED_IPS?.split(',') || [];
if (allowedIPs.length && !allowedIPs.includes(req.ip)) {
  return res.status(403).json({ error: 'IP not allowed' });
}
```

## Backend Implementation Rules

### 1. Business Rules Enforcement

**5-Minute Rule (Same Recipient):**
```javascript
// Check before creating transfer
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
const recentTransfer = await db.transfer_requests.findOne({
  user_id: userId,
  recipient_phone: recipientPhone,
  created_at: { $gte: fiveMinutesAgo }
});
if (recentTransfer) {
  throw new Error('Cannot send to same recipient within 5 minutes');
}
```

**20-Second Rule (Global Cooldown):**
```javascript
// Determine status and execute_after
const lastTransfer = await getLastTransfer(userId);
if (lastTransfer && (Date.now() - lastTransfer.created_at < 20000)) {
  return {
    status: 'delayed',
    execute_after: new Date(lastTransfer.created_at.getTime() + 20000)
  };
}
return { status: 'pending', execute_after: new Date() };
```

### 2. Device Management Pattern

**One Device Per User:**
```javascript
// On Android login - revoke old device, activate new
await db.devices.update(
  { user_id: userId, status: 'active' },
  { status: 'revoked' }
);
await db.devices.create({
  user_id: userId,
  device_id: newDeviceId,
  status: 'active'
});
```

### 3. Operator Detection

**Prefix Matching:**
```javascript
// Detect operator from phone prefix
async function detectOperator(phone) {
  const prefix = phone.substring(0, 3);
  const operator = await db.operator_prefixes.findOne({
    prefix,
    is_active: true
  });
  if (!operator) throw new Error('Invalid phone number');
  return operator.operator_code;
}
```

### 4. Status Lifecycle Management

**Upgrade Delayed → Pending:**
```javascript
// Before Android polling
await db.transfer_requests.update({
  status: 'delayed',
  execute_after: { $lte: new Date() }
}, {
  status: 'pending'
});
```

## Error Handling Patterns

### Backend Unreachable
```javascript
try {
  const response = await backendAPI.submitTransfer(data);
} catch (error) {
  return ctx.reply('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً.');
}
```

### Never Confirm Without Backend Acknowledgment
```javascript
// ❌ WRONG
ctx.reply('تم استلام طلبك');
await backendAPI.submitTransfer(data); // What if this fails?

// ✅ CORRECT
const response = await backendAPI.submitTransfer(data);
if (response.ok) {
  ctx.reply('تم استلام طلبك، وسيتم تنفيذ التحويل قريباً.');
}
```

## Logging Best Practices

### Safe to Log
- Command received (without parameters)
- Backend API call status codes
- Notification delivery events
- Authorization results
- Error stack traces

### NEVER Log
- OTP codes (log "OTP sent" not the code value)
- Full phone numbers (mask: `091234****`)
- User passwords or tokens
- Any PII in plain text

**Example:**
```javascript
// ✅ GOOD
logger.info(`/send command received from user ${userId}`);
logger.info(`OTP delivery requested for user ${userId}`);

// ❌ BAD
logger.info(`User ${userId} sent OTP: ${code}`);
logger.info(`Transfer: ${phone} amount: ${amount}`);
```

## Environment Configuration

Required environment variables:
```env
BOT_TOKEN=<telegram_bot_token>
BACKEND_API_URL=https://api.easytransfer.com
INTERNAL_SECRET=<random_secret_key>
NODE_ENV=production|development
BOT_MODE=webhook|polling
WEBHOOK_URL=https://bot.easytransfer.com  # production only
ALLOWED_IPS=10.0.0.5,10.0.0.6  # optional
```

## Development Workflow

### Local Testing
1. Use polling mode: `BOT_MODE=polling`
2. Test interactive and shortcut `/send` modes
3. Mock backend API responses for isolation testing
4. Verify authorization checks on every command

### Production Deployment
1. Use webhook mode: `BOT_MODE=webhook`
2. Configure HTTPS with valid SSL
3. Set webhook with Telegram API
4. Verify IP allowlist (if used)
5. Test internal endpoints with correct secret header

## Common Patterns

### Backend API Client Structure
```javascript
class BackendAPI {
  async authorize(telegramUserId) {
    // POST /api/bot/authorize
  }
  
  async submitTransfer(telegramUserId, phone, amount) {
    // POST /api/bot/transfers
  }
}
```

### Message Templates
Store Arabic messages in constants:
```javascript
const MESSAGES = {
  UNAUTHORIZED: 'عذراً، لا تملك صلاحية استخدام هذا البوت.',
  REQUEST_RECEIVED: 'تم استلام طلبك، وسيتم تنفيذ التحويل قريباً.',
  INVALID_FORMAT: 'يرجى استخدام الصيغة: /send <amount> <phone>',
  BACKEND_ERROR: 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً.',
  TRANSFER_SUCCESS: (id) => `✅ تم تنفيذ عملية التحويل (ID: ${id}) بنجاح.`,
  TRANSFER_FAILED: (id, reason) => `❌ فشلت عملية التحويل (ID: ${id}). السبب: ${reason}`
};
```

## Web UI Patterns

### Permission-Based Navigation
```javascript
// Navbar adapts based on backend permissions
const navItems = [];
if (user.permissions.includes('user') || user.permissions.includes('admin')) {
  navItems.push({ title: 'تحويلاتي', path: '/transfers' });
}
if (user.permissions.includes('admin')) {
  navItems.push({ title: 'لوحة النظام / المستخدمين', path: '/admin/dashboard' });
}
```

### Status Display Mapping
```javascript
// Unified status codes from backend
const STATUS_CONFIG = {
  pending: { label: 'قيد الانتظار', color: 'warning', icon: 'clock' },
  processing: { label: 'قيد الإنجاز', color: 'info', icon: 'spinner' },
  success: { label: 'ناجحة', color: 'success', icon: 'check-circle' },
  failed: { label: 'فاشلة', color: 'error', icon: 'x-circle' }
};
```

### Data Fetching (Never Calculate)
```javascript
// ✅ CORRECT - Fetch from backend
const stats = await api.get('/api/user/transfers/stats');
setStatistics(stats.data);

// ❌ WRONG - Client-side calculation
const pending = transfers.filter(t => t.status === 'pending').length;
```

### RTL Layout
```css
/* Root direction for Arabic */
html { direction: rtl; }

/* Keep numbers LTR */
.number {
  direction: ltr;
  display: inline-block;
}
```

## Android App Patterns

### Secure Storage (USSD Password)
```kotlin
// ALWAYS use EncryptedSharedPreferences for sensitive data
val encryptedPrefs = EncryptedSharedPreferences.create(
    context,
    "secure_prefs",
    MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build(),
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)
val password = encryptedPrefs.getString("ussd_password", "")
```

### SIM Slot Selection
```kotlin
// Map operator to SIM slot based on local configuration
fun getSIMSlotForOperator(operator: String): Int {
    return when (operator.uppercase()) {
        preferences.getString("sim1_operator") -> 0
        preferences.getString("sim2_operator") -> 1
        else -> -1  // Report error to backend
    }
}
```

### USSD Execution Pattern
```kotlin
// NEVER log the full USSD code (contains password)
val password = getStoredPassword()  // Encrypted
val ussdCode = "*150*1*${password}*1*${phone}*${phone}*${amount}#"

// ✅ GOOD
Log.i(TAG, "Executing USSD for request ${requestId}")

// ❌ BAD
Log.d(TAG, "USSD code: ${ussdCode}")  // Exposes password!
```

### Result Reporting
```kotlin
// Always report results immediately after execution
try {
    val response = executeUSSD(ussdCode, simSlot)
    val status = if (isSuccessResponse(response)) "success" else "failed"
    
    backendAPI.reportResult(requestId, status, response)
} catch (e: Exception) {
    // Queue for retry if backend unreachable
    retryQueue.add(Result(requestId, "failed", e.message))
}
```

## Testing Checklist

### Telegram Bot
Before deploying:
- [ ] Authorization check on all commands
- [ ] `/start` command displays user info from Telegram context (name, username, id)
- [ ] `/start` shows usage instructions for `/send` and `/balance`
- [ ] `/start` handles optional fields (last_name, username) correctly
- [ ] Interactive mode `/send` flow
- [ ] Shortcut mode `/send <amount> <phone>`
- [ ] `/balance` operator selection (Syriatel/MTN buttons)
- [ ] `/balance` waiting message display
- [ ] `/balance` success result with full USSD text
- [ ] `/balance` timeout message (60 seconds)
- [ ] Invalid format handling
- [ ] Backend unreachable scenario
- [ ] Internal endpoint security (token + optional IP)
- [ ] OTP delivery (verify no storage)
- [ ] Success/failure notifications
- [ ] Balance result notifications
- [ ] Log review for sensitive data
- [ ] Webhook vs polling mode switching

### Web UI
Before deploying:
- [ ] Login with phone number
- [ ] Permission-based navigation (user, admin, both)
- [ ] User: My Transfers page (stats + table)
- [ ] Admin: My Transfers page (personal transfers)
- [ ] Admin: System Dashboard (system-wide stats)
- [ ] Admin: Users table with pagination
- [ ] Search functionality (transfers & users)
- [ ] Activate/Deactivate user toggle
- [ ] RTL layout verification
- [ ] Arabic text with English digits
- [ ] All data from backend (no client calculations)

### Android App
Before deploying:
- [ ] Server URL configuration
- [ ] Phone + OTP authentication flow
- [ ] SIM to operator mapping configuration
- [ ] USSD password storage (encrypted)
- [ ] Request receiving (WebSocket/FCM/Polling)
- [ ] Job type detection (transfer vs balance)
- [ ] Balance USSD execution (Syriatel/MTN codes)
- [ ] Balance result reporting (raw USSD text)
- [ ] USSD execution on correct SIM
- [ ] Carrier response parsing
- [ ] Result reporting to backend
- [ ] Retry logic for failed API calls
- [ ] Background execution with Foreground Service
- [ ] No sensitive data in logs (password, token, full USSD)
- [ ] Secure storage audit (Keystore/EncryptedSharedPreferences)

## Reference Documentation

See `docs/telegram-bot-spec.md` for complete bot specification including:
- Detailed API endpoints
- Message formats
- Security requirements
- Implementation checklist

See `docs/web-ui-spec.md` for complete Web UI specification including:
- Page layouts and components
- Permission-based navigation
- Statistics and data display
- Admin user management
- Unified status codes

See `docs/android-app-spec.md` for complete Android app specification including:
- USSD execution architecture
- Dual SIM support implementation
- Security and encrypted storage
- Background execution requirements
- API integration for transfer instructions

See `docs/backend-spec.md` for complete backend API specification including:
- Database schema (7 core tables)
- Business rules implementation (5-min, 20-sec rules)
- Authentication flows (Web, Android, Bot)
- API endpoints for all components
- Status lifecycle management

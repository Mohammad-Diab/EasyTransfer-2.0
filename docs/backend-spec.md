# Backend API – Complete Specification

## 1. Technology Stack

### Runtime & Framework
- **Language**: TypeScript
- **Runtime**: Node.js (v18+ recommended)
- **Framework**: NestJS (Modular Monolith architecture)
- **Architecture Pattern**: Modular Monolith with clear separation of concerns

### Data Layer
- **ORM**: Prisma
- **Design Pattern**: Repository Pattern on top of Prisma
  - Allows easy database switching without changing business logic
  - Better testability with mock repositories
  - Clean separation between data access and business logic
  
- **Database Options**:
  - **Development**: SQLite (lightweight, file-based)
  - **Production**: PostgreSQL (recommended) or any managed SQL service (e.g., Google Cloud SQL, AWS RDS)

### Authentication & Security
- **Token System**: JWT-based authentication with different expiration policies
  - **Web UI**: 1-day expiration (short-lived for security)
  - **Android App**: 1-month expiration (long-lived for convenience)
  - **Bot**: Static Service Token (no JWT, simple string validation)
  
- **Authorization Roles**:
  - `ADMIN` - Full system access
  - `USER` - Regular user access
  - `DEVICE` - Android device access (associated with user)

- **Rate Limiting**: 
  - Implemented via database queries only
  - No external services (Redis, etc.) required
  - Query-based cooldown checks (5-minute, 20-second rules)

### API Design
- **Architecture**: RESTful API
- **Endpoint Separation**:
  - `/api/web/*` - Web UI endpoints
  - `/api/bot/*` - Telegram bot endpoints  
  - `/api/android/*` - Android agent endpoints

### Project Structure (NestJS Modules)
```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── strategies/
│   │   │   ├── jwt-web.strategy.ts
│   │   │   ├── jwt-android.strategy.ts
│   │   │   └── bot-token.strategy.ts
│   │   └── guards/
│   │       ├── jwt-web.guard.ts
│   │       ├── jwt-android.guard.ts
│   │       └── roles.guard.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   └── users.controller.ts
│   ├── devices/
│   │   ├── devices.module.ts
│   │   ├── devices.service.ts
│   │   └── devices.repository.ts
│   ├── transfers/
│   │   ├── transfers.module.ts
│   │   ├── transfers.service.ts
│   │   ├── transfers.repository.ts
│   │   └── transfers.controller.ts
│   ├── operators/
│   │   ├── operators.module.ts
│   │   ├── operators.service.ts
│   │   └── operators.repository.ts
│   ├── otp/
│   │   ├── otp.module.ts
│   │   ├── otp.service.ts
│   │   └── otp.repository.ts
│   ├── bot/
│   │   ├── bot.module.ts
│   │   ├── bot.service.ts
│   │   └── bot.controller.ts
│   ├── android/
│   │   ├── android.module.ts
│   │   ├── android.service.ts
│   │   └── android.controller.ts
│   ├── web/
│   │   ├── web.module.ts
│   │   ├── web.service.ts
│   │   └── web.controller.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   └── schema.prisma
│   └── common/
│       ├── decorators/
│       ├── filters/
│       ├── interceptors/
│       └── pipes/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```

### Environment Configuration
```env
# Application
NODE_ENV=development|production
PORT=3000

# Database
# For SQLite (Development)
DATABASE_URL="file:./dev.db"
# For PostgreSQL (Production)
# DATABASE_URL="postgresql://user:password@localhost:5432/easytransfer"

# JWT Secrets
JWT_SECRET_WEB=<random_secret_for_web>
JWT_SECRET_ANDROID=<random_secret_for_android>

# JWT Expiration
JWT_WEB_EXPIRATION=1d
JWT_ANDROID_EXPIRATION=30d

# Bot Authentication
BOT_SERVICE_TOKEN=<static_secret_for_bot>

# Rate Limiting Rules
FIVE_MINUTE_RULE_SECONDS=300
TWENTY_SECOND_RULE_SECONDS=20

# Bot Integration
BOT_WEBHOOK_URL=https://bot.easytransfer.com
BOT_INTERNAL_SECRET=<internal_secret_for_bot_callbacks>
```

### Dependencies (package.json)
```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@prisma/client": "^5.0.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.0",
    "bcrypt": "^5.1.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "prisma": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

## 2. High-Level Responsibilities

The backend is the **core brain** of the EasyTransfer 2.0 system, responsible for:

### Core Functions
- **User Management**: Normal users and administrators
- **Authentication**: Phone + OTP for Web UI and Android app
- **Device Management**: One Android device per user (latest login wins)
- **Transfer Request Processing**: Receive requests from Telegram bot
- **Business Rules Enforcement**:
  - 5-minute rule (same recipient blocking)
  - 20-second global cooldown per user
- **Operator Detection**: Select operator (Syriatel/MTN) based on phone prefixes
- **Data Serving**: Transfer data and statistics to Web UI (user + admin)
- **Android Communication**:
  - Send transfer jobs via short polling (every 3-5 seconds)
  - Receive USSD execution results
- **Bot Notifications**: Send final transfer status to Telegram bot
- **OTP Management**: Generate, validate, and manage OTP codes
- **System Logging**: Track events and errors

## 3. Database Structure

### 3.1 `users` Table

Stores all system users (regular users and administrators).

```sql
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    phone       VARCHAR(20) NOT NULL UNIQUE,
    telegram_id BIGINT UNIQUE,
    account_id  VARCHAR(50),          -- External/account reference
    name        VARCHAR(100),

    is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
    status      VARCHAR(20) NOT NULL DEFAULT 'active',
    -- Status values: 'active', 'inactive', 'blocked'

    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_status ON users(status);
```

**Key Points:**
- **User Creation**: Only admins can create users via Web UI
- **Admin Creation**: Admins can only be created/edited via direct database access
- **Primary Identifier**: `phone` is the main identity key for Web login, Android login, and bot mapping
- **Telegram Linking**: `telegram_id` is populated when user first interacts with bot and verification is completed
- **Status Management**: Active users can access all features; inactive/blocked users are restricted

### 3.2 `devices` Table

Android devices linked to users.

```sql
CREATE TABLE devices (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id   VARCHAR(100) NOT NULL UNIQUE,
    status      VARCHAR(20) NOT NULL DEFAULT 'active',
    -- Status values: 'active', 'revoked'

    last_seen_at TIMESTAMP,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_status ON devices(user_id, status);
```

**Single Device Policy:**
- Backend enforces **only one active device per user**
- When user logs in on a new device:
  1. Revoke old device (set status = 'revoked')
  2. Activate new device (latest login wins)

### 3.3 `operator_prefixes` Table

Defines which operator owns which phone prefixes.

```sql
CREATE TABLE operator_prefixes (
    id            SERIAL PRIMARY KEY,
    operator_code VARCHAR(20) NOT NULL,   -- e.g., 'SYRIATEL', 'MTN'
    prefix        VARCHAR(10) NOT NULL,   -- e.g., '093', '098'
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,

    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_operator_prefixes_prefix ON operator_prefixes(prefix);
CREATE INDEX idx_operator_prefixes_active ON operator_prefixes(is_active);
```

**Usage:**
- Backend uses this table to determine `operator_code` for each recipient phone
- If no matching prefix is found → backend rejects the request
- Allows easy addition of new operators or prefix changes

**Example Data:**
```sql
INSERT INTO operator_prefixes (operator_code, prefix) VALUES
('SYRIATEL', '093'),
('SYRIATEL', '099'),
('MTN', '094'),
('MTN', '095');
```

### 3.4 `operator_message_rules` Table

Rules to interpret USSD responses for success/failure per operator.

```sql
CREATE TABLE operator_message_rules (
    id               SERIAL PRIMARY KEY,
    operator_code    VARCHAR(20) NOT NULL UNIQUE,  -- 'SYRIATEL', 'MTN'
    success_keywords TEXT[] NOT NULL,              -- e.g., {'تم', 'نجاح'}
    failure_keywords TEXT[] NOT NULL,              -- e.g., {'فشل', 'غير كاف'}

    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_operator_rules_code ON operator_message_rules(operator_code);
```

**Usage:**
- Android app loads these rules after login: `GET /android/rules`
- On each app start, Android checks if rules changed: `GET /android/rules/last-updated`
- If updated, Android refreshes the rules
- Android decides success/failure by scanning carrier message using these keywords

**Example Data:**
```sql
INSERT INTO operator_message_rules (operator_code, success_keywords, failure_keywords) VALUES
('SYRIATEL', ARRAY['تم', 'نجاح', 'نجحت'], ARRAY['فشل', 'فشلت', 'غير كاف', 'رصيد غير كافي']),
('MTN', ARRAY['تم', 'نجاح', 'successful'], ARRAY['فشل', 'failed', 'insufficient']);
```

### 3.5 `transfer_requests` Table

Main table for all balance transfer operations.

```sql
CREATE TABLE transfer_requests (
    id              SERIAL PRIMARY KEY,

    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id       INTEGER REFERENCES devices(id),

    recipient_phone VARCHAR(20) NOT NULL,
    amount          NUMERIC(12,2) NOT NULL,

    operator_code   VARCHAR(20) NOT NULL,

    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- Status values: 'delayed', 'pending', 'processing', 'success', 'failed'

    execute_after   TIMESTAMP NOT NULL DEFAULT NOW(),  -- For 20s cooldown handling

    result_message  TEXT,
    error_code      VARCHAR(50),

    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at    TIMESTAMP,
    completed_at    TIMESTAMP
);

CREATE INDEX idx_transfers_user_id ON transfer_requests(user_id);
CREATE INDEX idx_transfers_status ON transfer_requests(status);
CREATE INDEX idx_transfers_execute_after ON transfer_requests(execute_after);
CREATE INDEX idx_transfers_created_at ON transfer_requests(created_at);
CREATE INDEX idx_transfers_user_recipient ON transfer_requests(user_id, recipient_phone, created_at);
```

**Used By:**
- **Telegram Bot**: Create new transfers
- **Backend**: Enforce rules and manage status lifecycle
- **Android App**: Execute transfers (via polling)
- **Web UI**: Display transfer data for users and admins

**Status Lifecycle:**
```
delayed → pending → processing → success/failed
```

### 3.6 `otp_codes` Table

For OTP-based login (Web UI and Android).

```sql
CREATE TABLE otp_codes (
    id          SERIAL PRIMARY KEY,

    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    phone       VARCHAR(20) NOT NULL,

    code_hash   VARCHAR(255) NOT NULL,
    purpose     VARCHAR(50) NOT NULL,
    -- Purpose values: 'web_login', 'android_login'

    expires_at  TIMESTAMP NOT NULL,
    used_at     TIMESTAMP,

    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_phone ON otp_codes(phone);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);
```

**Security:**
- OTP is generated, **hashed**, stored, then sent via Telegram bot
- Validation uses this table with hash comparison
- Can be extended for rate limiting and failed attempt tracking

**OTP Generation Example:**
```javascript
const code = generateRandomCode(6); // 123456
const codeHash = await bcrypt.hash(code, 10);
await db.otp_codes.insert({
    user_id,
    phone,
    code_hash,
    purpose: 'web_login',
    expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
});
// Send code via Telegram bot
await botAPI.sendOTP(telegram_id, code);
```

### 3.7 `system_logs` Table (Optional but Recommended)

```sql
CREATE TABLE system_logs (
    id          SERIAL PRIMARY KEY,
    level       VARCHAR(10) NOT NULL,      -- 'info', 'warn', 'error'
    source      VARCHAR(20) NOT NULL,      -- 'backend', 'bot', 'android', 'ui'
    message     TEXT NOT NULL,
    context     JSONB,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logs_level ON system_logs(level);
CREATE INDEX idx_logs_source ON system_logs(source);
CREATE INDEX idx_logs_created_at ON system_logs(created_at);
```

**Usage:**
- Admin log view in Web UI
- Debugging and monitoring
- Audit trail

## 4. Authentication & Tokens

### 4.1 Web Authentication (User & Admin)

#### Step 1: Request OTP
```
POST /auth/request-otp
Content-Type: application/json

{
  "phone": "0912345678"
}
```

**Backend Process:**
1. Check user exists: `SELECT * FROM users WHERE phone = ?`
2. Verify user is active: `status = 'active'`
3. Generate 6-digit OTP
4. Hash and store in `otp_codes` with `purpose = 'web_login'`
5. Send OTP via Telegram bot

**Response:**
```json
{
  "success": true,
  "message": "OTP sent via Telegram"
}
```

#### Step 2: Verify OTP
```
POST /auth/verify-otp
Content-Type: application/json

{
  "phone": "0912345678",
  "otp": "123456"
}
```

**Backend Process:**
1. Find valid OTP: `WHERE phone = ? AND purpose = 'web_login' AND expires_at > NOW() AND used_at IS NULL`
2. Verify hash: `bcrypt.compare(otp, code_hash)`
3. Mark OTP as used: `UPDATE otp_codes SET used_at = NOW()`
4. Generate JWT

**JWT Payload:**
```json
{
  "sub": "user_123",
  "phone": "0912345678",
  "is_admin": false,
  "token_type": "web",
  "iat": 1700000000,
  "exp": 1700086400  // 24 hours
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "user_123",
    "phone": "0912345678",
    "name": "محمد",
    "is_admin": false
  }
}
```

**Usage:**
```
GET /api/me/transfers
Authorization: Bearer eyJhbGc...
```

### 4.2 Android Authentication & Device Binding

#### Step 1: Request OTP
```
POST /auth/android/request-otp
Content-Type: application/json

{
  "phone": "0912345678"
}
```

**Backend Process:**
- Same as web, but `purpose = 'android_login'`

#### Step 2: Verify OTP & Bind Device
```
POST /auth/android/verify-otp
Content-Type: application/json

{
  "phone": "0912345678",
  "otp": "123456",
  "device_info": {
    "device_id": "android_device_abc123",
    "model": "Samsung Galaxy S21",
    "os_version": "Android 13"
  }
}
```

**Backend Process:**
1. Verify OTP (same as web)
2. Check existing devices for this user:
   ```sql
   SELECT * FROM devices 
   WHERE user_id = ? AND status = 'active'
   ```
3. If old device exists:
   ```sql
   UPDATE devices 
   SET status = 'revoked', updated_at = NOW() 
   WHERE user_id = ? AND status = 'active'
   ```
4. Create/activate new device:
   ```sql
   INSERT INTO devices (user_id, device_id, status, last_seen_at)
   VALUES (?, ?, 'active', NOW())
   ON CONFLICT (device_id) DO UPDATE
   SET status = 'active', last_seen_at = NOW()
   ```
5. Generate long-lived JWT

**Android JWT Payload:**
```json
{
  "sub": "user_123",
  "device_id": "device_abc123",
  "token_type": "android",
  "iat": 1700000000,
  "exp": 1707776000  // 90 days
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "device_id": "device_abc123",
  "user": {
    "id": "user_123",
    "phone": "0912345678",
    "name": "محمد"
  },
  "expires_in": 7776000  // seconds (90 days)
}
```

### 4.3 Bot Authentication

**Service Token:**
- Bot uses a single service token stored in environment variable: `BOT_BACKEND_TOKEN`
- Backend validates this token for all `/bot/*` endpoints

**Request:**
```
POST /bot/transfer
Authorization: Bearer ${BOT_BACKEND_TOKEN}
Content-Type: application/json

{
  "telegram_id": "123456789",
  "recipient_phone": "0919876543",
  "amount": 50
}
```

**User Identity:**
- Telegram user identified by `telegram_id`
- Linked to `users.phone` via verification process
- Backend maps `telegram_id` to user record

## 5. Business Rules (Backend Logic)

### 5.1 Status Lifecycle

```
┌─────────┐
│ delayed │  (Waiting for 20-second cooldown)
└────┬────┘
     ↓ (execute_after <= NOW)
┌─────────┐
│ pending │  (Ready to be picked by Android)
└────┬────┘
     ↓ (Android picks it up)
┌────────────┐
│ processing │  (Android is executing USSD)
└─────┬──────┘
      ↓
┌──────────────────┐
│ success / failed │  (Final state)
└──────────────────┘
```

### 5.2 Five-Minute Rule (Same Recipient – Hard Block)

**Rule:** User cannot send another transfer to the same recipient within 5 minutes.

**Implementation:**
```javascript
async function checkFiveMinuteRule(userId, recipientPhone) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const recentTransfer = await db.transfer_requests.findOne({
    user_id: userId,
    recipient_phone: recipientPhone,
    created_at: { $gte: fiveMinutesAgo }
  });
  
  if (recentTransfer) {
    throw new Error('You cannot send another transfer to this number within 5 minutes.');
  }
}
```

**Flow:**
1. Bot sends transfer request to backend
2. Backend checks last transfer for:
   - Same `user_id`
   - Same `recipient_phone`
   - Created within last 5 minutes
3. If found → **Reject request** (no database row created)
4. Return error to bot: `"You cannot send another transfer to this number within 5 minutes."`

### 5.3 Twenty-Second Rule (Global Cooldown – Delayed Execution)

**Rule:** User must wait 20 seconds between any transfers (regardless of recipient).

**Implementation:**
```javascript
async function applyTwentySecondRule(userId) {
  const lastTransfer = await db.transfer_requests.findOne({
    user_id: userId,
    order_by: { created_at: 'DESC' }
  });
  
  if (!lastTransfer) {
    return { status: 'pending', execute_after: new Date() };
  }
  
  const twentySecondsLater = new Date(lastTransfer.created_at.getTime() + 20 * 1000);
  const now = new Date();
  
  if (twentySecondsLater > now) {
    // Still in cooldown period
    return { status: 'delayed', execute_after: twentySecondsLater };
  } else {
    // Cooldown period passed
    return { status: 'pending', execute_after: now };
  }
}
```

**Flow:**
1. Check last transfer for this `user_id` (any recipient)
2. If last transfer < 20 seconds ago:
   - Create request with `status = 'delayed'`
   - Set `execute_after = last_transfer.created_at + 20 seconds`
3. Else:
   - Create request with `status = 'pending'`
   - Set `execute_after = NOW()`

**Android Polling:**
```javascript
// When Android calls GET /android/requests/next
async function getNextRequest(userId) {
  // First, upgrade any delayed requests that are due
  await db.transfer_requests.update({
    user_id: userId,
    status: 'delayed',
    execute_after: { $lte: new Date() }
  }, {
    status: 'pending'
  });
  
  // Then, get the next pending request
  const request = await db.transfer_requests.findOne({
    user_id: userId,
    status: 'pending',
    order_by: { execute_after: 'ASC' }
  });
  
  if (request) {
    // Mark as processing
    await db.transfer_requests.update(request.id, {
      status: 'processing',
      processed_at: new Date()
    });
  }
  
  return request;
}
```

### 5.4 User Status Enforcement

**Rule:** Only active users can perform operations.

**Implementation Across Components:**

**Web UI:**
```javascript
// During OTP request
if (user.status !== 'active') {
  throw new Error('Your account is not active. Please contact admin.');
}
```

**Telegram Bot:**
```javascript
// Before allowing /send command
if (user.status !== 'active') {
  return ctx.reply('Your account is inactive. Please contact admin.');
}
```

**Android App:**
```javascript
// When polling for next request
if (user.status !== 'active') {
  return { message: 'No jobs available' };
}
```

### 5.5 Operator Detection

**Rule:** Determine operator based on recipient phone prefix.

**Implementation:**
```javascript
async function detectOperator(recipientPhone) {
  // Extract prefix (first 3-4 digits)
  const prefixes = [
    recipientPhone.substring(0, 3),
    recipientPhone.substring(0, 4)
  ];
  
  const match = await db.operator_prefixes.findOne({
    prefix: { $in: prefixes },
    is_active: true
  });
  
  if (!match) {
    throw new Error(`No operator found for phone number: ${recipientPhone}`);
  }
  
  return match.operator_code;
}
```

**Example:**
- Phone: `0939876543`
- Prefix: `093`
- Operator: `SYRIATEL`

## 6. Backend APIs

### 6.1 Bot APIs

#### Create Transfer Request

```
POST /bot/transfer
Authorization: Bearer ${BOT_BACKEND_TOKEN}
Content-Type: application/json

{
  "telegram_id": "123456789",
  "recipient_phone": "0919876543",
  "amount": 50
}
```

**Backend Process:**
1. Authenticate bot token
2. Map `telegram_id` to user
3. Verify user is active
4. Check 5-minute rule (same recipient)
5. Apply 20-second rule (determine status: delayed/pending)
6. Detect operator from `operator_prefixes`
7. Create `transfer_request` record

**Response:**
```json
{
  "request_id": "req_abc123",
  "status": "pending",  // or "delayed"
  "execute_after": "2025-11-14T15:30:45Z",
  "message": "Transfer request received successfully"
}
```

**Error Responses:**
```json
// 5-minute rule violation
{
  "error": "COOLDOWN_VIOLATION",
  "message": "You cannot send another transfer to this number within 5 minutes."
}

// User inactive
{
  "error": "USER_INACTIVE",
  "message": "Your account is inactive. Please contact admin."
}

// No operator found
{
  "error": "INVALID_PHONE",
  "message": "Invalid recipient phone number."
}
```

#### Create Balance Inquiry Job

```
POST /bot/balance
Authorization: Bearer ${BOT_BACKEND_TOKEN}
Content-Type: application/json

{
  "telegram_user_id": "123456789",
  "operator": "syriatel" | "mtn"
}
```

**Backend Process:**
1. Authenticate bot token
2. Map `telegram_user_id` to user
3. Verify user is active
4. Create in-memory balance job (NOT in database)
5. Store job with 60-second expiration
6. Map telegram_user_id to job for Android polling

**In-Memory Job Structure:**
```typescript
{
  jobId: "bal_xyz789",
  userId: "user_123",
  telegramUserId: "123456789",
  operator: "syriatel",
  status: "pending",
  createdAt: Date.now(),
  expiresAt: Date.now() + 60000  // 60 seconds
}
```

**Response:**
```json
{
  "job_id": "bal_xyz789",
  "status": "pending",
  "message": "Balance inquiry job created"
}
```

**Error Response:**
```json
{
  "error": "USER_INACTIVE",
  "message": "Your account is inactive"
}
```

#### Internal Callback (Backend → Bot)

**Not a public API endpoint.** Backend calls bot's internal endpoint:

**Transfer Result:**
```
POST ${BOT_WEBHOOK_URL}/internal/notify-result
X-Bot-Secret: ${INTERNAL_SECRET}
Content-Type: application/json

{
  "telegram_id": "123456789",
  "request_id": "req_abc123",
  "status": "success",
  "phone": "091234****",  // Masked
  "amount": 50,
  "message": "Transfer completed successfully"
}
```

**Balance Result:**
```
POST ${BOT_WEBHOOK_URL}/internal/notify-balance
X-Bot-Secret: ${INTERNAL_SECRET}
Content-Type: application/json

{
  "telegram_user_id": "123456789",
  "status": "success" | "failed",
  "message": "<full USSD response text>"
}
```

**Balance Timeout:**
After 60 seconds with no Android response, backend automatically calls:
```json
{
  "telegram_user_id": "123456789",
  "status": "failed",
  "message": "انتهاء المهلة (لم يتم استلام أي رد خلال 60 ثانية)."
}
```

### 6.2 Android APIs

#### Get Next Transfer Request

```
GET /android/requests/next
Authorization: Bearer ${ANDROID_JWT}
```

**Backend Process:**
1. Authenticate Android JWT
2. Extract `user_id` and `device_id`
3. Verify device is active
4. **Check for pending balance job first** (in-memory)
5. If balance job exists, return it immediately
6. Otherwise, upgrade delayed requests: `delayed` → `pending` (where `execute_after <= NOW`)
7. Get earliest `pending` transfer request for this user
8. Mark transfer as `processing`

**Response (Balance Job):**
```json
{
  "job_type": "balance",
  "job_id": "bal_xyz789",
  "operator": "syriatel" | "mtn"
}
```

**Response (Transfer Job):**
```json
{
  "job_type": "transfer",
  "request_id": "req_abc123",
  "recipient_phone": "0919876543",
  "amount": 50,
  "operator_code": "SYRIATEL"
}
```

**Response (No Jobs):**
```json
{
  "message": "No pending requests"
}
```

#### Report Balance Result

```
POST /android/balance/result
Authorization: Bearer ${ANDROID_JWT}
Content-Type: application/json

{
  "job_id": "bal_xyz789",  // Optional, can identify by user_id
  "status": "success" | "failed",
  "message": "<full USSD response text>"
}
```

**Backend Process:**
1. Authenticate Android JWT
2. Extract `user_id`
3. Find balance job for this user (in-memory)
4. Delete job from memory
5. Get user's telegram_user_id
6. Call bot internal endpoint `/internal/notify-balance`

**Response:**
```json
{
  "success": true,
  "message": "Balance result reported successfully"
}
```

**No Request Available:**
```json
{
  "request_id": null,
  "message": "No pending requests"
}
```

#### Report Execution Result

```
POST /android/requests/{request_id}/result
Authorization: Bearer ${ANDROID_JWT}
Content-Type: application/json

{
  "status": "success",  // or "failed"
  "message": "تم تنفيذ عملية التحويل بنجاح"
}
```

**Backend Process:**
1. Authenticate Android JWT
2. Verify request exists and is in `processing` state
3. Update `transfer_requests`:
   ```sql
   UPDATE transfer_requests
   SET status = ?,
       result_message = ?,
       completed_at = NOW(),
       updated_at = NOW()
   WHERE id = ?
   ```
4. Trigger notification to Telegram bot

**Response:**
```json
{
  "success": true,
  "message": "Result recorded successfully"
}
```

#### Get Operator Message Rules

```
GET /android/rules
Authorization: Bearer ${ANDROID_JWT}
```

**Response:**
```json
{
  "rules": [
    {
      "operator_code": "SYRIATEL",
      "success_keywords": ["تم", "نجاح", "نجحت"],
      "failure_keywords": ["فشل", "فشلت", "غير كاف", "رصيد غير كافي"]
    },
    {
      "operator_code": "MTN",
      "success_keywords": ["تم", "نجاح", "successful"],
      "failure_keywords": ["فشل", "failed", "insufficient"]
    }
  ],
  "last_updated": "2025-11-14T10:00:00Z"
}
```

#### Check Rules Update

```
GET /android/rules/last-updated
Authorization: Bearer ${ANDROID_JWT}
```

**Response:**
```json
{
  "last_updated": "2025-11-14T10:00:00Z"
}
```

**Android App Usage:**
- On app start, check this endpoint
- Compare with locally cached timestamp
- If different, fetch fresh rules via `GET /android/rules`

### 6.3 Web UI APIs (User)

#### Get User Summary (Statistics Cards)

```
GET /me/summary
Authorization: Bearer ${WEB_JWT}
```

**Response:**
```json
{
  "total": 150,
  "pending": 5,
  "processing": 2,
  "successful": 140,
  "failed": 3
}
```

#### Get User Transfers

```
GET /me/transfers?page=1&limit=10&search=0912
Authorization: Bearer ${WEB_JWT}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `search`: Search in phone number and amount

**Response:**
```json
{
  "transfers": [
    {
      "id": "req_abc123",
      "recipient_phone": "0912345678",
      "amount": 50,
      "status": "success",
      "operator_code": "SYRIATEL",
      "created_at": "2025-11-14T15:30:45Z",
      "completed_at": "2025-11-14T15:31:15Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "total_pages": 15
  }
}
```

### 6.4 Web UI APIs (Admin)

#### Get System Summary (System-Wide Statistics)

```
GET /admin/summary
Authorization: Bearer ${WEB_JWT}  (admin only)
```

**Response:**
```json
{
  "total": 15000,
  "pending": 120,
  "processing": 80,
  "successful": 14500,
  "failed": 300
}
```

#### Get All Users

```
GET /admin/users?page=1&limit=20&search=0912
Authorization: Bearer ${WEB_JWT}  (admin only)
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search in phone, name, or user ID

**Response:**
```json
{
  "users": [
    {
      "id": "user_123",
      "phone": "0912345678",
      "name": "محمد",
      "total_transfers": 50,
      "successful": 45,
      "failed": 2,
      "pending": 3,
      "is_active": true,
      "created_at": "2025-10-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 500,
    "page": 1,
    "limit": 20,
    "total_pages": 25
  }
}
```

#### Create New User

```
POST /admin/users
Authorization: Bearer ${WEB_JWT}  (admin only)
Content-Type: application/json

{
  "phone": "0912345678",
  "name": "محمد",
  "account_id": "ACC123"
}
```

**Response:**
```json
{
  "id": "user_456",
  "phone": "0912345678",
  "name": "محمد",
  "account_id": "ACC123",
  "is_admin": false,
  "status": "active",
  "created_at": "2025-11-14T16:00:00Z"
}
```

#### Update User

```
PUT /admin/users/{user_id}
Authorization: Bearer ${WEB_JWT}  (admin only)
Content-Type: application/json

{
  "name": "محمد الجديد",
  "status": "inactive"
}
```

**Response:**
```json
{
  "id": "user_456",
  "phone": "0912345678",
  "name": "محمد الجديد",
  "status": "inactive",
  "updated_at": "2025-11-14T16:05:00Z"
}
```

**Note:** Admin creation/modification of other admins is **DB-only**, not via API.

## 6. Technology Stack

### Recommended Stack
- **Runtime**: Node.js (v18 or higher)
- **Framework**: Express.js or Fastify
- **Database**: PostgreSQL (v14 or higher)
- **ORM**: Prisma, TypeORM, or Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **Hashing**: bcrypt or argon2
- **API Documentation**: Swagger/OpenAPI
- **Logging**: Winston or Pino
- **Environment**: dotenv

### Project Structure
```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Auth, validation, error handling
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utilities
│   └── index.js          # Entry point
├── migrations/           # Database migrations
├── seeds/               # Database seeds
├── tests/               # Unit and integration tests
├── .env.example
├── package.json
└── README.md
```

## 7. Environment Configuration

```env
# Server
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.easytransfer.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/easytransfer

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_WEB_EXPIRY=24h
JWT_ANDROID_EXPIRY=90d

# Bot Integration
BOT_BACKEND_TOKEN=secure_bot_token_here
BOT_WEBHOOK_URL=https://bot.easytransfer.com
BOT_INTERNAL_SECRET=internal_secret_for_callbacks

# OTP
OTP_EXPIRY_MINUTES=5
OTP_LENGTH=6

# Business Rules
FIVE_MINUTE_RULE_SECONDS=300
TWENTY_SECOND_RULE_SECONDS=20

# Logging
LOG_LEVEL=info
```

## 8. Implementation Checklist

### Phase 1: Database Setup
- [ ] Create PostgreSQL database
- [ ] Implement database schema (all tables)
- [ ] Create indexes for performance
- [ ] Seed initial data (operator_prefixes, operator_message_rules)

### Phase 2: Core Authentication
- [ ] Implement JWT generation and validation
- [ ] Build OTP generation and hashing
- [ ] Create Web authentication endpoints
- [ ] Create Android authentication endpoints
- [ ] Implement device management (one device per user)

### Phase 3: Business Logic
- [ ] Implement 5-minute rule (same recipient)
- [ ] Implement 20-second rule (global cooldown)
- [ ] Build operator detection from prefixes
- [ ] Create transfer request lifecycle management
- [ ] Implement user status enforcement

### Phase 4: Bot APIs
- [ ] Create transfer request endpoint
- [ ] Implement bot authentication
- [ ] Build callback system to bot for notifications

### Phase 5: Android APIs
- [ ] Create polling endpoint for next request
- [ ] Implement result reporting endpoint
- [ ] Build operator rules endpoints
- [ ] Handle delayed → pending upgrades

### Phase 6: Web UI APIs
- [ ] User summary and transfers endpoints
- [ ] Admin system summary endpoint
- [ ] Admin user management endpoints
- [ ] Implement pagination and search

### Phase 7: Testing & Security
- [ ] Write unit tests for business rules
- [ ] Write integration tests for APIs
- [ ] Security audit (JWT, OTP, SQL injection)
- [ ] Performance testing with large datasets
- [ ] Load testing for concurrent requests

### Phase 8: Monitoring & Logging
- [ ] Implement structured logging
- [ ] Set up error tracking
- [ ] Create system_logs table integration
- [ ] Build admin log viewer
- [ ] Set up performance monitoring

## 9. API Security Checklist

- [ ] **Rate Limiting**: Prevent brute force attacks on OTP endpoints
- [ ] **Input Validation**: Validate all input data (phone numbers, amounts, etc.)
- [ ] **SQL Injection Prevention**: Use parameterized queries
- [ ] **XSS Prevention**: Sanitize all user inputs
- [ ] **CORS**: Configure properly for Web UI domain
- [ ] **HTTPS Only**: Enforce HTTPS in production
- [ ] **Token Expiration**: Implement proper JWT expiration
- [ ] **Password Hashing**: Use bcrypt/argon2 for OTP hashing
- [ ] **Secrets Management**: Use environment variables, never hardcode

## 10. Summary

**Backend = Node.js API** that manages:
- **Users**: Creation, status management, admin vs regular
- **OTP Auth**: Secure login for Web UI and Android app
- **One Device Per User**: Enforcement with latest login wins
- **Transfer Creation & Rules**: 5-minute and 20-second cooldowns
- **Operator Detection**: Automatic based on phone prefixes
- **Android Jobs**: Short polling for pending transfers
- **Result Routing**: Receive USSD results and notify Telegram bot
- **Dashboards**: Serve statistics and data for users and admins

Built on a **clear relational schema**:
- `users`, `devices`, `transfer_requests`
- `operator_prefixes`, `operator_message_rules`
- `otp_codes`, `system_logs`

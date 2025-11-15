# Telegram Bot Implementation Tasks

**Project**: EasyTransfer 2.0 Telegram Bot  
**Framework**: grammY (TypeScript)  
**Status**: Not Started  
**Last Updated**: November 15, 2025

---

## Task Tracking Legend

- [ ] Not Started
- [⏳] In Progress
- [✅] Completed
- [⚠️] Blocked
- [🔄] Under Review

---

## Task 1: Core Bot Setup & Environment Configuration
**Status**: [✅] Completed  
**Priority**: Critical (Foundation)  
**Estimated Effort**: Small

### Description
Initialize the Node.js project with TypeScript and grammY framework. Set up project structure with proper folders (commands, middlewares, services, config). Configure environment variables for both development (polling) and production (webhook) modes. Implement the grammY bot instance with support for switching between polling and webhook based on NODE_ENV. Create basic bot startup logic and health check.

### Deliverables
- [✅] Node.js project initialization with package.json
- [✅] TypeScript configuration (tsconfig.json)
- [✅] grammY dependency installation
- [✅] Environment configuration (.env.example, env.ts)
- [✅] Project folder structure (commands/, middlewares/, services/, config/)
- [✅] Bot instance setup in index.ts
- [✅] Main entry point (index.ts) with mode switching
- [✅] Polling mode implementation for development
- [✅] Webhook mode implementation for production
- [✅] Bot startup and shutdown handlers
- [✅] Health check command (/health)

### Acceptance Criteria
- Bot starts successfully in polling mode (development) ✅
- Bot starts successfully in webhook mode (production) ✅
- Environment variables properly loaded ✅
- Bot responds to basic test messages ✅
- Clean project structure established ✅
- TypeScript compilation works without errors ✅

### Implementation Notes
- ✅ Created `config/env.ts` with environment validation
- ✅ Bot uses `BOT_MODE` to switch between polling/webhook
- ✅ Polling mode: logs bot username and backend URL on startup
- ✅ Webhook mode: sets webhook URL and logs confirmation
- ✅ Graceful shutdown handlers for SIGINT and SIGTERM
- ✅ Error handler catches and logs bot errors
- ✅ Health check command `/health` for monitoring
- ✅ Config validates required env vars on startup
- ✅ Project structure:
  ```
  src/
  ├── commands/        # Command handlers
  ├── config/          # Configuration (env, messages)
  ├── middlewares/     # Middleware (auth)
  ├── services/        # Backend client
  └── index.ts         # Bot entry point
  ```

### Notes
- Use `BOT_MODE` environment variable to switch between polling/webhook
- Test polling mode locally first
- Ensure webhook endpoint is HTTPS in production

---

## Task 2: Backend API Client & Service Token Authentication
**Status**: [✅] Completed  
**Priority**: Critical  
**Estimated Effort**: Medium

### Description
Create a centralized Backend API client (backendClient.ts) that handles all communication with the Backend API using static service token authentication. Implement methods for authorization checks and transfer submission. Configure the service token to be sent in the X-Bot-Token header with every request. Add proper error handling for network failures, timeouts, and invalid responses. Ensure the client is reusable across all bot commands.

### Deliverables
- [✅] BackendClient class in services/backendClient.ts
- [✅] Service token authentication implementation (X-Bot-Token header)
- [✅] authorize(telegramUserId) method
- [✅] submitTransfer(telegramUserId, phone, amount) method
- [✅] Error handling for network failures
- [✅] Timeout configuration for API calls (10 seconds)
- [✅] Response parsing and validation
- [✅] Environment configuration (BACKEND_API_URL, BOT_SERVICE_TOKEN)
- [✅] Singleton instance export
- [✅] TypeScript type definitions for responses

### Acceptance Criteria
- Service token sent in X-Bot-Token header ✅
- Backend API successfully called with correct headers ✅
- Authorization method returns allowed/denied status ✅
- Transfer submission method sends correct payload ✅
- Network errors handled gracefully ✅
- Timeouts properly configured (10s with AbortController) ✅
- Client can be imported and used across commands ✅

### Implementation Notes
- ✅ Uses `X-Bot-Token` header (not Authorization Bearer)
- ✅ 10-second timeout with AbortController
- ✅ Proper error handling for timeout, network failures, and HTTP errors
- ✅ TypeScript interfaces for type safety
- ✅ Never logs service token
- ✅ Singleton pattern for reusability
- ✅ Generic request method with type parameters

### Notes
- Never log the service token
- Use fetch API or axios for HTTP requests
- Consider adding retry logic for failed requests
- Validate response structure before returning

---

## Task 3: Authorization Middleware
**Status**: [✅] Completed  
**Priority**: Critical  
**Estimated Effort**: Small

### Description
Implement authorization middleware that checks user permissions with the Backend before executing any command. Extract the Telegram user ID from the context, send it to Backend API for authorization verification, and block unauthorized users with an Arabic error message. Attach this middleware to all protected commands. Ensure the middleware is efficient and doesn't block the event loop.

### Deliverables
- [✅] Authorization middleware in middlewares/auth.ts
- [✅] Telegram user ID extraction from context
- [✅] Backend authorization API call
- [✅] Unauthorized user error message (Arabic)
- [✅] Middleware registration on bot instance
- [✅] Error handling for Backend API failures
- [✅] Skip authorization for /start command

### Acceptance Criteria
- Middleware extracts correct Telegram user ID ✅
- Authorization check calls Backend API ✅
- Unauthorized users receive Arabic error message ✅
- Authorized users proceed to command handler ✅
- Backend API failures handled gracefully ✅
- Middleware doesn't block other users' requests ✅
- /start command bypasses authorization ✅

### Implementation Notes
- ✅ Error message: "عذراً، لا تملك صلاحية استخدام هذا البوت."
- ✅ Registered globally in index.ts with `bot.use(authMiddleware)`
- ✅ Skips /start command to allow new users to see welcome
- ✅ Logs authorization errors for security audit
- ✅ Returns early if no user ID (anonymous messages)
- ✅ Shows backend error message if API fails

### Notes
- Error message: "عذراً، لا تملك صلاحية استخدام هذا البوت."
- Cache authorization results briefly to reduce API calls (optional)
- Log authorization attempts for security audit

---

## Task 4: /send Command (Interactive & Shortcut Modes)
**Status**: [✅] Completed  
**Priority**: Critical  
**Estimated Effort**: Medium

### Description
Implement the /send command supporting both interactive mode (step-by-step prompts for phone and amount) and shortcut mode (/send <amount> <phone> in one line). For interactive mode, use grammY conversation/session management to collect phone and amount sequentially. For shortcut mode, parse command arguments and validate format. Perform basic client-side validation (digits only for phone, positive number for amount), then submit to Backend API. Display confirmation message only after Backend acknowledges receipt. Handle all error scenarios with clear Arabic messages.

### Deliverables
- ✅ /send command handler in commands/send.ts
- ✅ Interactive mode implementation (step-by-step prompts)
- ✅ Shortcut mode implementation (parse arguments)
- ✅ Phone number format validation (digits only)
- ✅ Amount format validation (positive number)
- ✅ Backend API submission via backendClient
- ✅ Success confirmation message (Arabic)
- ✅ Error messages for invalid format (Arabic)
- ✅ Error handling for Backend failures
- ✅ Session/conversation state management (grammY conversations plugin)

### Acceptance Criteria
- ✅ Interactive mode prompts for phone, then amount
- ✅ Shortcut mode parses /send <amount> <phone> correctly
- ✅ Invalid phone shows: "رقم الهاتف غير صالح. يرجى إدخال أرقام فقط."
- ✅ Invalid amount shows: "المبلغ غير صالح. يرجى إدخال رقم موجب."
- ✅ Valid requests submitted to Backend API
- ✅ Confirmation shown only after Backend acknowledgment: "تم استلام طلبك، وسيتم تنفيذ التحويل قريباً."
- ✅ Backend errors show: "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً."
- ✅ Both modes work correctly

### Implementation Details

**Dependencies Installed:**
- @grammyjs/conversations@2.1.0

**Type System:**
```typescript
// index.ts
interface SessionData {}
type BaseContext = Context & SessionFlavor<SessionData>;
export type MyContext = BaseContext & ConversationFlavor<BaseContext>;

// send.ts
Conversation<MyContext, MyContext>
```

**Files Modified:**
1. **config/messages.ts**: Added interactive mode messages
   - ASK_PHONE: "يرجى إدخال رقم الهاتف المستلم:"
   - ASK_AMOUNT: "يرجى إدخال المبلغ المراد تحويله:"
   - INVALID_PHONE: "رقم الهاتف غير صالح. يرجى إدخال أرقام فقط."
   - INVALID_AMOUNT: "المبلغ غير صالح. يرجى إدخال رقم موجب."

2. **index.ts**: Registered conversations plugin
   - Defined MyContext type with SessionFlavor & ConversationFlavor
   - Added session middleware: `bot.use(session({ initial: () => ({}) }))`
   - Added conversations middleware: `bot.use(conversations())`
   - Registered sendConversation: `bot.use(createConversation(sendConversation))`
   - Changed Bot<Context> to Bot<MyContext>

3. **commands/send.ts**: Implemented both modes
   - `sendConversation()`: Interactive flow using conversation.wait()
   - `sendCommand()`: Shortcut mode with argument parsing
   - Both use `backendClient.submitTransfer(userId, phone, amount)`
   - Validation helpers: `isValidPhone()`, `isValidAmount()`
   - Interactive mode entered via: `ctx.conversation.enter('sendConversation')`

4. **commands/index.ts**: Updated to use Bot<MyContext>

5. **commands/health.ts**: Updated to use Bot<MyContext>

**Flow:**
- **Interactive**: /send → Ask phone → Validate → Ask amount → Validate → Submit → Confirm
- **Shortcut**: /send 100 0912345678 → Validate both → Submit → Confirm

### Notes
- grammY conversations plugin requires session middleware
- Conversation type needs both parameters: `Conversation<MyContext, MyContext>`
- MyContext combines SessionFlavor and ConversationFlavor properly
- Both modes validate format only, business logic handled by backend
- Success response checked via `response.id && response.status`
- Error handling logs to console for debugging

---

## Task 5: /start Command & Welcome Message
**Status**: [✅] Completed  
**Priority**: Medium  
**Estimated Effort**: Small

### Description
Implement the /start command to welcome new users and provide basic bot usage instructions in Arabic. Display available commands and brief descriptions. Keep the message simple and user-friendly. Optionally integrate with authorization middleware to only show instructions to authorized users.

### Deliverables
- ✅ /start command handler in commands/start.ts
- ✅ Welcome message in Arabic
- ✅ Usage instructions for /send command
- ✅ Updated to use MyContext type
- ✅ Message stored in config/messages.ts

### Acceptance Criteria
- ✅ /start displays welcome message in Arabic
- ✅ Instructions explain both interactive and shortcut modes
- ✅ Message is clear and concise with examples
- ✅ Uses Markdown formatting for better readability
- ✅ Bypasses authorization (handled by middleware)

### Implementation Details

**Welcome Message:**
```
مرحباً بك في EasyTransfer 2.0! 👋

لإرسال تحويل، استخدم أحد الطريقتين:

📱 *الطريقة التفاعلية:*
/send
ثم أدخل رقم الهاتف والمبلغ خطوة بخطوة

⚡ *الطريقة السريعة:*
/send <المبلغ> <رقم الهاتف>

*مثال:*
/send 1000 0912345678

للمساعدة: /help
```

**Files Modified:**
1. **config/messages.ts**: Added MESSAGES.WELCOME constant
2. **commands/start.ts**: 
   - Updated to use `MyContext` type
   - Uses `MESSAGES.WELCOME` from config
   - Sends with Markdown parse mode
   - Simplified to single line: `ctx.reply(MESSAGES.WELCOME, { parse_mode: 'Markdown' })`

**Features:**
- Explains both interactive and shortcut send modes
- Includes practical example
- Mentions /help for future support
- Uses emoji for visual appeal
- Markdown formatting for emphasis

### Notes
- /start bypasses authorization via middleware check
- Welcome message stored centrally in config/messages.ts
- Message includes both send modes (interactive & shortcut)
- Future: Add /help command for detailed instructions

---

## Task 6: Internal Endpoints for Backend Callbacks
**Status**: [✅] Completed  
**Priority**: Critical  
**Estimated Effort**: Medium

### Description
Create protected internal endpoints that the Backend can call to notify the bot of transfer results and deliver OTP codes. Implement two endpoints: one for transfer result notifications (success/failed) and one for OTP delivery. Secure these endpoints with a secret token header (X-Bot-Secret) and optional IP allowlist. When notified, send formatted messages to users via their Telegram user ID. Ensure OTP codes are never stored or logged.

### Deliverables
- ✅ Transfer result notification endpoint (POST /internal/notify-result)
- ✅ OTP delivery endpoint (POST /internal/send-otp)
- ✅ Secret token validation (X-Bot-Secret header)
- ✅ Optional IP allowlist validation
- ✅ Success message formatting (Arabic with ✅)
- ✅ Failure message formatting (Arabic with ❌)
- ✅ OTP message formatting (Arabic)
- ✅ User notification via Telegram API
- ✅ Error handling for invalid payloads
- ✅ Security logging (reject unauthorized attempts)

### Acceptance Criteria
- ✅ Endpoints only accept requests with valid X-Bot-Secret header
- ✅ Invalid token returns 403 Forbidden
- ✅ Transfer success sends: "✅ تم تنفيذ عملية التحويل (ID: {id}) بنجاح."
- ✅ Transfer failure sends: "❌ فشلت عملية التحويل (ID: {id}). السبب: {reason}"
- ✅ OTP delivery sends: "🔐 رمز التحقق الخاص بك هو: {code}\n\nلا تشارك هذا الرمز مع أحد."
- ✅ OTP codes are NEVER logged
- ✅ IP allowlist works if configured
- ✅ Unauthorized attempts are logged

### Implementation Details

**Dependencies Installed:**
- express@^4.18.0
- @types/express@^4.17.0 (dev)

**Architecture:**
- Express server runs alongside grammY bot
- Server listens on INTERNAL_PORT (default: 3100)
- Bot instance stored in global scope for endpoint access
- Security middleware validates all /internal routes

**Files Created/Modified:**

1. **server/internal.ts** (NEW):
   - Express app with JSON body parser
   - Security middleware: `validateSecret()`
     - Checks X-Bot-Secret header against INTERNAL_SECRET
     - Optional IP allowlist validation
     - Logs unauthorized attempts (IP, endpoint, timestamp)
   - POST /internal/notify-result:
     - Receives: telegram_user_id, transfer_id, status, reason
     - Validates required fields
     - Formats message based on status (success/failed)
     - Sends via bot.api.sendMessage()
     - Returns 400 for invalid payload, 500 for failures
   - POST /internal/send-otp:
     - Receives: telegram_user_id, code
     - Sends OTP with security warning
     - NEVER logs the actual code (only logs user_id)
   - GET /health: Health check (no auth required)
   - `startInternalServer(bot)`: Starts server and stores bot instance

2. **config/env.ts**: Added INTERNAL_PORT configuration (default: 3100)

3. **config/messages.ts**: Added OTP_CODE message template
   ```typescript
   OTP_CODE: (code: string) => `🔐 رمز التحقق الخاص بك هو: ${code}\n\nلا تشارك هذا الرمز مع أحد.`
   ```

4. **index.ts**: Import and call `startInternalServer(bot)` before bot.start()

5. **.env.example**: Added INTERNAL_PORT=3100

**Security Features:**
- X-Bot-Secret header validation (403 if invalid)
- Optional IP allowlist (ALLOWED_IPS env var)
- Security logging for unauthorized attempts
- OTP codes never logged (only "OTP delivered to user X")
- Error handling returns generic messages

**Endpoint Payloads:**

```typescript
// POST /internal/notify-result
{
  "telegram_user_id": 123456789,
  "transfer_id": 42,
  "status": "success" | "failed",
  "reason": "optional error reason"
}

// POST /internal/send-otp
{
  "telegram_user_id": 123456789,
  "code": "123456"
}
```

**Testing:**
```bash
# Test with valid secret
curl -X POST http://localhost:3100/internal/notify-result \
  -H "Content-Type: application/json" \
  -H "X-Bot-Secret: your-secret" \
  -d '{"telegram_user_id":123,"transfer_id":1,"status":"success"}'

# Test without secret (should return 403)
curl -X POST http://localhost:3100/internal/notify-result \
  -H "Content-Type: application/json" \
  -d '{"telegram_user_id":123,"transfer_id":1,"status":"success"}'
```

### Notes
- Internal server starts automatically with bot
- INTERNAL_SECRET must match between bot and backend
- IP allowlist optional (empty array = no IP restriction)
- Security logs help identify unauthorized access attempts
- OTP codes are sensitive: never log, never store

---

## Task 7: Error Handling & User Feedback
**Status**: [ ] Not Started  
**Priority**: High  
**Estimated Effort**: Small

### Description
Implement comprehensive error handling across all bot commands and internal endpoints. Create standardized Arabic error messages for common scenarios (Backend unreachable, invalid format, unauthorized access). Ensure users always receive clear feedback, never leave them without a response. Add global error handlers for uncaught exceptions. Log errors with context for debugging while masking sensitive data.

### Deliverables
- [ ] Global error handler for uncaught exceptions
- [ ] Standardized error messages in Arabic
- [ ] Backend unreachable error handling
- [ ] Invalid input error handling
- [ ] Authorization error handling
- [ ] Network timeout handling
- [ ] User-friendly error responses
- [ ] Error logging with context (safe data only)

### Acceptance Criteria
- All errors result in user-facing message
- Error messages are in Arabic and clear
- Backend failures show: "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً."
- Invalid format shows specific format help
- Uncaught exceptions don't crash bot
- Errors logged with sufficient context
- No sensitive data in error logs

### Notes
- Never expose technical error details to users
- Log stack traces for debugging
- Consider implementing retry logic for transient errors
- Test all error scenarios

---

## Task 8: Logging System (Safe & Minimal)
**Status**: [ ] Not Started  
**Priority**: High  
**Estimated Effort**: Small

### Description
Implement a safe logging system that records bot operations without exposing sensitive data. Log command events (without parameters), Backend API call status, notification deliveries (without OTP codes), and authorization results. Never log OTP codes, full phone numbers, tokens, or sensitive user data. Use structured logging with timestamps and log levels (INFO, WARN, ERROR). Configure log output based on environment (console for development, file/service for production).

### Deliverables
- [ ] Logging utility/service setup
- [ ] Log levels (INFO, WARN, ERROR)
- [ ] Timestamp formatting
- [ ] Safe logging for commands (no parameters)
- [ ] Backend API call logging (status codes only)
- [ ] Notification event logging (without codes)
- [ ] Authorization result logging
- [ ] Sensitive data masking rules
- [ ] Environment-based log output
- [ ] Log rotation (production)

### Acceptance Criteria
- Commands logged without exposing parameters
- Backend API calls logged with status codes
- OTP delivery logged WITHOUT the code value
- Phone numbers masked if logged (091234****)
- No tokens or passwords in logs
- Log format includes timestamp and level
- Logs are readable and useful for debugging
- Production logs properly rotated

### Notes
- Use console.log wrapper or winston/pino library
- Example safe log: "OTP delivery requested for user 123456789"
- Example unsafe log: "OTP code: 123456" ❌ NEVER DO THIS
- Review logs regularly for accidental leaks

---

## Task 9: Deployment Configuration (Webhook & Polling)
**Status**: [ ] Not Started  
**Priority**: Medium  
**Estimated Effort**: Small

### Description
Configure the bot to support both webhook (production) and polling (development) deployment modes. Implement automatic mode selection based on NODE_ENV and BOT_MODE environment variables. For webhook mode, set up the endpoint URL with Telegram and handle incoming updates via Express/Fastify server. For polling mode, use grammY's built-in polling. Add health check endpoint for production monitoring. Document deployment steps for both modes.

### Deliverables
- [ ] Webhook mode implementation with Express/Fastify
- [ ] Polling mode implementation
- [ ] Environment-based mode switching
- [ ] Telegram webhook URL configuration
- [ ] Health check endpoint (/health)
- [ ] HTTPS configuration for webhook
- [ ] Deployment documentation
- [ ] Environment variable examples

### Acceptance Criteria
- Bot starts in polling mode when BOT_MODE=polling
- Bot starts in webhook mode when BOT_MODE=webhook
- Webhook URL correctly configured with Telegram
- Health check endpoint returns 200 OK
- HTTPS enforced for webhook in production
- Clear deployment instructions documented
- Both modes tested successfully

### Notes
- Webhook requires HTTPS and valid SSL certificate
- Use ngrok for local webhook testing
- Document webhook setup with Telegram API
- Include environment variable examples in README

---

## Task 10: Testing & Security Audit
**Status**: [ ] Not Started  
**Priority**: High  
**Estimated Effort**: Medium

### Description
Conduct comprehensive testing of all bot functionality and perform security audit. Test interactive and shortcut /send modes, authorization flow, internal endpoints security, OTP delivery, and transfer notifications. Verify that no sensitive data leaks in logs or error messages. Test error scenarios (Backend down, invalid input, unauthorized users). Review code for security vulnerabilities and ensure all environment secrets are properly protected. Document test cases and results.

### Deliverables
- [ ] Test interactive /send mode
- [ ] Test shortcut /send mode
- [ ] Test authorization middleware
- [ ] Test internal endpoints with valid/invalid tokens
- [ ] Test OTP delivery (verify no storage/logging)
- [ ] Test transfer notifications
- [ ] Test error handling scenarios
- [ ] Security audit of logs (no sensitive data)
- [ ] Security audit of environment variables
- [ ] Code review for vulnerabilities
- [ ] Test documentation

### Acceptance Criteria
- All commands work as specified
- Authorization correctly blocks unauthorized users
- Internal endpoints reject invalid tokens
- OTP codes never appear in logs
- Phone numbers masked in logs
- Service token never logged
- All error scenarios handled gracefully
- No security vulnerabilities found
- Test cases documented

### Notes
- Test with real Telegram account in development
- Use separate test environment for Backend
- Review all log output for sensitive data
- Consider automated testing for critical flows
- Document any known limitations or issues

---

## Overall Progress

**Total Tasks**: 10  
**Completed**: 0  
**In Progress**: 0  
**Not Started**: 10  
**Blocked**: 0  

**Overall Completion**: 0%

---

## Implementation Order (Recommended)

1. **Task 1** - Core Bot Setup & Environment Configuration (Foundation)
2. **Task 2** - Backend API Client & Service Token Authentication (Core Integration)
3. **Task 3** - Authorization Middleware (Security)
4. **Task 5** - /start Command & Welcome Message (User Experience)
5. **Task 4** - /send Command (Interactive & Shortcut Modes) (Core Feature)
6. **Task 6** - Internal Endpoints for Backend Callbacks (Backend Integration)
7. **Task 8** - Logging System (Safe & Minimal) (Observability)
8. **Task 7** - Error Handling & User Feedback (User Experience)
9. **Task 9** - Deployment Configuration (Webhook & Polling) (Deployment)
10. **Task 10** - Testing & Security Audit (Quality Assurance)

---

## Dependencies Between Tasks

- Task 2 depends on Task 1 (needs bot instance)
- Task 3 depends on Task 2 (needs Backend client)
- Task 4 depends on Task 2, 3 (needs Backend client and auth)
- Task 5 depends on Task 1 (needs bot instance)
- Task 6 depends on Task 1 (needs bot instance)
- Task 7 can be implemented alongside other tasks
- Task 8 can be implemented alongside other tasks
- Task 9 depends on Task 1 (needs bot instance)
- Task 10 depends on all previous tasks (testing phase)

---

## Notes & Decisions

### Architecture Decisions
- Using grammY framework for modern TypeScript support
- Static service token for Backend authentication (no per-user JWT)
- Centralized Backend client for all API calls
- Minimal client-side validation (Backend handles business logic)
- Webhook for production, polling for development

### Security Considerations
- Service token in Authorization Bearer header
- Internal endpoints protected with X-Bot-Secret header
- Optional IP allowlist for internal endpoints
- OTP codes never stored or logged
- Phone numbers masked in logs
- All sensitive data excluded from error messages

### User Experience
- All messages in Arabic
- Clear error messages for invalid input
- Confirmation messages only after Backend acknowledgment
- Interactive and shortcut modes for flexibility
- Fast response times with async operations

### Deployment Strategy
- Environment-based configuration (development/production)
- Webhook mode for production (efficient, scalable)
- Polling mode for local development (easy testing)
- Health check endpoint for monitoring
- Proper HTTPS/SSL configuration

### Communication Patterns
- Bot → Backend: Service token authentication
- Backend → Bot: Internal endpoints with secret token
- User identity passed via telegram_user_id in all requests
- No user-specific sessions or state in bot (stateless where possible)

---

**Last Review**: November 15, 2025  
**Next Review**: TBD

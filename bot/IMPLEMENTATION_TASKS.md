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
**Status**: [ ] Not Started  
**Priority**: Critical (Foundation)  
**Estimated Effort**: Small

### Description
Initialize the Node.js project with TypeScript and grammY framework. Set up project structure with proper folders (commands, middlewares, services, config). Configure environment variables for both development (polling) and production (webhook) modes. Implement the grammY bot instance with support for switching between polling and webhook based on NODE_ENV. Create basic bot startup logic and health check.

### Deliverables
- [ ] Node.js project initialization with package.json
- [ ] TypeScript configuration (tsconfig.json)
- [ ] grammY dependency installation
- [ ] Environment configuration (.env.example, env.ts)
- [ ] Project folder structure (commands/, middlewares/, services/, config/)
- [ ] Bot instance setup in bot.ts
- [ ] Main entry point (index.ts) with mode switching
- [ ] Polling mode implementation for development
- [ ] Webhook mode implementation for production
- [ ] Bot startup and shutdown handlers

### Acceptance Criteria
- Bot starts successfully in polling mode (development)
- Bot starts successfully in webhook mode (production)
- Environment variables properly loaded
- Bot responds to basic test messages
- Clean project structure established
- TypeScript compilation works without errors

### Notes
- Use `BOT_MODE` environment variable to switch between polling/webhook
- Test polling mode locally first
- Ensure webhook endpoint is HTTPS in production

---

## Task 2: Backend API Client & Service Token Authentication
**Status**: [ ] Not Started  
**Priority**: Critical  
**Estimated Effort**: Medium

### Description
Create a centralized Backend API client (backendClient.ts) that handles all communication with the Backend API using static service token authentication. Implement methods for authorization checks and transfer submission. Configure the service token to be sent in the Authorization Bearer header with every request. Add proper error handling for network failures, timeouts, and invalid responses. Ensure the client is reusable across all bot commands.

### Deliverables
- [ ] BackendClient class in services/backendClient.ts
- [ ] Service token authentication implementation (Bearer token)
- [ ] authorize(telegramUserId) method
- [ ] submitTransfer(telegramUserId, phone, amount) method
- [ ] Error handling for network failures
- [ ] Timeout configuration for API calls
- [ ] Response parsing and validation
- [ ] Environment configuration (BACKEND_API_URL, BOT_SERVICE_TOKEN)
- [ ] Singleton instance export

### Acceptance Criteria
- Service token sent in Authorization header
- Backend API successfully called with correct headers
- Authorization method returns allowed/denied status
- Transfer submission method sends correct payload
- Network errors handled gracefully
- Timeouts properly configured
- Client can be imported and used across commands

### Notes
- Never log the service token
- Use fetch API or axios for HTTP requests
- Consider adding retry logic for failed requests
- Validate response structure before returning

---

## Task 3: Authorization Middleware
**Status**: [ ] Not Started  
**Priority**: Critical  
**Estimated Effort**: Small

### Description
Implement authorization middleware that checks user permissions with the Backend before executing any command. Extract the Telegram user ID from the context, send it to Backend API for authorization verification, and block unauthorized users with an Arabic error message. Attach this middleware to all protected commands. Ensure the middleware is efficient and doesn't block the event loop.

### Deliverables
- [ ] Authorization middleware in middlewares/auth.ts
- [ ] Telegram user ID extraction from context
- [ ] Backend authorization API call
- [ ] Unauthorized user error message (Arabic)
- [ ] Middleware registration on bot instance
- [ ] Error handling for Backend API failures

### Acceptance Criteria
- Middleware extracts correct Telegram user ID
- Authorization check calls Backend API
- Unauthorized users receive Arabic error message
- Authorized users proceed to command handler
- Backend API failures handled gracefully
- Middleware doesn't block other users' requests

### Notes
- Error message: "عذراً، لا تملك صلاحية استخدام هذا البوت."
- Cache authorization results briefly to reduce API calls (optional)
- Log authorization attempts for security audit

---

## Task 4: /send Command (Interactive & Shortcut Modes)
**Status**: [ ] Not Started  
**Priority**: Critical  
**Estimated Effort**: Medium

### Description
Implement the /send command supporting both interactive mode (step-by-step prompts for phone and amount) and shortcut mode (/send <amount> <phone> in one line). For interactive mode, use grammY conversation/session management to collect phone and amount sequentially. For shortcut mode, parse command arguments and validate format. Perform basic client-side validation (digits only for phone, positive number for amount), then submit to Backend API. Display confirmation message only after Backend acknowledges receipt. Handle all error scenarios with clear Arabic messages.

### Deliverables
- [ ] /send command handler in commands/send.ts
- [ ] Interactive mode implementation (step-by-step prompts)
- [ ] Shortcut mode implementation (parse arguments)
- [ ] Phone number format validation (digits only)
- [ ] Amount format validation (positive number)
- [ ] Backend API submission via backendClient
- [ ] Success confirmation message (Arabic)
- [ ] Error messages for invalid format (Arabic)
- [ ] Error handling for Backend failures
- [ ] Session/conversation state management (if needed)

### Acceptance Criteria
- Interactive mode prompts for phone, then amount
- Shortcut mode parses /send <amount> <phone> correctly
- Invalid format shows: "يرجى استخدام الصيغة: /send <amount> <phone>"
- Valid requests submitted to Backend API
- Confirmation shown only after Backend acknowledgment: "تم استلام طلبك، وسيتم تنفيذ التحويل قريباً."
- Backend errors show: "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً."
- Both modes work correctly

### Notes
- Store Arabic messages in config/messages.ts
- Don't perform business validation (Backend handles this)
- Test both modes thoroughly
- Consider using grammY conversations plugin for interactive mode

---

## Task 5: /start Command & Welcome Message
**Status**: [ ] Not Started  
**Priority**: Medium  
**Estimated Effort**: Small

### Description
Implement the /start command to welcome new users and provide basic bot usage instructions in Arabic. Display available commands and brief descriptions. Keep the message simple and user-friendly. Optionally integrate with authorization middleware to only show instructions to authorized users.

### Deliverables
- [ ] /start command handler in commands/start.ts
- [ ] Welcome message in Arabic
- [ ] Usage instructions for /send command
- [ ] Optional: Authorization check before showing instructions

### Acceptance Criteria
- /start displays welcome message in Arabic
- Instructions explain how to use /send
- Message is clear and concise
- Unauthorized users receive authorization error (if middleware applied)

### Notes
- Keep welcome message short and friendly
- Consider showing examples: /send 50 0912345678
- Store message template in config/messages.ts

---

## Task 6: Internal Endpoints for Backend Callbacks
**Status**: [ ] Not Started  
**Priority**: Critical  
**Estimated Effort**: Medium

### Description
Create protected internal endpoints that the Backend can call to notify the bot of transfer results and deliver OTP codes. Implement two endpoints: one for transfer result notifications (success/failed) and one for OTP delivery. Secure these endpoints with a secret token header (X-Bot-Secret) and optional IP allowlist. When notified, send formatted messages to users via their Telegram user ID. Ensure OTP codes are never stored or logged.

### Deliverables
- [ ] Transfer result notification endpoint (POST /internal/notify-result)
- [ ] OTP delivery endpoint (POST /internal/send-otp)
- [ ] Secret token validation (X-Bot-Secret header)
- [ ] Optional IP allowlist validation
- [ ] Success message formatting (Arabic with ✅)
- [ ] Failure message formatting (Arabic with ❌)
- [ ] OTP message formatting (Arabic)
- [ ] User notification via Telegram API
- [ ] Error handling for invalid payloads
- [ ] Security logging (reject unauthorized attempts)

### Acceptance Criteria
- Endpoints only accept requests with valid X-Bot-Secret header
- Invalid token returns 403 Forbidden
- Transfer success sends: "✅ تم تنفيذ عملية التحويل (ID: {id}) بنجاح."
- Transfer failure sends: "❌ فشلت عملية التحويل (ID: {id}). السبب: {reason}"
- OTP delivery sends: "رمز التحقق الخاص بك هو: {code}"
- OTP codes are NEVER logged
- IP allowlist works if configured
- Unauthorized attempts are logged

### Notes
- Store secret token in INTERNAL_SECRET environment variable
- Message templates in config/messages.ts
- Mask phone numbers in notifications (091234****)
- Never store OTP codes in bot memory or logs

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

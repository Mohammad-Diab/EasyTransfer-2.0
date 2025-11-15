# EasyTransfer 2.0

A money transfer system featuring a Telegram bot interface, a web-based UI for users and administrators, and an Android app for executing USSD transfer requests.

## Overview

EasyTransfer 2.0 consists of:
- **Telegram Bot** - Frontend interface for making transfer requests
- **Web UI** - Dashboard for viewing transfers and system management
- **Android App** - USSD execution agent for processing transfers
- **Backend API** - Core business logic, authentication, and data management

The Telegram Bot and Web UI are **presentation layers**, while the Android App is an **execution agent**. All business logic, validation, permissions, and data management happen in the backend.

### Architecture Principles

- **Frontends = Display Only**: Receive input, show responses
- **Android App = Executor Only**: Execute USSD codes, report results
- **Backend = All Logic**: Validation, permissions, processing, statistics, OTP generation, business rules
- **Clear Separation**: Frontends and app never make business decisions or calculate data

## Features

### Telegram Bot
- 💬 Arabic language interface
- 📱 Easy access via Telegram
- 💸 Quick money transfer requests (`/send` command)
- 🔐 OTP verification delivery
- ✅ Real-time transfer status notifications

### Web UI
- 🌐 Arabic (RTL) interface with English digits
- 👤 User dashboard with personal transfer history
- 📊 Statistics cards (total, pending, successful, failed, processing)
- 🔍 Search and pagination for transfers
- 👨‍💼 Admin dashboard with system-wide statistics
- 👥 User management (activate/deactivate, create users)
- 🔒 Permission-based navigation

### Android App
- 📱 USSD execution agent for mobile operators
- 📞 Dual SIM support for multiple operators
- 🔐 Secure storage for USSD passwords and tokens
- ⚡ Real-time transfer instruction receiving (WebSocket/FCM)
- 🔄 Background execution with foreground service
- 📤 Automatic result reporting to backend
- 🛡️ Encrypted local storage for sensitive data

### Backend API
- 🧠 Core business logic and validation
- 🔐 JWT-based authentication for Web, Android, and Bot
- ⏱️ Business rules enforcement (5-min, 20-sec cooldowns)
- 📊 Statistics calculation and aggregation
- 📡 Operator detection based on phone prefixes
- 📱 One device per user enforcement
- 🔄 Transfer status lifecycle management
- 💾 PostgreSQL database with relational schema

### Shared
- 🔒 User authorization and permissions
- 🔐 Secure token-based authentication

## Technology Stack

### Backend API
- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Framework**: NestJS
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma with Repository Pattern
- **Architecture**: Modular Monolith
- **Authentication**: 
  - JWT (Web: 1 day, Android: 30 days)
  - Static service token (Telegram Bot)
- **Rate Limiting**: Database-only implementation
- **Key Features**: Business rules enforcement, OTP generation, operator detection, status lifecycle management

### Telegram Bot
- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Framework**: grammY
- **Deployment**:
  - Development: Long Polling
  - Production: Webhook (HTTPS)
- **API Client**: Centralized `backendClient.ts`
- **Authentication**: Static service token
- **Key Features**: Transfer commands, OTP delivery, status notifications

### Web UI
- **Language**: TypeScript
- **Framework**: Next.js 14+ (App Router)
- **React**: React 18+
- **Styling**: Tailwind CSS
- **Component Library**: Ant Design (RTL support)
- **State Management**: TanStack Query (React Query)
- **Authentication**: JWT in httpOnly Cookies
- **Language**: Arabic (RTL) with English digits
- **Key Features**: Permission-based navigation, user dashboard, admin management

### Android App
- **Language**: Kotlin
- **Architecture**: MVVM (Model-View-ViewModel)
- **Minimum SDK**: Android 6.0 (API 23)
- **Target SDK**: Android 14 (API 34)
- **Networking**: Retrofit 2 + OkHttp
- **USSD Execution**: Telephony Intent + Accessibility Service
- **Background**: Foreground Service + WorkManager
- **Security**: EncryptedSharedPreferences + Android Keystore
- **Polling**: Short polling (3-5 seconds)
- **Key Features**: Dual SIM support, secure password storage, USSD result parsing

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- Backend API endpoint

### Installation

```bash
# Clone the repository
git clone https://github.com/Mohammad-Diab/EasyTransfer-2.0.git
cd EasyTransfer-2.0

# Install dependencies (when bot implementation is added)
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Configuration

Required environment variables:

**Telegram Bot:**
```env
BOT_TOKEN=<your_telegram_bot_token>
BACKEND_API_URL=https://api.easytransfer.com
INTERNAL_SECRET=<random_secret_key>
NODE_ENV=development
BOT_MODE=polling
```

**Web UI:**
```env
REACT_APP_API_URL=https://api.easytransfer.com
# or VUE_APP_API_URL / NEXT_PUBLIC_API_URL depending on framework
```

**Android App:**
- Server URL configured on first launch
- SIM-to-operator mapping configured post-login
- USSD password stored in encrypted storage

## User Commands

### Telegram Bot - `/send` Command

**Interactive Mode:**
```
/send
→ Bot asks for phone number
→ Bot asks for amount
→ Confirms receipt
```

**Shortcut Mode:**
```
/send <amount> <phone>
Example: /send 50 0912345678
```

### Web UI Pages

**User:**
- **My Transfers** - View personal transfer history and statistics

**Admin:**
- **My Transfers** - View personal transfer history (same as user)
- **System Dashboard / Users** - View system-wide stats and manage users

### Android App Features

**Setup:**
1. Configure server URL on first launch
2. Login with phone number + OTP (sent via Telegram)
3. Map SIM slots to operators (SIM1: Syriatel, SIM2: MTN)
4. Store USSD password securely

**Execution:**
- Receives transfer instructions from backend in real-time
- Executes USSD codes on the correct SIM automatically
- Reports execution results back to backend
- Runs in background with foreground service

## Documentation

- 📋 [Telegram Bot Specification](docs/telegram-bot-spec.md) - Complete bot technical specification
- 🌐 [Web UI Specification](docs/web-ui-spec.md) - Complete Web UI requirements
- 📱 [Android App Specification](docs/android-app-spec.md) - Complete Android app technical specification
- 💾 [Backend API Specification](docs/backend-spec.md) - Complete backend API and database specification
- 🤖 [AI Agent Instructions](.github/copilot-instructions.md) - Guidelines for AI coding assistants

## Security

### Telegram Bot
- Internal endpoints require secret token authentication
- Optional IP allowlist for backend communication
- No sensitive data logging (OTPs, passwords, etc.)
- User authorization checks on every action

### Web UI
- JWT token-based authentication
- Permission-based route guards
- All data fetched from backend (no client-side calculations)
- Secure API communication

### Android App
- EncryptedSharedPreferences for USSD passwords and tokens
- HTTPS-only communication with backend
- No sensitive data in logs (passwords, tokens, full USSD codes)
- Secure local storage using Android Keystore
- Single device per user enforcement (backend)

## Development

### Telegram Bot - Local Testing

```bash
# Run in polling mode for local development
cd bot
npm run dev
```

### Web UI - Local Development

```bash
# Run development server
cd web
npm run dev
# or npm start, depending on framework
```

### Production Deployment

**Telegram Bot:**
```bash
# Use webhook mode in production
npm start
```

**Web UI:**
```bash
# Build for production
npm run build
```

**Android App:**
```bash
# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease
```

## Project Structure

```
EasyTransfer-2.0/
├── .github/
│   └── copilot-instructions.md    # AI agent guidelines
├── docs/
│   ├── telegram-bot-spec.md       # Bot specification
│   ├── web-ui-spec.md             # Web UI specification
│   ├── android-app-spec.md        # Android app specification
│   └── backend-spec.md            # Backend API specification
├── bot/                            # Telegram bot (Node.js)
│   ├── src/
│   │   ├── bot/                    # Bot handlers
│   │   ├── api/                    # Backend API client
│   │   └── utils/                  # Utilities
│   ├── .env.example
│   └── package.json
├── web/                            # Web UI (React/Vue/Angular)
│   ├── src/
│   │   ├── components/             # UI components
│   │   ├── pages/                  # Page components
│   │   ├── api/                    # API client
│   │   └── utils/                  # Utilities
│   ├── .env.example
│   └── package.json
├── android/                        # Android app (Kotlin)
│   ├── app/
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── java/           # Kotlin source files
│   │   │   │   ├── res/            # Resources
│   │   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   └── build.gradle
├── backend/                        # Backend API (Node.js)
│   ├── src/
│   │   ├── config/             # Configuration
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Auth, validation
│   │   ├── models/             # Database models
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   └── index.js            # Entry point
│   ├── migrations/             # DB migrations
│   ├── .env.example
│   └── package.json
├── .env.example                    # Environment template
└── README.md
```

## API Integration

### Backend Endpoints

**Authentication:**
- `POST /auth/request-otp` - Request OTP for login (Web/Android)
- `POST /auth/verify-otp` - Verify OTP and get JWT token
- `POST /auth/android/request-otp` - Android-specific OTP request
- `POST /auth/android/verify-otp` - Android OTP verification with device binding

**Bot Endpoints (Bot → Backend):**
- `POST /api/bot/authorize` - Check user permissions
- `POST /api/bot/transfers` - Submit transfer request

**User Endpoints (Web UI → Backend):**
- `GET /api/user/transfers/stats` - User transfer statistics
- `GET /api/user/transfers` - User transfers list (paginated)

**Admin Endpoints (Web UI → Backend):**
- `GET /api/admin/system/stats` - System-wide statistics
- `GET /api/admin/users` - All users (paginated)
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/{id}/status` - Activate/Deactivate user

**Android App Endpoints:**
- `POST /api/android/auth/request-otp` - Request OTP for login
- `POST /api/android/auth/verify-otp` - Verify OTP and get access token
- `GET /api/android/transfers/pending` - Get pending transfers (polling)
- `WebSocket /api/android/transfers/stream` - Real-time transfer stream
- `POST /api/android/transfers/result` - Report USSD execution result

**Bot Internal Endpoints (Backend → Bot):**
- `POST /internal/notify-result` - Send transfer result to user
- `POST /internal/send-otp` - Deliver OTP code to user

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Mohammad Diab**

## Support

For issues, questions, or contributions, please open an issue in the GitHub repository.
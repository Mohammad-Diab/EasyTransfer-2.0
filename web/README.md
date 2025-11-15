# EasyTransfer 2.0 - Web UI

Web-based user interface built with Next.js for EasyTransfer 2.0 money transfer system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env.local
# Edit .env.local with your backend API URL
```

## Development

```bash
# Start development server on port 3001
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Build

```bash
# Production build
npm run build

# Start production server
npm start
```

## Features

- 🌐 Arabic RTL interface
- 📊 User dashboard with transfer statistics
- 👨‍💼 Admin dashboard for system management
- 🔍 Search and pagination
- 📱 Responsive design
- 🔒 httpOnly Cookie authentication

## Pages

- `/login` - Login page
- `/transfers` - User transfers page
- `/admin/dashboard` - Admin system dashboard
- `/admin/users` - Admin users management

## Documentation

See `docs/web-ui-spec.md` for complete specification.

# EasyTransfer 2.0 - Backend API

Backend API built with NestJS for EasyTransfer 2.0 money transfer system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Setup database:
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database
npm run prisma:seed
```

## Development

```bash
# Start in development mode
npm run start:dev

# Watch mode
npm run start:watch
```

## Database Management

```bash
# Prisma Studio (GUI)
npm run prisma:studio

# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset
```

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Build

```bash
# Production build
npm run build

# Run production
npm run start:prod
```

## API Documentation

See `docs/backend-spec.md` for complete API specification.

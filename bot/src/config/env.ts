import 'dotenv/config';

export const config = {
  botToken: process.env.BOT_TOKEN!,
  botMode: process.env.BOT_MODE || 'polling',
  webhookUrl: process.env.WEBHOOK_URL || '',
  backendApiUrl: process.env.BACKEND_API_URL || 'http://localhost:3000',
  botServiceToken: process.env.BOT_SERVICE_TOKEN!,
  internalSecret: process.env.INTERNAL_SECRET!,
  internalPort: parseInt(process.env.INTERNAL_PORT || '3100', 10),
  allowedIps: process.env.ALLOWED_IPS?.split(',') || [],
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

// Validate required environment variables
function validateEnv() {
  const required = ['BOT_TOKEN', 'BOT_SERVICE_TOKEN', 'INTERNAL_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  if (config.botMode === 'webhook' && !config.webhookUrl) {
    throw new Error('WEBHOOK_URL is required when BOT_MODE=webhook');
  }
}

validateEnv();

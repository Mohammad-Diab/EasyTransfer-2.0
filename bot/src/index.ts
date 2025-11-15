import 'dotenv/config';
import { Bot } from 'grammy';
import { setupCommands } from './commands';
import { authMiddleware } from './middlewares/auth';
import { backendClient } from './services/backendClient';

const bot = new Bot(process.env.BOT_TOKEN!);

// Apply middleware
bot.use(authMiddleware);

// Setup commands
setupCommands(bot);

// Start bot
const mode = process.env.BOT_MODE || 'polling';

if (mode === 'webhook') {
  // Webhook mode for production
  const webhookUrl = process.env.WEBHOOK_URL!;
  bot.api.setWebhook(webhookUrl).then(() => {
    console.log(`🤖 Bot webhook set to: ${webhookUrl}`);
  });
} else {
  // Polling mode for development
  bot.start({
    onStart: () => {
      console.log('🤖 Bot started in polling mode');
    },
  });
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());

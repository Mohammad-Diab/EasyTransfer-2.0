import { Bot } from 'grammy';
import { config } from './config/env';
import { setupCommands } from './commands';
import { authMiddleware } from './middlewares/auth';

const bot = new Bot(config.botToken);

// Apply middleware
bot.use(authMiddleware);

// Setup commands
setupCommands(bot);

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Start bot
async function startBot() {
  try {
    if (config.botMode === 'webhook') {
      // Webhook mode for production
      await bot.api.setWebhook(config.webhookUrl);
      console.log('✅ Bot started successfully in webhook mode');
      console.log(`🔗 Webhook URL: ${config.webhookUrl}`);
    } else {
      // Polling mode for development
      console.log('🤖 Starting bot in polling mode...');
      await bot.start({
        onStart: async (botInfo) => {
          console.log('✅ Bot started successfully in polling mode');
          console.log(`🤖 Bot username: @${botInfo.username}`);
          console.log(`🔗 Connected to backend: ${config.backendApiUrl}`);
        },
      });
    }
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n⏹️  Stopping bot...');
  bot.stop();
});

process.once('SIGTERM', () => {
  console.log('\n⏹️  Stopping bot...');
  bot.stop();
});

// Start the bot
startBot();

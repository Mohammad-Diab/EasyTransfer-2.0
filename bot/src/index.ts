import { Bot, Context, session, type SessionFlavor } from 'grammy';
import { conversations, createConversation, type ConversationFlavor } from '@grammyjs/conversations';
import { config } from './config/env';
import { setupCommands } from './commands';
import { authMiddleware } from './middlewares/auth';
import { sendConversation } from './commands/send';
import { startInternalServer } from './server/internal';
import { logger } from './utils/logger';

// Session data structure (empty for now)
interface SessionData {}

// Define bot context type with session and conversation support  
type BaseContext = Context & SessionFlavor<SessionData>;
export type MyContext = BaseContext & ConversationFlavor<BaseContext>;

const bot = new Bot<MyContext>(config.botToken);

// Session middleware (required for conversations)
bot.use(session({ initial: () => ({}) }));

// Conversations middleware
bot.use(conversations());

// Register conversations
bot.use(createConversation(sendConversation));

// Apply authorization middleware
bot.use(authMiddleware);

// Setup commands
setupCommands(bot);

// Error handler
bot.catch((err) => {
  const ctx = err.ctx;
  const error = err.error;
  logger.error('Bot error', error, {
    update_type: ctx.update.update_id,
    user_id: ctx.from?.id,
  });
});

// Start bot
async function startBot() {
  try {
    // Start internal server for backend callbacks
    startInternalServer(bot);

    if (config.botMode === 'webhook') {
      // Webhook mode for production
      await bot.api.setWebhook(config.webhookUrl);
      logger.info('Bot started in webhook mode', {
        webhook_url: config.webhookUrl,
      });
    } else {
      // Polling mode for development
      logger.info('Starting bot in polling mode...');
      await bot.start({
        onStart: async (botInfo) => {
          logger.info('Bot started in polling mode', {
            bot_username: botInfo.username,
            backend_url: config.backendApiUrl,
          });
        },
      });
    }
  } catch (error) {
    logger.error('Failed to start bot', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.once('SIGINT', () => {
  logger.info('Stopping bot (SIGINT)');
  bot.stop();
});

process.once('SIGTERM', () => {
  logger.info('Stopping bot (SIGTERM)');
  bot.stop();
});

// Start the bot
startBot();

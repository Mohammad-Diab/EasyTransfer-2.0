import express, { Request, Response, NextFunction } from 'express';
import { Bot, webhookCallback } from 'grammy';
import { config } from '../config/env';
import { MESSAGES } from '../config/messages';
import type { MyContext } from '../index';
import { logger } from '../utils/logger';

const app = express();

// Parse JSON bodies
app.use(express.json());

// Security middleware: Validate X-Bot-Secret header
function validateSecret(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-bot-secret'];

  if (secret !== config.internalSecret) {
    logger.securityEvent('Unauthorized internal endpoint access', {
      ip: req.ip,
      endpoint: req.path,
    });
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Optional: IP allowlist validation
  if (config.allowedIps.length > 0) {
    const clientIp = req.ip || req.socket.remoteAddress || '';
    if (!config.allowedIps.includes(clientIp)) {
      logger.securityEvent('IP not in allowlist', {
        ip: clientIp,
        endpoint: req.path,
      });
      return res.status(403).json({ error: 'IP not allowed' });
    }
  }

  next();
}

// Apply security middleware to all /internal routes
app.use('/internal', validateSecret);

// POST /internal/notify-result - Transfer result notification
app.post('/internal/notify-result', async (req: Request, res: Response) => {
  try {
    const { telegram_user_id, transfer_id, status, reason, amount, recipient_phone } = req.body;

    // Validate payload
    if (!telegram_user_id || !transfer_id || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get bot instance from global
    const bot: Bot<MyContext> = (global as any).botInstance;
    if (!bot) {
      console.error('❌ Bot instance not available');
      return res.status(500).json({ error: 'Bot not initialized' });
    }

    // Format message based on status
    let message: string;
    if (status === 'success') {
      message = MESSAGES.TRANSFER_SUCCESS(amount, recipient_phone);
    } else if (status === 'failed') {
      message = MESSAGES.TRANSFER_FAILED(transfer_id, reason || 'غير معروف');
    } else {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Send notification to user
    await bot.api.sendMessage(telegram_user_id, message);

    logger.notificationSent('transfer', telegram_user_id, {
      transfer_id,
      status,
    });

    res.json({ success: true, message: 'Notification sent' });
  } catch (error: any) {
    logger.error('Error sending transfer notification', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// POST /internal/send-otp - OTP delivery
app.post('/internal/send-otp', async (req: Request, res: Response) => {
  try {
    const { telegram_user_id, code } = req.body;

    // Validate payload
    if (!telegram_user_id || !code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get bot instance from global
    const bot: Bot<MyContext> = (global as any).botInstance;
    if (!bot) {
      logger.error('Bot instance not available in send-otp endpoint');
      return res.status(500).json({ error: 'Bot not initialized' });
    }

    // Send OTP to user (NEVER log the code)
    const message = MESSAGES.OTP_CODE(code);
    const sentMessage = await bot.api.sendMessage(telegram_user_id, message, {
      parse_mode: 'HTML',
    });

    // Auto-delete OTP message after 5 minutes for security
    setTimeout(async () => {
      try {
        await bot.api.deleteMessage(telegram_user_id, sentMessage.message_id);
        logger.info(`OTP message deleted for user ${telegram_user_id}`);
      } catch (error) {
        // Message might already be deleted by user - not critical
        logger.info(`Could not delete OTP message for user ${telegram_user_id} (may be already deleted)`);
      }
    }, 5 * 60 * 1000); // 5 minutes

    logger.notificationSent('otp', telegram_user_id);
    // IMPORTANT: Do NOT log the actual code

    res.json({ success: true, message: 'OTP sent' });
  } catch (error: any) {
    logger.error('Error sending OTP', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /internal/notify-balance - Balance inquiry result notification
app.post('/internal/notify-balance', async (req: Request, res: Response) => {
  try {
    const { telegram_user_id, status, message } = req.body;

    // Validate payload
    if (!telegram_user_id || !status || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get bot instance from global
    const bot: Bot<MyContext> = (global as any).botInstance;
    if (!bot) {
      logger.error('Bot instance not available in notify-balance endpoint');
      return res.status(500).json({ error: 'Bot not initialized' });
    }

    // Format message based on status
    let notificationMessage: string;
    if (status === 'success') {
      notificationMessage = MESSAGES.BALANCE_SUCCESS(message);
    } else if (status === 'failed') {
      notificationMessage = MESSAGES.BALANCE_FAILED(message);
    } else if (status === 'timeout') {
      notificationMessage = MESSAGES.BALANCE_TIMEOUT;
    } else {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Send notification to user
    await bot.api.sendMessage(telegram_user_id, notificationMessage);

    logger.notificationSent('balance', telegram_user_id, { status });

    res.json({ success: true, message: 'Balance notification sent' });
  } catch (error: any) {
    logger.error('Error sending balance notification', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Health check endpoint (no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'bot-internal-server' });
});

// Start internal server
export function startInternalServer(bot: Bot<MyContext>) {
  // Store bot instance globally for endpoint access
  (global as any).botInstance = bot;

  // Webhook endpoint for Telegram (only in webhook mode)
  if (config.botMode === 'webhook') {
    app.post('/bot/webhook', webhookCallback(bot, 'express'));
    logger.info('Webhook endpoint registered', { path: '/bot/webhook' });
  }

  app.listen(config.internalPort, () => {
    logger.info('Internal server started', {
      port: config.internalPort,
      endpoints: ['/internal/notify-result', '/internal/send-otp', '/internal/notify-balance', '/bot/webhook'],
    });
  });
}

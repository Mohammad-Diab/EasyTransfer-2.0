import express, { Request, Response, NextFunction } from 'express';
import { Bot } from 'grammy';
import { config } from '../config/env';
import { MESSAGES } from '../config/messages';
import type { MyContext } from '../index';

const app = express();

// Parse JSON bodies
app.use(express.json());

// Security middleware: Validate X-Bot-Secret header
function validateSecret(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-bot-secret'];

  if (secret !== config.internalSecret) {
    console.warn('⚠️  Unauthorized internal endpoint access attempt', {
      ip: req.ip,
      endpoint: req.path,
      timestamp: new Date().toISOString(),
    });
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Optional: IP allowlist validation
  if (config.allowedIps.length > 0) {
    const clientIp = req.ip || req.socket.remoteAddress || '';
    if (!config.allowedIps.includes(clientIp)) {
      console.warn('⚠️  IP not in allowlist', {
        ip: clientIp,
        endpoint: req.path,
        timestamp: new Date().toISOString(),
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
    const { telegram_user_id, transfer_id, status, reason } = req.body;

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
      message = MESSAGES.TRANSFER_SUCCESS(transfer_id);
    } else if (status === 'failed') {
      message = MESSAGES.TRANSFER_FAILED(transfer_id, reason || 'غير معروف');
    } else {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Send notification to user
    await bot.api.sendMessage(telegram_user_id, message);

    console.log(`✅ Transfer result notification sent to user ${telegram_user_id}`, {
      transfer_id,
      status,
    });

    res.json({ success: true, message: 'Notification sent' });
  } catch (error: any) {
    console.error('❌ Error sending transfer notification:', error.message);
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
      console.error('❌ Bot instance not available');
      return res.status(500).json({ error: 'Bot not initialized' });
    }

    // Send OTP to user (NEVER log the code)
    const message = MESSAGES.OTP_CODE(code);
    await bot.api.sendMessage(telegram_user_id, message);

    console.log(`✅ OTP delivered to user ${telegram_user_id}`);
    // IMPORTANT: Do NOT log the actual code

    res.json({ success: true, message: 'OTP sent' });
  } catch (error: any) {
    console.error('❌ Error sending OTP:', error.message);
    res.status(500).json({ error: 'Failed to send OTP' });
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

  app.listen(config.internalPort, () => {
    console.log(`🔒 Internal server listening on port ${config.internalPort}`);
    console.log(`📍 Endpoints: POST /internal/notify-result, POST /internal/send-otp`);
  });
}

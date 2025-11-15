import { Context, NextFunction } from 'grammy';
import { backendClient } from '../services/backendClient';
import { MESSAGES } from '../config/messages';
import { logger } from '../utils/logger';

export async function authMiddleware(ctx: Context, next: NextFunction) {
  const userId = ctx.from?.id;

  if (!userId) {
    return;
  }

  // Skip authorization for /start command
  if (ctx.message?.text?.startsWith('/start')) {
    return next();
  }

  // Check authorization with backend
  try {
    const auth = await backendClient.authorize(userId);

    if (!auth.allowed) {
      return ctx.reply(MESSAGES.UNAUTHORIZED);
    }

    // User is authorized, proceed
    return next();
  } catch (error) {
    console.error('Authorization error:', error);
    return ctx.reply(MESSAGES.BACKEND_ERROR);
  }
}

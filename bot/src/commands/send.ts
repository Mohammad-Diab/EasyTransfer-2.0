import { CommandContext, Context } from 'grammy';
import { backendClient } from '../services/backendClient';
import { MESSAGES } from '../config/messages';

export async function sendCommand(ctx: CommandContext<Context>) {
  const userId = ctx.from?.id;
  if (!userId) {
    return ctx.reply(MESSAGES.ERROR);
  }

  // Parse command arguments
  const args = ctx.match?.toString().trim().split(/\s+/) || [];

  if (args.length === 2) {
    // Shortcut mode: /send <amount> <phone>
    const [amount, phone] = args;

    // Basic format validation
    if (!isValidAmount(amount) || !isValidPhone(phone)) {
      return ctx.reply(MESSAGES.INVALID_FORMAT);
    }

    // Submit to backend
    try {
      const response = await backendClient.submitTransfer(
        userId,
        phone,
        parseInt(amount),
      );

      if (response.success) {
        await ctx.reply(MESSAGES.REQUEST_RECEIVED);
      } else {
        await ctx.reply(response.error || MESSAGES.BACKEND_ERROR);
      }
    } catch (error) {
      await ctx.reply(MESSAGES.BACKEND_ERROR);
    }
  } else if (args.length === 0) {
    // Interactive mode: ask for phone
    await ctx.reply('يرجى إدخال رقم الهاتف المستلم:');
    // TODO: Implement conversation state management for interactive mode
  } else {
    await ctx.reply(MESSAGES.INVALID_FORMAT);
  }
}

function isValidAmount(amount: string): boolean {
  const num = parseInt(amount);
  return !isNaN(num) && num > 0;
}

function isValidPhone(phone: string): boolean {
  return /^\d+$/.test(phone) && phone.length >= 9;
}

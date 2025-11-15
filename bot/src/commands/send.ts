import type { Conversation } from '@grammyjs/conversations';
import { CommandContext } from 'grammy';
import { backendClient } from '../services/backendClient';
import { MESSAGES } from '../config/messages';
import type { MyContext } from '../index';

// Validation helpers
function isValidAmount(amount: string): boolean {
  const num = parseInt(amount);
  return !isNaN(num) && num > 0;
}

function isValidPhone(phone: string): boolean {
  return /^\d+$/.test(phone) && phone.length >= 9;
}

// Interactive conversation flow
export async function sendConversation(conversation: Conversation<MyContext, MyContext>, ctx: MyContext) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply(MESSAGES.ERROR);
    return;
  }

  // Ask for phone number
  await ctx.reply(MESSAGES.ASK_PHONE);
  const phoneCtx = await conversation.wait();
  const phone = phoneCtx.message?.text?.trim() || '';

  // Validate phone
  if (!isValidPhone(phone)) {
    await ctx.reply(MESSAGES.INVALID_PHONE);
    return;
  }

  // Ask for amount
  await ctx.reply(MESSAGES.ASK_AMOUNT);
  const amountCtx = await conversation.wait();
  const amountStr = amountCtx.message?.text?.trim() || '';

  // Validate amount
  if (!isValidAmount(amountStr)) {
    await ctx.reply(MESSAGES.INVALID_AMOUNT);
    return;
  }

  const amount = parseInt(amountStr);

  // Submit to backend
  try {
    const response = await backendClient.submitTransfer(userId, phone, amount);

    if (response.id && response.status) {
      await ctx.reply(MESSAGES.REQUEST_RECEIVED);
    } else {
      await ctx.reply(MESSAGES.BACKEND_ERROR);
    }
  } catch (error) {
    console.error('Send conversation error:', error);
    await ctx.reply(MESSAGES.BACKEND_ERROR);
  }
}

// Shortcut mode command handler
export async function sendCommand(ctx: CommandContext<MyContext>) {
  const userId = ctx.from?.id;
  if (!userId) {
    return ctx.reply(MESSAGES.ERROR);
  }

  // Parse command arguments
  const args = ctx.match?.toString().trim().split(/\s+/) || [];

  if (args.length === 2) {
    // Shortcut mode: /send <amount> <phone>
    const [amountStr, phone] = args;

    // Basic format validation
    if (!isValidAmount(amountStr)) {
      return ctx.reply(MESSAGES.INVALID_AMOUNT);
    }

    if (!isValidPhone(phone)) {
      return ctx.reply(MESSAGES.INVALID_PHONE);
    }

    const amount = parseInt(amountStr);

    // Submit to backend
    try {
      const response = await backendClient.submitTransfer(userId, phone, amount);

      if (response.id && response.status) {
        await ctx.reply(MESSAGES.REQUEST_RECEIVED);
      } else {
        await ctx.reply(MESSAGES.BACKEND_ERROR);
      }
    } catch (error) {
      console.error('Send command error:', error);
      await ctx.reply(MESSAGES.BACKEND_ERROR);
    }
  } else if (args.length === 0) {
    // Interactive mode: enter conversation
    await ctx.conversation.enter('sendConversation');
  } else {
    await ctx.reply(MESSAGES.INVALID_FORMAT);
  }
}

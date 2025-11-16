import type { Conversation } from '@grammyjs/conversations';
import { CommandContext, InlineKeyboard } from 'grammy';
import { backendClient } from '../services/backendClient';
import { MESSAGES } from '../config/messages';
import type { MyContext } from '../index';
import { logger } from '../utils/logger';

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

  const requestedAmount = parseInt(amountStr);

  // Validate tier
  try {
    const tierValidation = await backendClient.validateAmount(requestedAmount);

    if (!tierValidation.valid) {
      await ctx.reply(MESSAGES.INVALID_TIER);
      return;
    }

    const finalAmount = tierValidation.matchedTier || requestedAmount;

    // Create confirmation keyboard
    const keyboard = new InlineKeyboard()
      .text('نعم، متابعة', `confirm_${finalAmount}_${phone}`)
      .text('إلغاء', 'cancel_transfer');

    // Send confirmation message
    const confirmMessage = requestedAmount === finalAmount
      ? MESSAGES.CONFIRM_TRANSFER(finalAmount, phone)
      : MESSAGES.ADJUSTED_AMOUNT(requestedAmount, finalAmount, phone);

    await ctx.reply(confirmMessage, { reply_markup: keyboard });

    // Wait for confirmation
    const confirmCtx = await conversation.wait();

    // Check if user clicked button
    if (confirmCtx.callbackQuery?.data?.startsWith('confirm_')) {
      await confirmCtx.answerCallbackQuery();

      // Submit to backend
      const response = await backendClient.submitTransfer(userId, phone, finalAmount);

      if (response.id && response.status) {
        await ctx.reply(MESSAGES.REQUEST_RECEIVED);
      } else {
        await ctx.reply(MESSAGES.BACKEND_ERROR);
      }
    } else if (confirmCtx.callbackQuery?.data === 'cancel_transfer') {
      await confirmCtx.answerCallbackQuery();
      await ctx.reply(MESSAGES.TRANSFER_CANCELLED);
    } else {
      await ctx.reply(MESSAGES.TRANSFER_CANCELLED);
    }
  } catch (error) {
    logger.error('Send conversation error', error, { user_id: userId });
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
  const text = ctx.match?.toString().trim() || '';
  const args = text ? text.split(/\s+/) : [];

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

    // Validate tier and submit
    try {
      const tierValidation = await backendClient.validateAmount(amount);

      if (!tierValidation.valid) {
        return ctx.reply(MESSAGES.INVALID_TIER);
      }

      const finalAmount = tierValidation.matchedTier || amount;

      // Submit to backend with validated amount
      const response = await backendClient.submitTransfer(userId, phone, finalAmount);

      if (response.id && response.status) {
        // Inform user if amount was adjusted
        if (amount !== finalAmount) {
          await ctx.reply(
            `تم تعديل المبلغ من ${amount} إلى ${finalAmount}\n\n${MESSAGES.REQUEST_RECEIVED}`
          );
        } else {
          await ctx.reply(MESSAGES.REQUEST_RECEIVED);
        }
      } else {
        await ctx.reply(MESSAGES.BACKEND_ERROR);
      }
    } catch (error) {
      logger.error('Send command error', error, { user_id: userId });
      await ctx.reply(MESSAGES.BACKEND_ERROR);
    }
  } else if (args.length === 0) {
    // Interactive mode: enter conversation
    await ctx.conversation.enter('sendConversation');
  } else {
    await ctx.reply(MESSAGES.INVALID_FORMAT);
  }
}

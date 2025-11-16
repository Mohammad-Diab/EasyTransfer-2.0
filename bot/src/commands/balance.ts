import { InlineKeyboard } from 'grammy';
import type { MyContext } from '../index';
import { backendClient } from '../services/backendClient';
import { logger } from '../utils/logger';

export async function balanceCommand(ctx: MyContext) {
  logger.command('/balance', ctx.from?.id || 0);

  const keyboard = new InlineKeyboard()
    .text('Syriatel', 'balance_syriatel')
    .text('MTN', 'balance_mtn');

  await ctx.reply('يرجى اختيار المشغّل للاستعلام عن الرصيد:', {
    reply_markup: keyboard,
  });
}

export async function handleBalanceCallback(ctx: MyContext) {
  if (!ctx.callbackQuery?.data) return;

  const operator = ctx.callbackQuery.data.replace('balance_', '') as
    | 'syriatel'
    | 'mtn';

  try {
    await backendClient.submitBalanceJob(ctx.from?.id || 0, operator);
    await ctx.answerCallbackQuery();
    await ctx.reply('⏳ يتم الآن الاستعلام عن الرصيد… يرجى الانتظار.');

    logger.info('Balance job submitted', {
      user_id: ctx.from?.id,
      operator,
    });
  } catch (error: any) {
    await ctx.answerCallbackQuery();
    await ctx.reply('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً.');

    logger.error('Balance job submission error', error, {
      user_id: ctx.from?.id,
      operator,
    });
  }
}

import { Bot } from 'grammy';
import { config } from '../config/env';

export function healthCommand(bot: Bot) {
  bot.command('health', async (ctx) => {
    const botInfo = await ctx.api.getMe();
    const status = {
      bot: `@${botInfo.username}`,
      mode: config.botMode,
      backend: config.backendApiUrl,
      status: '✅ Online',
      uptime: process.uptime(),
    };

    await ctx.reply(
      `🤖 *Bot Status*\n\n` +
        `Bot: ${status.bot}\n` +
        `Mode: ${status.mode}\n` +
        `Backend: ${status.backend}\n` +
        `Status: ${status.status}\n` +
        `Uptime: ${Math.floor(status.uptime)}s`,
      { parse_mode: 'Markdown' }
    );
  });
}

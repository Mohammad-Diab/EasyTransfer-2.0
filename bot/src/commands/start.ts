import { CommandContext } from 'grammy';
import { MESSAGES } from '../config/messages';
import type { MyContext } from '../index';

export async function startCommand(ctx: CommandContext<MyContext>) {
  const user = ctx.from;
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
  const username = user?.username ? `@${user.username}` : '-';
  const telegramId = user?.id || 0;
  
  await ctx.reply(
    MESSAGES.START_WITH_USER_INFO(name, username, telegramId)
  );
}

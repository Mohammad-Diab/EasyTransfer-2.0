import { CommandContext } from 'grammy';
import { MESSAGES } from '../config/messages';
import type { MyContext } from '../index';

export async function startCommand(ctx: CommandContext<MyContext>) {
  await ctx.reply(MESSAGES.WELCOME, { parse_mode: 'Markdown' });
}

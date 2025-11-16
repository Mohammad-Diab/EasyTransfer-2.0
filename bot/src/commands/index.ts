import { Bot } from 'grammy';
import { startCommand } from './start';
import { sendCommand } from './send';
import { healthCommand } from './health';
import { balanceCommand, handleBalanceCallback } from './balance';
import type { MyContext } from '../index';

export function setupCommands(bot: Bot<MyContext>) {
  bot.command('start', startCommand);
  bot.command('send', sendCommand);
  bot.command('balance', balanceCommand);
  bot.command('health', healthCommand);
  
  // Handle balance operator selection callbacks
  bot.callbackQuery(/^balance_/, handleBalanceCallback);
}

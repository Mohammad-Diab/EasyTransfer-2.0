import { Bot } from 'grammy';
import { startCommand } from './start';
import { sendCommand } from './send';
import { healthCommand } from './health';
import type { MyContext } from '../index';

export function setupCommands(bot: Bot<MyContext>) {
  bot.command('start', startCommand);
  bot.command('send', sendCommand);
  
  // Admin/Debug commands
  healthCommand(bot);
}

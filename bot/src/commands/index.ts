import { Bot } from 'grammy';
import { startCommand } from './start';
import { sendCommand } from './send';
import { healthCommand } from './health';

export function setupCommands(bot: Bot) {
  bot.command('start', startCommand);
  bot.command('send', sendCommand);
  
  // Admin/Debug commands
  healthCommand(bot);
}

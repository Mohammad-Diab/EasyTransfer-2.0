import { Bot } from 'grammy';
import { startCommand } from './start';
import { sendCommand } from './send';

export function setupCommands(bot: Bot) {
  bot.command('start', startCommand);
  bot.command('send', sendCommand);
}

import { CommandContext, Context } from 'grammy';

export async function startCommand(ctx: CommandContext<Context>) {
  const welcomeMessage = `
مرحباً بك في EasyTransfer 2.0! 👋

لإرسال تحويل، استخدم الأمر:
/send

أو استخدم الاختصار:
/send <amount> <phone>

مثال:
/send 1000 0912345678
  `.trim();

  await ctx.reply(welcomeMessage);
}

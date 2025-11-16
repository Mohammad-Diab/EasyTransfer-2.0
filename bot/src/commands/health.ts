import type { MyContext } from '../index';
import { config } from '../config/env';
import { backendClient } from '../services/backendClient';

export async function healthCommand(ctx: MyContext) {
  const botInfo = await ctx.api.getMe();
  
  let backendStatus = '❌ غير متصل';
  let devicesInfo = '❌ لا توجد أجهزة متصلة';
  let backendDetails = '';

  try {
    const health = await backendClient.getHealth();
    
    backendStatus = '✅ متصل';
    backendDetails = `آخر فحص: ${new Date(health.backend.timestamp).toLocaleTimeString('ar-SY')}`;
    
    if (health.devices.connected && health.devices.count > 0) {
      devicesInfo = `✅ ${health.devices.count} جهاز متصل`;
      
      // Add device details
      const devicesList = health.devices.devices.map(device => 
        `  • معرف الجهاز: ${device.id}\n    ${device.device_id}\n    المستخدم: ${device.user}\n    آخر نشاط: ${new Date(device.last_active).toLocaleString('ar-SY')}`
      ).join('\n\n');
      
      devicesInfo += `\n\n${devicesList}`;
    } else {
      devicesInfo = '⚠️ لا توجد أجهزة نشطة';
    }
  } catch (error) {
    backendStatus = '❌ غير متصل';
    devicesInfo = '❌ لا يمكن فحص الأجهزة (الخادم غير متصل)';
  }

  const status = {
    bot: `@${botInfo.username}`,
    mode: config.botMode,
    backend: config.backendApiUrl,
    uptime: process.uptime(),
  };

  await ctx.reply(
    `🤖 حالة البوت\n\n` +
      `البوت: ${status.bot}\n` +
      `الحالة: ✅ متصل\n` +
      `الوضع: ${status.mode}\n` +
      `وقت التشغيل: ${Math.floor(status.uptime)} ثانية\n\n` +
      `🔗 حالة الخادم\n\n` +
      `الرابط: ${status.backend}\n` +
      `الحالة: ${backendStatus}\n` +
      `${backendDetails}\n\n` +
      `📱 أجهزة أندرويد\n\n` +
      `${devicesInfo}`
  );
}

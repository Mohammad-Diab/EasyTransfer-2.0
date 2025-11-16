/**
 * Safe logging utility for the bot
 * - Never logs sensitive data (OTP codes, passwords, tokens)
 * - Masks phone numbers (091234****)
 * - Includes timestamps and log levels
 * - Environment-aware output
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string, context?: any): string {
    const timestamp = this.formatTimestamp();
    const contextStr = context ? ` ${JSON.stringify(this.sanitizeContext(context))}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  /**
   * Sanitize context object to remove sensitive data
   */
  private sanitizeContext(context: any): any {
    if (!context || typeof context !== 'object') {
      return context;
    }

    const sanitized = { ...context };

    // Remove sensitive keys
    const sensitiveKeys = ['password', 'token', 'secret', 'otp', 'code', 'api_key'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    // Mask phone numbers (keep first 5 digits, mask the rest)
    if (sanitized.phone && typeof sanitized.phone === 'string') {
      sanitized.phone = this.maskPhone(sanitized.phone);
    }
    if (sanitized.recipient_phone && typeof sanitized.recipient_phone === 'string') {
      sanitized.recipient_phone = this.maskPhone(sanitized.recipient_phone);
    }

    return sanitized;
  }

  /**
   * Mask phone number: 0912345678 -> 09123****
   */
  private maskPhone(phone: string): string {
    if (phone.length <= 5) return phone;
    return phone.substring(0, 5) + '****';
  }

  info(message: string, context?: any): void {
    console.log(this.formatMessage('INFO', message, context));
  }

  warn(message: string, context?: any): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  error(message: string, error?: Error | any, context?: any): void {
    const errorContext = {
      ...context,
      error: error?.message || String(error),
      ...(this.isDevelopment && error?.stack ? { stack: error.stack } : {}),
    };
    console.error(this.formatMessage('ERROR', message, errorContext));
  }

  /**
   * Log command execution (without parameters)
   */
  command(commandName: string, userId: number): void {
    this.info(`Command executed: ${commandName}`, { user_id: userId });
  }

  /**
   * Log backend API call (status only, no sensitive data)
   */
  apiCall(endpoint: string, statusCode: number, duration?: number): void {
    this.info(`Backend API call: ${endpoint}`, {
      status: statusCode,
      duration_ms: duration,
    });
  }

  /**
   * Log authorization result (without exposing token)
   */
  authResult(userId: number, allowed: boolean): void {
    this.info(`Authorization check`, {
      user_id: userId,
      allowed,
    });
  }

  /**
   * Log notification sent (without OTP code or sensitive details)
   */
  notificationSent(type: 'transfer' | 'otp' | 'balance', userId: number, details?: any): void {
    this.info(`Notification sent: ${type}`, {
      user_id: userId,
      ...this.sanitizeContext(details || {}),
    });
  }

  /**
   * Log security event (unauthorized access attempt)
   */
  securityEvent(event: string, details: any): void {
    this.warn(`Security event: ${event}`, details);
  }
}

// Singleton instance
export const logger = new Logger();

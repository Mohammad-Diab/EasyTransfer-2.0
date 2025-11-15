import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class SecurityService {
  /**
   * Mask phone number for logging (shows only last 4 digits)
   * Example: 0912345678 → 091234****
   */
  maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return '****';
    const visiblePart = phone.slice(0, -4);
    return `${visiblePart}****`;
  }

  /**
   * Mask sensitive data in objects for logging
   */
  maskSensitiveData(data: any): any {
    if (!data) return data;

    const masked = { ...data };
    const sensitiveFields = ['password', 'token', 'code', 'otp', 'secret'];

    for (const key of Object.keys(masked)) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        masked[key] = '***REDACTED***';
      } else if (key.toLowerCase().includes('phone')) {
        masked[key] = this.maskPhone(masked[key]);
      }
    }

    return masked;
  }

  /**
   * Generate request fingerprint for tracking
   */
  generateFingerprint(ip: string, userAgent: string): string {
    return createHash('sha256')
      .update(`${ip}:${userAgent}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Validate IP against allowlist (if configured)
   */
  isIpAllowed(ip: string, allowedIps: string[]): boolean {
    if (!allowedIps || allowedIps.length === 0) return true;
    return allowedIps.includes(ip);
  }
}

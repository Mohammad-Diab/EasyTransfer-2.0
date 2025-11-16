import { config } from '../config/env';
import { logger } from '../utils/logger';

interface BackendResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

class BackendClient {
  private readonly baseURL: string;
  private readonly serviceToken: string;
  private readonly timeout: number = 10000; // 10 seconds

  constructor() {
    this.baseURL = config.backendApiUrl;
    this.serviceToken = config.botServiceToken;
  }

  private async request<T = any>(endpoint: string, data?: any): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceToken}`,
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          message: response.statusText 
        })) as { message?: string };
        throw new Error(error.message || `Backend request failed: ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        logger.error('Backend API timeout', new Error('Request timeout'), { endpoint });
        throw new Error('Backend request timeout');
      }
      
      logger.error('Backend API error', error, { endpoint });
      throw error;
    }
  }

  async authorize(telegramUserId: number): Promise<{ allowed: boolean; message?: string, user_id?: number }> {
    return this.request('/api/bot/authorize', { telegram_user_id: telegramUserId });
  }

  async submitTransfer(
    telegramUserId: number, 
    phone: string, 
    amount: number
  ): Promise<{ 
    id: number; 
    status: string; 
    message?: string 
  }> {
    return this.request('/api/bot/transfers', {
      telegram_user_id: telegramUserId,
      recipient_phone: phone,
      amount,
    });
  }

  async submitBalanceJob(
    telegramUserId: number,
    operator: 'syriatel' | 'mtn'
  ): Promise<{
    job_id: string;
    status: string;
    message: string;
  }> {
    return this.request('/api/bot/balance', {
      telegram_user_id: telegramUserId,
      operator,
    });
  }

  async validateAmount(amount: number): Promise<{
    valid: boolean;
    requestedAmount: number;
    matchedTier: number | null;
    message: string;
  }> {
    return this.request('/api/bot/validate-amount', { amount });
  }

  async getHealth(): Promise<{
    backend: {
      status: string;
      timestamp: string;
    };
    devices: {
      connected: boolean;
      count: number;
      devices: Array<{
        id: number;
        device_id: string;
        last_active: Date;
        user: string;
      }>;
    };
  }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}/api/bot/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.serviceToken}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Backend health check failed');
      }

      return response.json() as Promise<{
        backend: {
          status: string;
          timestamp: string;
        };
        devices: {
          connected: boolean;
          count: number;
          devices: Array<{
            id: number;
            device_id: string;
            last_active: Date;
            user: string;
          }>;
        };
      }>;
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

export const backendClient = new BackendClient();

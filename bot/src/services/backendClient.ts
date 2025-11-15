import { config } from '../config/env';

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
          'X-Bot-Token': this.serviceToken,
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
        console.error('Backend API timeout:', endpoint);
        throw new Error('Backend request timeout');
      }
      
      console.error('Backend API error:', error.message);
      throw error;
    }
  }

  async authorize(telegramUserId: number): Promise<{ allowed: boolean; message?: string }> {
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
}

export const backendClient = new BackendClient();

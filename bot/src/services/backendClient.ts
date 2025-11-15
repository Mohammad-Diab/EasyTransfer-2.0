import { config } from '../config/env';

class BackendClient {
  private readonly baseURL: string;
  private readonly serviceToken: string;

  constructor() {
    this.baseURL = config.backendApiUrl;
    this.serviceToken = config.botServiceToken;
  }

  private async request(endpoint: string, data?: any) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-Token': this.serviceToken,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Backend request failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Backend API error:', error);
      throw error;
    }
  }

  async authorize(telegramUserId: number) {
    return this.request('/api/bot/authorize', { telegram_user_id: telegramUserId });
  }

  async submitTransfer(telegramUserId: number, phone: string, amount: number) {
    return this.request('/api/bot/transfers', {
      telegram_user_id: telegramUserId,
      recipient_phone: phone,
      amount,
    });
  }
}

export const backendClient = new BackendClient();

class BackendClient {
  private readonly baseURL: string;
  private readonly serviceToken: string;

  constructor() {
    this.baseURL = process.env.BACKEND_API_URL || 'http://localhost:3000';
    this.serviceToken = process.env.BOT_SERVICE_TOKEN!;
  }

  private async request(endpoint: string, data?: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.serviceToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.statusText}`);
    }

    return response.json();
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

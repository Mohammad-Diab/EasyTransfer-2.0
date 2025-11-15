class API {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  private async request(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async login(phone: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async getMyTransfers() {
    return this.request('/api/user/transfers');
  }

  async getMyStats() {
    return this.request('/api/user/transfers/stats');
  }

  async getSystemStats() {
    return this.request('/api/admin/dashboard/stats');
  }

  async getAllUsers(page: number = 1, limit: number = 20) {
    return this.request(`/api/admin/users?page=${page}&limit=${limit}`);
  }

  async toggleUserStatus(userId: number) {
    return this.request('/api/admin/users/toggle-status', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }
}

export const api = new API();

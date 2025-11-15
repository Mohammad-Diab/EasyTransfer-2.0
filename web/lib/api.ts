class API {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  private async request(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      credentials: 'include', // Important: Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'فشل الاتصال بالخادم');
    }

    return response.json();
  }

  // ===== Authentication =====
  async requestOtp(phone: string) {
    return this.request('/api/auth/web/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, code: string) {
    return this.request('/api/auth/web/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  }

  // ===== User Endpoints (Web UI) =====
  async getMe() {
    return this.request('/api/me/summary');
  }

  async getMyTransfers(page: number = 1, limit: number = 20, status?: string, phone?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(phone && { phone }),
    });
    return this.request(`/api/me/transfers?${params}`);
  }

  async getMyStats() {
    return this.request('/api/me/transfers/stats');
  }

  // ===== Admin Endpoints =====
  async getSystemStats() {
    return this.request('/api/admin/dashboard/stats');
  }

  async getAllUsers(page: number = 1, limit: number = 20, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    return this.request(`/api/admin/users?${params}`);
  }

  async getUserById(userId: number) {
    return this.request(`/api/admin/users/${userId}`);
  }

  async updateUser(userId: number, data: { name?: string; role?: string }) {
    return this.request(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleUserStatus(userId: number) {
    return this.request(`/api/admin/users/${userId}/toggle-status`, {
      method: 'POST',
    });
  }

  async getAllTransfers(page: number = 1, limit: number = 20, status?: string, phone?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(phone && { phone }),
    });
    return this.request(`/api/admin/transfers?${params}`);
  }

  async getTransferById(transferId: number) {
    return this.request(`/api/admin/transfers/${transferId}`);
  }

  async getActiveDevices() {
    return this.request('/api/admin/devices');
  }

  async getSystemLogs(page: number = 1, limit: number = 50) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request(`/api/admin/logs?${params}`);
  }
}

export const api = new API();

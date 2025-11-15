import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface UseMyTransfersParams {
  page?: number;
  limit?: number;
  status?: string;
  phone?: string;
}

export function useMyTransfers(params: UseMyTransfersParams = {}) {
  const { page = 1, limit = 20, status, phone } = params;

  return useQuery({
    queryKey: ['transfers', 'me', page, limit, status, phone],
    queryFn: () => api.getMyTransfers(page, limit, status, phone),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useMyStats() {
  return useQuery({
    queryKey: ['stats', 'me'],
    queryFn: () => api.getMyStats(),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useSystemStats() {
  return useQuery({
    queryKey: ['stats', 'system'],
    queryFn: () => api.getSystemStats(),
    staleTime: 60 * 1000, // 1 minute
  });
}

interface UseAllUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function useAllUsers(params: UseAllUsersParams = {}) {
  const { page = 1, limit = 20, search } = params;

  return useQuery({
    queryKey: ['users', 'all', page, limit, search],
    queryFn: () => api.getAllUsers(page, limit, search),
    staleTime: 30 * 1000, // 30 seconds
  });
}

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useMyTransfers() {
  return useQuery({
    queryKey: ['transfers', 'me'],
    queryFn: () => api.getMyTransfers(),
  });
}

export function useMyStats() {
  return useQuery({
    queryKey: ['stats', 'me'],
    queryFn: () => api.getMyStats(),
  });
}

export function useSystemStats() {
  return useQuery({
    queryKey: ['stats', 'system'],
    queryFn: () => api.getSystemStats(),
  });
}

export function useAllUsers(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['users', 'all', page, limit],
    queryFn: () => api.getAllUsers(page, limit),
  });
}

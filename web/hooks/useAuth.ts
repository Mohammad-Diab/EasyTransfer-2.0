import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export interface User {
  id: number;
  telegram_user_id: number;
  phone_number: string;
  name: string | null;
  role: string;
  tier: string;
  is_active: boolean;
  created_at: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery<User>({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      try {
        return await api.getMe();
      } catch (error: any) {
        // Only treat 401/403 as authentication errors
        const statusMatch = error.message?.match(/status (\d+)/i);
        const status = statusMatch ? parseInt(statusMatch[1]) : null;
        
        if (status === 401 || status === 403 || error.message?.includes('401') || error.message?.includes('غير مصرح')) {
          throw new Error('Not authenticated');
        }
        // For other errors (500, network, etc.), throw with original message
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error.message === 'Not authenticated') {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const isAuthenticated = !!user && !isError;

  const logout = async () => {
    try {
      // Clear the httpOnly cookie by calling backend logout endpoint
      // For now, we'll just clear local cache and redirect
      queryClient.clear();
      router.push('/login');
    } catch (error) {
      // Even if logout fails, clear cache and redirect
      queryClient.clear();
      router.push('/login');
    }
  };

  const checkAuth = () => {
    return queryClient.fetchQuery({
      queryKey: ['auth', 'user'],
      queryFn: () => api.getMe(),
    });
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    isError,
    error,
    logout,
    checkAuth,
  };
}

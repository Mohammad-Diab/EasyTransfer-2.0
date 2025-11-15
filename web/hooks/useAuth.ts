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
        // If 401, user is not authenticated
        if (error.message?.includes('401') || error.message?.includes('غير مصرح')) {
          throw new Error('Not authenticated');
        }
        throw error;
      }
    },
    retry: false,
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

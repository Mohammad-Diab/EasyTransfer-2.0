'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Only redirect to login if it's a real authentication error
      if (!isAuthenticated && error?.message === 'Not authenticated') {
        router.push('/login');
        return;
      }

      if (requiredRole === UserRole.ADMIN && user?.role !== UserRole.ADMIN) {
        // Redirect to transfers if user doesn't have admin role
        console.log('Access denied: User role is', user?.role, 'but admin required');
        router.push('/transfers');
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router, error]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Only block rendering if it's an authentication error
  if (!isAuthenticated && error?.message === 'Not authenticated') {
    return null; // Will redirect
  }

  if (requiredRole === UserRole.ADMIN && user?.role !== UserRole.ADMIN) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Layout } from 'antd';
import arEG from 'antd/locale/ar_EG';
import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import './globals.css';

const { Content } = Layout;

function AppContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  
  // Don't show navbar on login page or if not authenticated
  const showNavbar = pathname !== '/login' && isAuthenticated;

  return (
    <Layout className="min-h-screen">
      {showNavbar && <Navbar />}
      <Content className={showNavbar ? 'p-6' : ''}>
        {children}
      </Content>
    </Layout>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <html lang="ar" dir="rtl">
      <body>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider direction="rtl" locale={arEG}>
            <AppContent>{children}</AppContent>
          </ConfigProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

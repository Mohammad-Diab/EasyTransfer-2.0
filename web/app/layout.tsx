'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Layout } from 'antd';
import arEG from 'antd/locale/ar_EG';
import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAuth } from '@/hooks/useAuth';
import './globals.css';

const { Content } = Layout;

function AppContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  
  // Don't show navbar on login page, if not authenticated, or on transfers/admin pages (they have their own layout)
  const showNavbar = pathname !== '/login' && 
                     !pathname.startsWith('/transfers') && 
                     !pathname.startsWith('/admin') && 
                     isAuthenticated;

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ConfigProvider 
              direction="rtl" 
              locale={arEG}
              theme={{
                token: {
                  fontFamily: "'Tajawal', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                },
              }}
            >
              <AppContent>{children}</AppContent>
            </ConfigProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

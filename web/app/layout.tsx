'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import arEG from 'antd/locale/ar_EG';
import { ReactNode, useState } from 'react';
import './globals.css';

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
            {children}
          </ConfigProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

'use client';

import { Layout, Menu, Button, Modal } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DashboardOutlined,
  SwapOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
  AndroidOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/constants';

const { Header, Content } = Layout;

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  const menuItems = [
    {
      key: '/transfers',
      icon: <SwapOutlined />,
      label: <Link href="/transfers">تحويلاتي</Link>,
    },
    // Only show admin dashboard for admin users
    ...(user?.role === UserRole.ADMIN ? [{
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/admin/dashboard">لوحة النظام / المستخدمين</Link>,
    }] : []),
  ];

  const handleLogout = () => {
    Modal.confirm({
      title: 'تسجيل الخروج',
      icon: <ExclamationCircleOutlined />,
      content: 'هل أنت متأكد من أنك تريد تسجيل الخروج؟',
      okText: 'نعم، تسجيل الخروج',
      cancelText: 'إلغاء',
      okButtonProps: { danger: true },
      onOk: () => {
        logout();
        router.push('/login');
      },
    });
  };

  return (
    <Layout className="min-h-screen">
      <Header>
        <div className="flex items-center justify-between">
          <div className="text-white text-xl font-bold">EasyTransfer 2.0</div>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[pathname]}
            items={menuItems}
            className="flex-1 mr-8"
          />
          <Button
            type="default"
            icon={<AndroidOutlined />}
            href="/android/easytransfer-agent.apk"
            download
            className="mr-2"
          >
            تحميل تطبيق الأندرويد
          </Button>
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            تسجيل الخروج
          </Button>
        </div>
      </Header>
      <Content className="p-6">{children}</Content>
    </Layout>
  );
}

'use client';

import { Layout, Menu } from 'antd';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  DashboardOutlined,
  SwapOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Header, Content } = Layout;

export default function TransfersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    {
      key: '/transfers',
      icon: <SwapOutlined />,
      label: <Link href="/transfers">تحويلاتي</Link>,
    },
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/admin/dashboard">لوحة النظام</Link>,
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: <Link href="/admin/users">المستخدمين</Link>,
    },
  ];

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
        </div>
      </Header>
      <Content className="p-6">{children}</Content>
    </Layout>
  );
}

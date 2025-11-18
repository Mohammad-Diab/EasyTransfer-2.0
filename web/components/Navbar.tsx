'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Button, Drawer, Typography, Modal } from 'antd';
import {
  MenuOutlined,
  SwapOutlined,
  DashboardOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
  AndroidOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import type { MenuProps } from 'antd';
import { UserRole } from '@/lib/constants';

const { Header } = Layout;
const { Title } = Typography;

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Build navigation items based on user permissions
  const getNavItems = (): MenuProps['items'] => {
    if (!user?.role) return [];

    const items: MenuProps['items'] = [];

    // Both regular users and admins can see "My Transfers"
    if (user.role === UserRole.USER || user.role === UserRole.ADMIN) {
      items.push({
        key: '/transfers',
        icon: <SwapOutlined />,
        label: 'تحويلاتي',
        onClick: () => {
          router.push('/transfers');
          setMobileMenuOpen(false);
        },
      });
    }

    // Only admins see System Dashboard / Users
    if (user.role === UserRole.ADMIN) {
      items.push({
        key: '/admin/dashboard',
        icon: <DashboardOutlined />,
        label: 'لوحة النظام / المستخدمين',
        onClick: () => {
          router.push('/admin/dashboard');
          setMobileMenuOpen(false);
        },
      });
    }

    return items;
  };

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
        setMobileMenuOpen(false);
      },
    });
  };

  const selectedKeys = [pathname];

  return (
    <Header className="bg-white shadow-md px-4 flex items-center justify-between">
      {/* Logo / Title */}
      <div className="flex items-center">
        <Title level={3} className="mb-0 text-primary">
          EasyTransfer 2.0
        </Title>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-4">
        <Menu
          mode="horizontal"
          selectedKeys={selectedKeys}
          items={getNavItems()}
          className="flex-1 min-w-0 border-0"
        />
        <Button
          type="default"
          icon={<AndroidOutlined />}
          href="/android/easytransfer-agent.apk"
          download
        >
          تحميل تطبيق الأندرويد
        </Button>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          danger
        >
          تسجيل الخروج
        </Button>
      </div>

      {/* Mobile Menu Button */}
      <Button
        className="md:hidden"
        type="text"
        icon={<MenuOutlined />}
        onClick={() => setMobileMenuOpen(true)}
      />

      {/* Mobile Drawer */}
      <Drawer
        title="EasyTransfer 2.0"
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
      >
        <Menu
          mode="vertical"
          selectedKeys={selectedKeys}
          items={getNavItems()}
          className="border-0"
        />
        <Button
          type="default"
          icon={<DownloadOutlined />}
          href="/android/easytransfer-agent.apk"
          download
          block
          className="mt-4"
        >
          تحميل تطبيق الأندرويد
        </Button>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          danger
          block
          className="mt-4"
        >
          تسجيل الخروج
        </Button>
      </Drawer>
    </Header>
  );
}

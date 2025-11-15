'use client';

import { useState } from 'react';
import { 
  Card, 
  Statistic, 
  Row, 
  Col, 
  Table, 
  Typography, 
  Input, 
  Button, 
  Space, 
  Tag,
  Switch,
  Empty,
  message,
  Alert,
} from 'antd';
import { 
  SearchOutlined, 
  UserAddOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useSystemStats, useAllUsers } from '@/hooks/useTransfers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

const { Title } = Typography;
const { Search } = Input;

function DashboardContent() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState<string | undefined>(undefined);

  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useSystemStats();
  const { data: usersData, isLoading: usersLoading, isError: usersError, refetch: refetchUsers } = useAllUsers({ page, limit, search });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (userId: number) => api.toggleUserStatus(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('تم تحديث حالة المستخدم بنجاح');
    },
    onError: (error: any) => {
      message.error(error.message || 'فشل تحديث حالة المستخدم');
    },
  });

  const handleSearch = (value: string) => {
    setSearch(value || undefined);
    setPage(1);
  };

  const handleToggleStatus = (userId: number, currentStatus: boolean) => {
    toggleStatusMutation.mutate(userId);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <span dir="ltr" className="font-mono">{id}</span>,
    },
    {
      title: 'رقم الهاتف',
      dataIndex: 'phone_number',
      key: 'phone_number',
      render: (phone: string) => <span dir="ltr" className="font-mono">{phone}</span>,
    },
    {
      title: 'الاسم',
      dataIndex: 'name',
      key: 'name',
      render: (name: string | null) => name || '-',
    },
    {
      title: 'الدور',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? 'مدير' : 'مستخدم'}
        </Tag>
      ),
    },
    {
      title: 'الفئة',
      dataIndex: 'tier',
      key: 'tier',
      width: 100,
      render: (tier: string) => (
        <Tag color="purple">{tier}</Tag>
      ),
    },
    {
      title: 'التحويلات',
      dataIndex: 'total_transfers',
      key: 'total_transfers',
      width: 100,
      render: (count: number) => (
        <span dir="ltr" className="font-mono">{count || 0}</span>
      ),
    },
    {
      title: 'ناجحة',
      dataIndex: 'successful_transfers',
      key: 'successful_transfers',
      width: 100,
      render: (count: number) => (
        <span dir="ltr" className="font-mono" style={{ color: '#52c41a' }}>
          {count || 0}
        </span>
      ),
    },
    {
      title: 'فاشلة',
      dataIndex: 'failed_transfers',
      key: 'failed_transfers',
      width: 100,
      render: (count: number) => (
        <span dir="ltr" className="font-mono" style={{ color: '#ff4d4f' }}>
          {count || 0}
        </span>
      ),
    },
    {
      title: 'الحالة',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'} icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {isActive ? 'نشط' : 'معطل'}
        </Tag>
      ),
    },
    {
      title: 'إجراءات',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Switch
          checked={record.is_active}
          onChange={() => handleToggleStatus(record.id, record.is_active)}
          loading={toggleStatusMutation.isPending}
          checkedChildren="نشط"
          unCheckedChildren="معطل"
        />
      ),
    },
  ];

  const users = usersData?.data || [];
  const total = usersData?.total || 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>لوحة النظام</Title>
      </div>

      {/* Error Alert for Statistics */}
      {statsError && (
        <Alert
          message="خطأ في تحميل الإحصائيات"
          description="حدث خطأ أثناء تحميل إحصائيات النظام. يرجى المحاولة مرة أخرى."
          type="error"
          showIcon
          closable
          action={
            <Button size="small" onClick={() => refetchStats()}>
              إعادة المحاولة
            </Button>
          }
          className="mb-4"
        />
      )}

      {/* System-wide Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic 
              title="إجمالي التحويلات" 
              value={stats?.total || 0}
              valueStyle={{ direction: 'ltr' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic 
              title="قيد الانتظار" 
              value={stats?.pending || 0}
              valueStyle={{ direction: 'ltr', color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic 
              title="ناجحة" 
              value={stats?.success || 0}
              valueStyle={{ direction: 'ltr', color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic 
              title="فاشلة" 
              value={stats?.failed || 0}
              valueStyle={{ direction: 'ltr', color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Users Management */}
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>إدارة المستخدمين</span>
          </div>
        }
      >
        {/* Error Alert for Users */}
        {usersError && (
          <Alert
            message="خطأ في تحميل المستخدمين"
            description="حدث خطأ أثناء تحميل قائمة المستخدمين. يرجى المحاولة مرة أخرى."
            type="error"
            showIcon
            closable
            action={
              <Button size="small" icon={<ReloadOutlined />} onClick={() => refetchUsers()}>
                إعادة المحاولة
              </Button>
            }
            className="mb-4"
          />
        )}

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Search */}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Search
                placeholder="ابحث برقم الهاتف، الاسم، أو معرف المستخدم..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearch}
                dir="rtl"
              />
            </Col>
          </Row>

          {/* Users Table */}
          <Table
            columns={columns}
            dataSource={users}
            loading={usersLoading}
            rowKey="id"
            locale={{
              emptyText: (
                <Empty
                  description="لا يوجد مستخدمين"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
            pagination={{
              current: page,
              pageSize: limit,
              total: total,
              showSizeChanger: true,
              showTotal: (total) => (
                <span dir="ltr" className="font-mono">
                  إجمالي {total} مستخدم
                </span>
              ),
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setLimit(newPageSize);
              },
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            scroll={{ x: 1200 }}
          />
        </Space>
      </Card>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardContent />
    </ProtectedRoute>
  );
}

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
  EditOutlined,
} from '@ant-design/icons';
import { useSystemStats, useAllUsers } from '@/hooks/useTransfers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/lib/constants';
import AddUserModal from '@/components/AddUserModal';
import EditUserModal from '@/components/EditUserModal';

const { Title } = Typography;
const { Search } = Input;

function DashboardContent() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string | null } | null>(null);

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

  const handleEditUser = (user: { id: number; name: string | null }) => {
    setSelectedUser(user);
    setEditUserModalOpen(true);
  };

  const columns = [
    {
      title: 'معرف',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <span dir="ltr" className="font-mono">{id}</span>,
    },
    {
      title: 'رقم الهاتف',
      dataIndex: 'phone',
      key: 'phone',
      width: 160,
      render: (phone: string) => <span dir="ltr" className="font-mono">{phone}</span>,
    },
    {
      title: 'الاسم',
      dataIndex: 'name',
      key: 'name',
      width: 200,
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
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'} icon={status === 'active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {status === 'active' ? 'نشط' : 'معطل'}
        </Tag>
      ),
    },
    {
      title: 'إجراءات',
      key: 'actions',
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditUser({ id: record.id, name: record.name })}
            title="تعديل"
          />
          <Switch
            checked={record.status === 'active'}
            onChange={() => handleToggleStatus(record.id, record.status === 'active')}
            loading={toggleStatusMutation.isPending}
            checkedChildren="نشط"
            unCheckedChildren="معطل"
          />
        </Space>
      ),
    },
  ];

  const users = usersData?.users || [];
  const total = usersData?.total || 0;

  return (
    <div>
      <div className="mb-4">
        <Title level={2} className="mb-0">لوحة النظام</Title>
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
              value={stats?.transfers?.total || 0}
              valueStyle={{ direction: 'ltr' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="قيد الانتظار"
              value={stats?.transfers?.pending || 0}
              valueStyle={{ direction: 'ltr', color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="ناجحة"
              value={stats?.transfers?.success || 0}
              valueStyle={{ direction: 'ltr', color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="فاشلة"
              value={stats?.transfers?.failed || 0}
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
            <Space>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setAddUserModalOpen(true)}
              >
                إضافة مستخدم
              </Button>

              <Search
                placeholder="ابحث برقم الهاتف، الاسم، أو معرف المستخدم..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearch}
                dir="rtl"
                style={{ fontWeight: 'normal', width: 240 }}
              />

            </Space>
          </div>
        }
        styles={{
          header: { borderBottom: 'none' },
          body: { paddingTop: '0px' }
        }}
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
                <span>
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

      {/* Add User Modal */}
      <AddUserModal
        open={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        onSuccess={() => {
          refetchUsers();
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        open={editUserModalOpen}
        userId={selectedUser?.id || null}
        currentName={selectedUser?.name || null}
        onClose={() => {
          setEditUserModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          refetchUsers();
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }}
      />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

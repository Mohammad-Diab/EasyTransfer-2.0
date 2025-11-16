'use client';

import { useState } from 'react';
import { Card, Statistic, Row, Col, Table, Typography, Input, Select, Space, Empty, Alert, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMyTransfers, useMyStats } from '@/hooks/useTransfers';
import StatusTag from '@/components/StatusTag';
import ProtectedRoute from '@/components/ProtectedRoute';

const { Title } = Typography;
const { Search } = Input;

function TransfersContent() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [searchPhone, setSearchPhone] = useState<string | undefined>(undefined);

  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useMyStats();
  const { data: transfersData, isLoading: transfersLoading, isError: transfersError, refetch: refetchTransfers } = useMyTransfers({
    page,
    limit,
    status,
    phone: searchPhone,
  });

  const handleSearch = (value: string) => {
    setSearchPhone(value || undefined);
    setPage(1); // Reset to first page on search
  };

  const handleStatusChange = (value: string) => {
    setStatus(value === 'all' ? undefined : value);
    setPage(1); // Reset to first page on filter
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
      title: 'رقم المستلم',
      dataIndex: 'recipient_phone',
      key: 'recipient_phone',
      width: 160,
      render: (phone: string) => <span dir="ltr" className="font-mono">{phone}</span>,
    },
    {
      title: 'المبلغ',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <span dir="ltr" className="font-mono font-semibold">
          {amount.toLocaleString('en-US')}
        </span>
      ),
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: 'التاريخ',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => {
        const d = new Date(date);
        return (
          <span dir="ltr" className="text-sm">
            {d.toLocaleDateString('ar-IQ')} {d.toLocaleTimeString('ar-IQ', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        );
      },
    },
  ];

  // Extract transfers array and total from API response
  const transfers = transfersData?.transfers || [];
  const total = transfersData?.total || 0;

  return (
    <div>
      <div className="mb-4">
        <Title level={2} className="mb-0">تحويلاتي</Title>
      </div>

      {/* Error Alert for Statistics */}
      {statsError && (
        <Alert
          message="خطأ في تحميل الإحصائيات"
          description="حدث خطأ أثناء تحميل الإحصائيات. يرجى المحاولة مرة أخرى."
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

      {/* Statistics Cards */}
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

      {/* Transfers Table */}
      <Card>
        {/* Error Alert for Transfers */}
        {transfersError && (
          <Alert
            message="خطأ في تحميل التحويلات"
            description="حدث خطأ أثناء تحميل التحويلات. يرجى المحاولة مرة أخرى."
            type="error"
            showIcon
            closable
            action={
              <Button size="small" icon={<ReloadOutlined />} onClick={() => refetchTransfers()}>
                إعادة المحاولة
              </Button>
            }
            className="mb-4"
          />
        )}

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* Filters */}
          <Row gutter={16} justify="end">
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="تصفية حسب الحالة"
                style={{ width: '100%' }}
                onChange={handleStatusChange}
                defaultValue="all"
                options={[
                  { label: 'الكل', value: 'all' },
                  { label: 'قيد الانتظار', value: 'pending' },
                  { label: 'مؤجلة', value: 'delayed' },
                  { label: 'قيد الإنجاز', value: 'processing' },
                  { label: 'ناجحة', value: 'success' },
                  { label: 'فاشلة', value: 'failed' },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Search
                placeholder="ابحث برقم الهاتف..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearch}
                dir="rtl"
              />
            </Col>
          </Row>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={transfers}
            loading={transfersLoading}
            rowKey="id"
            locale={{
              emptyText: (
                <Empty
                  description="لا توجد تحويلات"
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
                  إجمالي {total} تحويل
                </span>
              ),
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setLimit(newPageSize);
              },
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
          />
        </Space>
      </Card>
    </div>
  );
}

export default function TransfersPage() {
  return (
    <ProtectedRoute>
      <TransfersContent />
    </ProtectedRoute>
  );
}

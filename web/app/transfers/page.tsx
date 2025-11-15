'use client';

import { Card, Statistic, Row, Col, Table, Typography } from 'antd';
import { useMyTransfers, useMyStats } from '@/hooks/useTransfers';
import { STATUS_CONFIG } from '@/lib/statusConfig';

const { Title } = Typography;

export default function TransfersPage() {
  const { data: stats, isLoading: statsLoading } = useMyStats();
  const { data: transfers, isLoading: transfersLoading } = useMyTransfers();

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => <span className="number">{id}</span>,
    },
    {
      title: 'رقم المستلم',
      dataIndex: 'recipient_phone',
      key: 'recipient_phone',
      render: (phone: string) => <span className="number">{phone}</span>,
    },
    {
      title: 'المبلغ',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => <span className="number">{amount}</span>,
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
        return config ? config.label : status;
      },
    },
    {
      title: 'التاريخ',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('ar'),
    },
  ];

  return (
    <div>
      <Title level={2}>تحويلاتي</Title>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="إجمالي التحويلات" value={stats?.total || 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="قيد الانتظار" value={stats?.pending || 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="ناجحة" value={stats?.success || 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="فاشلة" value={stats?.failed || 0} />
          </Card>
        </Col>
      </Row>

      {/* Transfers Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={transfers || []}
          loading={transfersLoading}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}

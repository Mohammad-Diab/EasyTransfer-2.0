'use client';

import { Tag } from 'antd';
import {
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { STATUS_CONFIG } from '@/lib/statusConfig';

interface StatusTagProps {
  status: string;
}

const iconMap = {
  pending: <ClockCircleOutlined />,
  delayed: <MinusCircleOutlined />,
  processing: <SyncOutlined spin />,
  success: <CheckCircleOutlined />,
  failed: <CloseCircleOutlined />,
};

export default function StatusTag({ status }: StatusTagProps) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];

  if (!config) {
    return <Tag>{status}</Tag>;
  }

  return (
    <Tag
      color={config.color}
      icon={iconMap[status as keyof typeof iconMap]}
    >
      {config.label}
    </Tag>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { PhoneOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { phone: string }) => {
    setLoading(true);
    try {
      const response = await api.login(values.phone);
      
      if (response.token) {
        message.success('تم تسجيل الدخول بنجاح');
        router.push('/transfers');
      }
    } catch (error) {
      message.error('فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <Title level={2}>EasyTransfer 2.0</Title>
          <Text type="secondary">تسجيل الدخول</Text>
        </div>

        <Form onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="phone"
            label="رقم الهاتف"
            rules={[
              { required: true, message: 'يرجى إدخال رقم الهاتف' },
              { pattern: /^\d{10}$/, message: 'يرجى إدخال رقم هاتف صحيح' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="0912345678"
              dir="ltr"
              className="text-left"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              دخول
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

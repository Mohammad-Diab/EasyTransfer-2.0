'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

type LoginStep = 'phone' | 'otp';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const router = useRouter();

  const onRequestOtp = async (values: { phone: string }) => {
    setLoading(true);
    try {
      await api.requestOtp(values.phone);
      setPhone(values.phone);
      setStep('otp');
      message.success('تم إرسال رمز التحقق إلى حسابك في Telegram');
    } catch (error: any) {
      message.error(error.message || 'فشل إرسال رمز التحقق. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (values: { code: string }) => {
    setLoading(true);
    try {
      await api.verifyOtp(phone, values.code);
      message.success('تم تسجيل الدخول بنجاح');
      router.push('/transfers');
    } catch (error: any) {
      message.error(error.message || 'رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('phone');
    setPhone('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <Title level={2}>EasyTransfer 2.0</Title>
          <Text type="secondary">تسجيل الدخول</Text>
        </div>

        {step === 'phone' ? (
          <Form onFinish={onRequestOtp} layout="vertical" size="large">
            <Form.Item
              name="phone"
              label="رقم الهاتف"
              rules={[
                { required: true, message: 'يرجى إدخال رقم الهاتف' },
                { pattern: /^09\d{8}$/, message: 'يرجى إدخال رقم هاتف صحيح (09XXXXXXXX)' },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="0912345678"
                dir="ltr"
                className="text-left"
                maxLength={10}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                إرسال رمز التحقق
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form onFinish={onVerifyOtp} layout="vertical" size="large">
            <div className="mb-4 text-center">
              <Text type="secondary">
                تم إرسال رمز التحقق إلى حسابك في Telegram
              </Text>
              <br />
              <Text strong dir="ltr">{phone}</Text>
            </div>

            <Form.Item
              name="code"
              label="رمز التحقق"
              rules={[
                { required: true, message: 'يرجى إدخال رمز التحقق' },
                { pattern: /^\d{6}$/, message: 'رمز التحقق يجب أن يكون 6 أرقام' },
              ]}
            >
              <Input
                prefix={<LockOutlined />}
                placeholder="123456"
                dir="ltr"
                className="text-left"
                maxLength={6}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                تحقق
              </Button>
            </Form.Item>

            <Form.Item>
              <Button type="link" onClick={resetFlow} block>
                تغيير رقم الهاتف
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
}

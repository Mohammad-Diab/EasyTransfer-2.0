'use client';

import { useEffect, useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { api } from '@/lib/api';

interface EditUserModalProps {
  open: boolean;
  userId: number | null;
  currentName: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditUserModal({
  open,
  userId,
  currentName,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && currentName) {
      form.setFieldsValue({ name: currentName });
    }
  }, [open, currentName, form]);

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (!userId) {
        message.error('معرف المستخدم غير موجود');
        return;
      }

      setLoading(true);
      try {
        await api.updateUser(userId, { name: values.name });
        message.success('تم تحديث اسم المستخدم بنجاح');
        handleCancel();
        onSuccess();
      } catch (error: any) {
        message.error(error.message || 'فشل تحديث اسم المستخدم');
      } finally {
        setLoading(false);
      }
    } catch (error) {
      // Form validation failed
    }
  };

  return (
    <Modal
      title="تعديل اسم المستخدم"
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="تحديث"
      cancelText="إلغاء"
      width={500}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="name"
          label="الاسم"
          rules={[
            { required: true, message: 'يرجى إدخال الاسم' },
            { min: 2, message: 'الاسم يجب أن يكون حرفين على الأقل' },
            { max: 100, message: 'الاسم يجب ألا يتجاوز 100 حرف' },
          ]}
        >
          <Input placeholder="أدخل الاسم الجديد" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

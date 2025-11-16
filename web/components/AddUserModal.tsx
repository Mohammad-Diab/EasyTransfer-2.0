'use client';

import { useState } from 'react';
import { Modal, Steps, Button, Form, Input, Image, Typography, Space, message } from 'antd';
import { api } from '@/lib/api';

const { Title, Text } = Typography;

interface AddUserModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddUserModal({ open, onClose, onSuccess }: AddUserModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleCancel = () => {
        form.resetFields();
        setCurrentStep(0);
        onClose();
    };

    const handleNext = async () => {
        try {
            if (currentStep === 0) {
                // Step 1: Just move to next step
                setCurrentStep(1);
            } else if (currentStep === 1) {
                // Step 2: Validate form and verify telegram user
                await form.validateFields(['name', 'telegram_user_id', 'phone']);
                const values = form.getFieldsValue(['name', 'telegram_user_id', 'phone']);

                setLoading(true);
                try {
                    // Verify user data
                    await api.verifyTelegramUser(Number(values.telegram_user_id), values.phone);
                    
                    // Request OTP to be sent
                    await api.requestUserOtp(Number(values.telegram_user_id));
                    
                    message.success('تم إرسال رمز التحقق إلى البوت');
                    setCurrentStep(2);
                } catch (error: any) {
                    message.error(error.message || 'فشل التحقق من بيانات المستخدم');
                } finally {
                    setLoading(false);
                }
            }
        } catch (error) {
            // Form validation failed
        }
    };

    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleCreate = async () => {
        try {
            // Validate OTP field
            await form.validateFields(['otp']);
            
            // Get ALL form values (from all steps)
            const values = form.getFieldsValue(['name', 'phone', 'telegram_user_id', 'otp']);

            // Log for debugging
            console.log('Creating user with values:', values);

            setLoading(true);
            try {
                await api.createUser({
                    name: values.name,
                    phone: values.phone,
                    telegram_user_id: Number(values.telegram_user_id),
                    otp: values.otp,
                });

                message.success('تم إنشاء المستخدم بنجاح');
                handleCancel();
                onSuccess();
            } catch (error: any) {
                message.error(error.message || 'فشل إنشاء المستخدم');
            } finally {
                setLoading(false);
            }
        } catch (error) {
            // Form validation failed
            console.error('Validation error:', error);
        }
    };

    const steps = [
        {
            title: 'مسح الرمز',
        },
        {
            title: 'إدخال البيانات',
        },
        {
            title: 'التحقق',
        },
    ];

    return (
        <Modal
            title="إضافة مستخدم جديد"
            open={open}
            onCancel={handleCancel}
            footer={null}
            width={600}
            maskClosable={false}
            keyboard={false}
        >
            <Steps current={currentStep} items={steps} className="mb-6" />

            <Form form={form} layout="vertical" className="mt-6">
                {/* Step 1: QR Code */}
                {currentStep === 0 && (
                    <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
                        <Title style={{margin: 0}} level={4}>الخطوة 1</Title>
                        <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                            <Text style={{ margin: 0 }}>امسح الرمز وابدأ استخدام البوت بإرسال /start</Text>
                            <Image
                                src="/imgs/bot-qr-code.png"
                                alt="Bot QR Code"
                                width={240}
                                height="auto"
                                preview={false}
                                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghgg0Aj8i0JO4OzsrPv69Wv+hi2qPHr0qNvf39+iI97soRIh4f3z58/u7du3SXX7Xt7Z2enevHmzfQe+oSN2apSAPj09TSrb+XKI/f379+08+A0cNRE2ANkupk+ACNPvkSPcAAEibACyXUyfABGm3yNHuAECRNgAZLuYPgEirKlHu7u7XdyytGwHAd8jjNyng4OD7vnz51dbPT8/7z58+NB9+/bt6jU/TI+AGWHEnrx48eJ/EsSmHzx40L18+fLyzxF3ZVMjEyDCiEDjMYZZS5wiPXnyZFbJaxMhQIQRGzHvWR7XCyOCXsOmiDAi1HmPMMQjDpbpEiDCiL358eNHurW/5SnWdIBbXiDCiA38/Pnzrce2YyZ4//59F3ePLNMl4PbpiL2J0L979+7yDtHDhw8vtzzvdGnEXdvUigSIsCLAWavHp/+qM0BcXMd/q25n1vF57TYBp0a3mUzilePj4+7k5KSLb6gt6ydAhPUzXnoPR0dHl79WGTNCfBnn1uvSCJdegQhLI1vvCk+fPu2ePXt2tZOYEV6/fn31dz+shwAR1sP1cqvLntbEN9MxA9xcYjsxS1jWR4AIa2Ibzx0tc44fYX/16lV6NDFLXH+YL32jwiACRBiEbf5KcXoTIsQSpzXx4N28Ja4BQoK7rgXiydbHjx/P25TaQAJEGAguWy0+2Q8PD6/Ki4R8EVl+bzBOnZY95fq9rj9zAkTI2SxdidBHqG9+skdw43borCXO/ZcJdraPWdv22uIEiLA4q7nvvCug8WTqzQveOH26fodo7g6uFe/a17W3+nFBAkRYENRdb1vkkz1CH9cPsVy/jrhr27PqMYvENYNlHAIesRiBYwRy0V+8iXP8+/fvX11Mr7L7ECueb/r48eMqm7FuI2BGWDEG8cm+7G3NEOfmdcTQw4h9/55lhm7DekRYKQPZF2ArbXTAyu4kDYB2YxUzwg0gi/41ztHnfQG26HbGel/crVrm7tNY+/1btkOEAZ2M05r4FB7r9GbAIdxaZYrHdOsgJ/wCEQY0J74TmOKnbxxT9n3FgGGWWsVdowHtjt9Nnvf7yQM2aZU/TIAIAxrw6dOnAWtZZcoEnBpNuTuObWMEiLAx1HY0ZQJEmHJ3HNvGCBBhY6jtaMoEiJB0Z29vL6ls58vxPcO8/zfrdo5qvKO+d3Fx8Wu8zf1dW4p/cPzLly/dtv9Ts/EbcvGAHhHyfBIhZ6NSiIBTo0LNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiEC/wGgKKC4YMA4TAAAAABJRU5ErkJggg=="
                            />
                        </div>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Button onClick={handleCancel}>إلغاء</Button>
                            <Button type="primary" onClick={handleNext}>
                                التالي
                            </Button>
                        </Space>
                    </Space>
                )}

                {/* Step 2: User Information */}
                {currentStep === 1 && (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Title level={4}>الخطوة 2</Title>
                        <Text>ادخل اسمك وقم بقراءة معلوماتك التي أظهرها البوت وأدخلها هنا</Text>

                        <Form.Item
                            name="name"
                            label="الاسم"
                            rules={[{ required: true, message: 'يرجى إدخال الاسم' }]}
                        >
                            <Input placeholder="أدخل الاسم الكامل" />
                        </Form.Item>

                        <Form.Item
                            name="telegram_user_id"
                            label="معرف تيليجرام (Telegram ID)"
                            rules={[
                                { required: true, message: 'يرجى إدخال معرف تيليجرام' },
                                { pattern: /^\d+$/, message: 'يجب أن يكون معرف تيليجرام أرقام فقط' },
                            ]}
                        >
                            <Input placeholder="أدخل معرف تيليجرام" dir="ltr" />
                        </Form.Item>

                        <Form.Item
                            name="phone"
                            label="رقم الهاتف"
                            rules={[
                                { required: true, message: 'يرجى إدخال رقم الهاتف' },
                                { pattern: /^09\d{8}$/, message: 'رقم الهاتف يجب أن يبدأ بـ 09 ويتكون من 10 أرقام' },
                            ]}
                        >
                            <Input placeholder="09xxxxxxxx" dir="ltr" maxLength={10} />
                        </Form.Item>

                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Button onClick={handleCancel}>إلغاء</Button>
                            <Space>
                                <Button onClick={handlePrev}>السابق</Button>
                                <Button type="primary" onClick={handleNext} loading={loading}>
                                    التالي
                                </Button>
                            </Space>
                        </Space>
                    </Space>
                )}

                {/* Step 3: OTP Verification */}
                {currentStep === 2 && (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Title level={4}>التحقق</Title>
                        <Text>
                            تم إرسال رمز التحقق الخاص بك إلى البوت على تيليجرام
                        </Text>
                        <Text type="secondary">
                            يرجى فتح البوت والحصول على رمز التحقق ثم إدخاله هنا
                        </Text>

                        <Form.Item
                            name="otp"
                            label="رمز التحقق (OTP)"
                            rules={[
                                { required: true, message: 'يرجى إدخال رمز التحقق' },
                                { pattern: /^\d{6}$/, message: 'رمز التحقق يجب أن يتكون من 6 أرقام' },
                            ]}
                        >
                            <Input
                                placeholder="أدخل رمز التحقق المكون من 6 أرقام"
                                dir="ltr"
                                maxLength={6}
                                style={{ fontSize: '24px', letterSpacing: '8px', textAlign: 'center' }}
                            />
                        </Form.Item>

                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Button onClick={handleCancel}>إلغاء</Button>
                            <Space>
                                <Button onClick={handlePrev}>السابق</Button>
                                <Button type="primary" onClick={handleCreate} loading={loading}>
                                    إنشاء
                                </Button>
                            </Space>
                        </Space>
                    </Space>
                )}
            </Form>
        </Modal>
    );
}

'use client';

import React from 'react';
import { Button, Result } from 'antd';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/transfers';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Result
            status="error"
            title="حدث خطأ غير متوقع"
            subTitle="نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى."
            extra={[
              <Button type="primary" key="home" onClick={this.handleReset}>
                العودة للصفحة الرئيسية
              </Button>,
              <Button key="reload" onClick={() => window.location.reload()}>
                إعادة تحميل الصفحة
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

'use client';

import React, { useState } from 'react';
import { Button, Card, FileInput, Label, Alert, Spinner, type AlertProps } from 'flowbite-react';
import { HiInformationCircle, HiCheckCircle } from 'react-icons/hi';

// Định nghĩa kiểu cho trạng thái để code an toàn và rõ ràng hơn
type Status = { loading: boolean; message: string; type: AlertProps['color'] };

export default function ImportCsv() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Partial<Status>>({ loading: false, message: '' });

  const handleUpload = async () => {
    if (!file) return;
    setStatus({ loading: true, message: 'Đang xử lý dữ liệu...', type: 'info' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Sử dụng biến môi trường hoặc fallback về localhost
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiUrl}/admin/import/csv`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ loading: false, message: 'Thành công! Đã nạp dữ liệu gia phả.', type: 'success' });
      } else {
        setStatus({ loading: false, message: data.message || 'Lỗi nạp file', type: 'failure' });
      }
    } catch (error) {
      setStatus({ loading: false, message: 'Không kết nối được đến máy chủ Backend!', type: 'failure' });
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <h3 className="text-xl font-bold mb-4">Công cụ Import Gia phả (CSV)</h3>
        <div className="flex flex-col space-y-4">
          <div>
            <div className="mb-2 block">
              <Label htmlFor="file-upload">Chọn file CSV của bạn</Label>
            </div>
            <FileInput id="file-upload" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          
          <Button onClick={handleUpload} disabled={status.loading || !file} color="blue">
            {status.loading ? <><Spinner size="sm" className="mr-2" /> Đang xử lý...</> : 'Bắt đầu Import'}
          </Button>

          {status.message && status.type && (
            <Alert color={status.type} icon={status.type === 'success' ? HiCheckCircle : HiInformationCircle}>
              <span>{status.message}</span>
            </Alert>
          )}
        </div>
      </Card>
    </div>
  );
}
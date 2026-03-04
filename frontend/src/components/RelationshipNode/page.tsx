'use client';

import React, { useState } from 'react';
import { Button, Card, FileInput, Label, Spinner, Alert } from 'flowbite-react';
import { HiInformationCircle, HiCheckCircle } from 'react-icons/hi';

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState({ loading: false, message: '', type: '' });

  const handleUpload = async () => {
    if (!file) return;
    setStatus({ loading: true, message: 'Đang tải lên dữ liệu...', type: 'info' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:3000/api/v1/admin/import/csv', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ loading: false, message: 'Thành công! Dữ liệu gia phả đã được nạp.', type: 'success' });
      } else {
        setStatus({ loading: false, message: data.message || 'Lỗi khi nạp file', type: 'failure' });
      }
    } catch (error) {
      setStatus({ loading: false, message: 'Không kết nối được đến Server Backend!', type: 'failure' });
    }
  };

  return (
    <div className="p-6">
      <Card>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">🚀 Hệ thống Nạp Gia Phả (CSV)</h3>
        <p className="text-gray-600 mb-6">Chọn file <code className="bg-gray-100 px-1 text-red-600">Gop_2_sheet_Sieu_Sach (1).csv</code> để bắt đầu.</p>
        
        <div className="space-y-4">
          <div>
            <div className="mb-2 block">
              <Label htmlFor="file-upload" value="Chọn tệp tin từ máy tính" />
            </div>
            <FileInput id="file-upload" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={status.loading || !file}
            color="blue"
            className="w-full"
          >
            {status.loading ? <><Spinner size="sm" className="mr-2" /> ĐANG XỬ LÝ...</> : 'BẮT ĐẦU IMPORT'}
          </Button>

          {status.message && (
            <Alert color={status.type as any} icon={status.type === 'success' ? HiCheckCircle : HiInformationCircle}>
              <span>{status.message}</span>
            </Alert>
          )}
        </div>
      </Card>
    </div>
  );
}
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
      // Sử dụng biến môi trường NEXT_PUBLIC_API_URL.
      // Fallback về port 9999 của backend nếu biến môi trường không được set.
      // Lỗi "Cannot POST" thường xảy ra nếu URL này trỏ sai (ví dụ: trỏ về port 3000 của frontend).
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999/api/v1';
      // Loại bỏ dấu gạch chéo cuối nếu có để tránh lỗi "//" (ví dụ: .../api/v1//admin...)
      const apiUrl = baseUrl.replace(/\/$/, '');
      const fullUrl = `${apiUrl}/admin/import/csv`;

      console.log('Đang gửi request tới:', fullUrl); // Log để kiểm tra chính xác URL

      const res = await fetch(fullUrl, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setStatus({ loading: false, message: 'Thành công! Đã nạp dữ liệu gia phả.', type: 'success' });
      } else {
        // Xử lý lỗi HTTP chi tiết hơn
        let errorMessage = `Lỗi từ server: ${res.status} ${res.statusText}`;
        if (res.status === 404) {
          errorMessage = "Lỗi 404: Không tìm thấy API. Vui lòng kiểm tra lại cấu hình Controller và Module ở Backend.";
        } else {
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || JSON.stringify(errorData);
          } catch (jsonError) {
            // Giữ lại thông báo lỗi gốc nếu response không phải là JSON
          }
        }
        setStatus({ loading: false, message: errorMessage, type: 'failure' });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      const message = error instanceof Error ? error.message : 'Lỗi không xác định';
      setStatus({ loading: false, message: `Lỗi mạng: Không thể gửi yêu cầu đến Backend. (${message})`, type: 'failure' });
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
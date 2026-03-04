'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { personService } from '@/services/person.service';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.warn('Hãy chọn một file CSV để nạp dữ liệu!');
      return;
    }
    setLoading(true);

    try {
      const response = await personService.importCsv(file);
      toast.success(response.message || 'Nạp dữ liệu thành công!');
    } catch (error: any) {
      console.error('Import failed:', error);
      const errorMessage =
        error.response?.data?.message ||
        'Có lỗi xảy ra khi nạp dữ liệu từ server.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Nạp dữ liệu Gia phả (CSV)
      </h1>
      <p className="mb-6 text-gray-600">
        Chọn file CSV chứa dữ liệu thành viên để nạp vào hệ thống. Vui lòng đảm bảo file có cấu trúc cột đúng theo mẫu.
      </p>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full max-w-md text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="w-full max-w-md py-2.5 px-4 rounded-lg font-bold text-white transition-all bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'Bắt đầu Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
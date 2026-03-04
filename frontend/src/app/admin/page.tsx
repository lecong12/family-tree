'use client';

import React from 'react';
import ImportCsv from '@/components/admin/ImportCsv';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Nếu đang tải thì hiện loading
    if (loading) return <div className="p-10 text-center">Đang kiểm tra quyền truy cập...</div>;

    // Bảo mật: Nếu không phải admin thì không cho xem trang này (Tùy chọn)
    if (!user) {
        return (
            <div className="p-10 text-center">
                <p className="text-red-500">Bạn cần đăng nhập để vào trang này.</p>
                <button onClick={() => router.push('/login')} className="text-blue-500 underline">Đến trang đăng nhập</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Bảng điều khiển Admin</h1>
                    <button 
                        onClick={() => router.push('/persons')}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        Quay lại Cây gia phả
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">
                        Công cụ Nạp dữ liệu CSV (964 người)
                    </h2>
                    {/* Đây là linh kiện bạn đã tạo trong thư mục components/admin */}
                    <ImportCsv />
                </div>
            </div>
        </div>
    );
}
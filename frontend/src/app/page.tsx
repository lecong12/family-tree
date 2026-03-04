'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Home() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [status, setStatus] = useState<{ type: 'loading' | 'success' | 'error'; msg: string }>({
        type: 'loading',
        msg: 'Đang kiểm tra kết nối tới Backend...',
    });

    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
    // Tự động thêm https:// nếu người dùng quên nhập (để tránh lỗi Network Error)
    const apiUrl = rawApiUrl && !rawApiUrl.startsWith('http') ? `https://${rawApiUrl}` : rawApiUrl;

    useEffect(() => {
        const checkConnection = async () => {
            if (!apiUrl) {
                setStatus({ type: 'error', msg: 'Chưa cấu hình biến môi trường NEXT_PUBLIC_API_URL' });
                return;
            }

            try {
                // Gọi thử vào API để xem có phản hồi không
                await axios.get(apiUrl);
                setStatus({ type: 'success', msg: 'Kết nối Backend thành công!' });
            } catch (err: any) {
                if (err.code === 'ERR_NETWORK') {
                    setStatus({
                        type: 'error',
                        msg: 'Lỗi mạng: Không thể kết nối tới Backend. Hãy kiểm tra xem Server đã chạy chưa và đúng Port không?',
                    });
                } else if (err.response) {
                    // Server có phản hồi (dù là 404, 401...) nghĩa là đã thông mạng
                    setStatus({ type: err.response.status === 200 ? 'success' : 'error', msg: `Kết nối Backend OK (Status: ${err.response.status})` });
                } else {
                    setStatus({ type: 'error', msg: `Lỗi: ${err.message}` });
                }
            }
        };

        checkConnection();
    }, [apiUrl]);

    // Redirect logic
    useEffect(() => {
        if (!loading && status.type === 'success') {
            // Delay 1 chút để user thấy trạng thái xanh
            const timer = setTimeout(() => {
                if (user) {
                    router.replace('/persons');
                } else {
                    router.replace('/login');
                }
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [user, loading, status.type, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Kiểm tra hệ thống</h1>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">API URL</label>
                        <div className="bg-gray-100 p-2 rounded text-sm font-mono break-all border border-gray-200">
                            {apiUrl || 'Undefined'}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Trạng thái kết nối</label>
                        <div
                            className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                                status.type === 'loading'
                                    ? 'bg-blue-50 text-blue-700'
                                    : status.type === 'success'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-red-50 text-red-700'
                            }`}
                        >
                            {status.type === 'loading' && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                            {status.msg}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Trạng thái đăng nhập</label>
                        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                            {loading ? 'Đang tải thông tin user...' : user ? `Đã đăng nhập: ${user.username}` : 'Chưa đăng nhập'}
                        </div>
                    </div>
                </div>

                {status.type === 'error' && (
                    <div className="mt-6">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Thử lại
                        </button>
                        <div className="mt-3 text-center">
                            <button onClick={() => router.push('/login')} className="text-sm text-gray-500 hover:text-gray-700 underline">
                                Bỏ qua kiểm tra, vào trang đăng nhập
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
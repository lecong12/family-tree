'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // QUAN TRỌNG: Đã xóa useEffect kiểm tra token tại đây.
    // Trang login không nên tự động chuyển hướng người dùng đã có token.
    // Điều này phá vỡ vòng lặp chuyển hướng.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999/api/v1';
            const response = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Đăng nhập thất bại');
            }

            const data = await response.json();
            
            // Sửa lỗi: NestJS trả về 'access_token'
            const token = data.accessToken || data.access_token;

            if (token) {
                localStorage.setItem('accessToken', token);
                // Dùng `replace` để trang login không nằm trong lịch sử trình duyệt
                router.replace('/persons');
            } else {
                throw new Error('Không nhận được token từ server');
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Đã có lỗi xảy ra';
            // Cung cấp hướng dẫn cụ thể khi gặp lỗi sai mật khẩu
            if (errorMessage.toLowerCase().includes('invalid credentials')) {
                setError('Sai mật khẩu. Vui lòng kiểm tra biến ADMIN_PASSWORD trong file .env của backend.');
            } else {
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Đăng nhập Quản trị</h1>
                    <p className="text-sm text-gray-500 mt-1">Tài khoản: admin</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Trường Tên đăng nhập bị ẩn, giá trị mặc định là 'admin' */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div>
                        <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                        </button>
                    </div>
                </form>
                <div className="text-center text-xs text-gray-400 pt-4 border-t">
                    <p>Hỗ trợ kỹ thuật: 0123.456.789</p>
                    <p>Phần mềm quản lý gia phả</p>
                </div>
            </div>
        </div>
    );
}
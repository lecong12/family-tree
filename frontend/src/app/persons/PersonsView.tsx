'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Person } from 'src/types/person';

export default function PersonsView() {
    // Gộp tất cả state và logic vào một nơi duy nhất
    const [persons, setPersons] = useState<Person[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const checkAuthAndFetchData = async () => {
            const token = localStorage.getItem('accessToken');

            // Kịch bản 1: Không có token -> Chuyển hướng dứt khoát về trang login
            if (!token) {
                router.replace('/login');
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999/api/v1';
                const response = await fetch(`${apiUrl}/person`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                // Kịch bản 2: Token không hợp lệ -> Xóa token và chuyển hướng dứt khoát
                if (response.status === 401) {
                    localStorage.removeItem('accessToken');
                    router.replace('/login');
                    return;
                }

                if (!response.ok) {
                    throw new Error(`Lỗi khi tải dữ liệu: ${response.status} ${response.statusText}`);
                }

                // Kịch bản 3: Thành công -> Cập nhật dữ liệu
                const result = await response.json();
                if (isMounted) {
                    setPersons(result);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error('Lỗi không xác định'));
                }
            } finally {
                // Chỉ tắt loading nếu component còn tồn tại và không bị chuyển hướng
                // (Kiểm tra xem `persons` đã được set chưa để biết có fetch thành công không)
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        checkAuthAndFetchData();

        return () => {
            isMounted = false;
        };
    }, [router]);

    const filteredPersons = persons?.filter((person) =>
        person.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Hiển thị loading cho đến khi có dữ liệu hoặc bị chuyển hướng
    if (isLoading || !persons) {
        return <div className="text-center p-10">Đang tải...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">Lỗi: {error.message}</div>;
    }

    // Chỉ render giao diện chính khi đã xác thực thành công và có dữ liệu
    return (
        <div className="container mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Danh sách thành viên</h1>
                <button
                    onClick={() => {
                        localStorage.removeItem('accessToken');
                        router.replace('/login');
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                    Đăng xuất
                </button>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Tìm kiếm thành viên..."
                    className="w-full p-2 border rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ và Tên</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giới tính</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày sinh</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPersons?.map((person) => (
                            <tr key={person._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Link href={`/persons/${person._id}`} className="text-blue-600 hover:underline font-medium">
                                        {person.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {person.gender === 0 ? 'Nam' : 'Nữ'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(person.birth).toLocaleDateString('vi-VN')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
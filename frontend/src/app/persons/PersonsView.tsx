'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Person } from 'src/types/person';

export default function PersonsView() {
    // Gộp tất cả state và logic vào một nơi duy nhất
    const [persons, setPersons] = useState<Person[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        let isMounted = true;

        const checkAuthAndFetchData = async () => {
            const token = localStorage.getItem('accessToken');

            // Kịch bản 1: Không có token -> Chuyển hướng ngay lập tức
            if (!token) {
                window.location.replace('/login');
                return; // Dừng mọi hoạt động
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999/api/v1';
                const response = await fetch(`${apiUrl}/person`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                // Kịch bản 2: Token không hợp lệ -> Dọn dẹp và chuyển hướng
                if (response.status === 401) {
                    localStorage.removeItem('accessToken');
                    window.location.replace('/login');
                    return; // Dừng mọi hoạt động
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
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        checkAuthAndFetchData();

        return () => {
            isMounted = false;
        };
    }, []); // Dependency rỗng để đảm bảo chỉ chạy MỘT LẦN DUY NHẤT

    const filteredPersons = persons?.filter((person) =>
        person.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (isLoading) {
        return <div className="text-center p-10">Đang tải...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">Lỗi: {error.message}</div>;
    }

    // Chỉ render giao diện chính khi đã xác thực thành công và có dữ liệu
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Danh sách thành viên</h1>
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
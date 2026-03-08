'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FamilyTree from '@/components/FamilyTree';

export default function PersonsPage() {
    const [treeData, setTreeData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTree = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                if (!apiUrl) throw new Error('API URL not configured');

                // 1. Lấy danh sách người để tìm người gốc (hoặc hardcode ID nếu muốn)
                const listRes = await axios.get(`${apiUrl}/persons`);
                const persons = listRes.data;

                if (persons.length > 0) {
                    // Giả sử người đầu tiên là tổ phụ, hoặc tìm người có birth nhỏ nhất
                    // Ở đây lấy người đầu tiên trong danh sách trả về
                    const rootPersonId = persons[0]._id;

                    // 2. Gọi API lấy cây gia phả 5 thế hệ
                    // Endpoint này phải khớp với Controller gọi service.getNGenerations
                    // Giả định route backend là GET /persons/:id/tree?generations=5
                    const treeRes = await axios.get(`${apiUrl}/persons/${rootPersonId}/tree`, {
                        params: { generations: 5 }
                    });
                    
                    setTreeData(treeRes.data);
                } else {
                    setError('Không tìm thấy dữ liệu nhân sự nào.');
                }
            } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };

        fetchTree();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-screen text-blue-600 font-medium">
            Đang khôi phục cây gia phả...
        </div>
    );

    if (error) return <div className="p-8 text-red-500 text-center">Lỗi: {error}</div>;

    return (
        <FamilyTree data={treeData} />
    );
}
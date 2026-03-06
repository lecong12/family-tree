'use client';

import React, { useState, useEffect } from 'react';

interface PersonSearchResult {
    _id: string;
    name: string;
    cccd: string;
    slug: string;
}

interface SearchBarProps {
    onNodeSelect: (nodeId: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onNodeSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PersonSearchResult[]>([]);
    const [, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        // Nếu query rỗng, ta vẫn có thể fetch danh sách mặc định (ví dụ 10 người đầu tiên)
        // Hoặc chỉ tìm khi có query. Ở đây tôi sẽ sửa để hỗ trợ cả 2:
        // Nếu query rỗng -> fetch danh sách mặc định (hoặc không làm gì tùy logic bạn muốn).
        // Nhưng theo yêu cầu "droplist", ta nên fetch danh sách ban đầu.
        const searchTerm = query.trim();

        const search = async () => {
            setLoading(true);
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999/api/v1';
                // Nếu không có query, gọi API lấy danh sách mặc định (hoặc search rỗng để lấy all/limit)
                // Lưu ý: Backend cần xử lý trường hợp name rỗng nếu muốn trả về list mặc định.
                // Hiện tại backend check if (!name || name.trim().length < 2) return [];
                // Nên ta chỉ search khi có query >= 2 ký tự, HOẶC ta sửa backend để hỗ trợ empty search.
                // Để an toàn với backend hiện tại, ta chỉ search khi có query.
                
                if (searchTerm.length >= 1) {
                     const res = await fetch(`${apiUrl}/person/search?name=${searchTerm}`);
                     const data = await res.json();
                     setResults(data);
                     setShowDropdown(true);
                } else {
                    setResults([]);
                    setShowDropdown(false);
                }
            } catch (error) {
                console.error("Lỗi khi tìm kiếm:", error);
            } finally {
                setLoading(false);
            }
        };

        const debounceSearch = setTimeout(() => search(), 300);

        return () => clearTimeout(debounceSearch);
    }, [query]);

    const handleSelect = (person: PersonSearchResult) => {
        onNodeSelect(person._id); // Dùng _id làm ID cho node để khớp với ReactFlow
        setQuery(person.name);
        setShowDropdown(false);
    };

    return (
        <div className="absolute top-4 left-4 z-50 bg-white p-2 rounded shadow-lg w-64">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                    if (results.length > 0) setShowDropdown(true);
                }}
                placeholder="Tìm kiếm thành viên..."
                className="w-full p-2 border rounded"
            />
            {showDropdown && results.length > 0 && (
                <ul className="mt-2 border rounded bg-white max-h-60 overflow-y-auto">
                    {results.map((person) => (
                        <li key={person._id} onClick={() => handleSelect(person)} className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0">
                            <div className="font-semibold">{person.name}</div>
                            <div className="text-xs text-gray-500">
                                {person.cccd || person.slug}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
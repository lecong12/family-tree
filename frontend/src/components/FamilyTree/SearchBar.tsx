'use client';

import React, { useState, useEffect } from 'react';
import { HiSearch, HiX } from 'react-icons/hi';

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
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const search = async (searchTerm: string) => {
        setLoading(true);
        try {
            // Sử dụng biến môi trường hoặc fallback về localhost:9999
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999/api/v1';
            const apiUrl = baseUrl.replace(/\/$/, ''); // Xóa dấu / cuối nếu có
            
            // Gọi API search. Nếu searchTerm rỗng, backend sẽ trả về danh sách mặc định.
            const res = await fetch(`${apiUrl}/person/search?name=${encodeURIComponent(searchTerm)}`);
            
            if (res.ok) {
                const data = await res.json();
                setResults(data);
                // Chỉ hiện dropdown nếu có kết quả và người dùng đang focus (hoặc vừa gõ)
                // Logic này sẽ được xử lý ở nơi gọi hàm hoặc useEffect
            }
        } catch (error) {
            console.error("Lỗi khi tìm kiếm:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const searchTerm = query.trim();

        // Debounce: Chờ 300ms sau khi ngừng gõ mới gọi API
        // Gọi search() ngay cả khi query rỗng để lấy danh sách mặc định
        const debounceSearch = setTimeout(() => {
            search(searchTerm);
        }, 300);

        return () => clearTimeout(debounceSearch);
    }, [query]);

    const handleSelect = (person: PersonSearchResult) => {
        onNodeSelect(person._id); // Dùng _id làm ID cho node để khớp với ReactFlow
        setQuery(person.name);
        setShowDropdown(false);
    };

    return (
        <div className="absolute top-4 left-4 z-50 w-72">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <HiSearch className="w-5 h-5 text-gray-500" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    // Khi focus, nếu đã có kết quả (từ lần load trước hoặc mặc định) thì hiện dropdown
                    // Nếu chưa có, useEffect sẽ chạy (do query không đổi nhưng component render lại) hoặc ta có thể kích hoạt search tại đây nếu cần thiết logic phức tạp hơn.
                    // Với logic useEffect hiện tại, nó sẽ tự động fetch khi mount, nên results thường đã có dữ liệu.
                    onFocus={() => {
                        setShowDropdown(true);
                        if (results.length === 0) search(''); // Gọi search rỗng để lấy list mặc định nếu chưa có
                    }}
                    placeholder="Tìm kiếm thành viên..."
                    className="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 shadow-md transition-all duration-200 ease-in-out"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    ) : query ? (
                        <button
                            onClick={() => {
                                setQuery('');
                                setResults([]);
                                setShowDropdown(false);
                            }}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            <HiX className="w-5 h-5" />
                        </button>
                    ) : null}
                </div>
            </div>

            {showDropdown && results.length > 0 && (
                <ul className="mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
                    {results.map((person) => (
                        <li 
                            key={person._id} 
                            onClick={() => handleSelect(person)} 
                            className="p-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                        >
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

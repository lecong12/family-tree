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

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const search = async () => {
            setLoading(true);
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999/api/v1';
                const res = await fetch(`${apiUrl}/person/search?name=${query}`);
                const data = await res.json();
                setResults(data);
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
        setResults([]);
    };

    return (
        <div className="absolute top-4 left-4 z-50 bg-white p-2 rounded shadow-lg w-64">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm thành viên..."
                className="w-full p-2 border rounded"
            />
            {results.length > 0 && (
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
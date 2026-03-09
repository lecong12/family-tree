'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import UserMenu from './UserMenu/UserMenu';
import { FilterMode } from '../types';
import { useAuth } from '../context/AuthContext';

// A minimal person type for search results
interface SearchPerson {
    _id: string;
    name: string;
    avatar: string;
}

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999/api/v1',
});

function SearchBar({ onPersonSelect }: { onPersonSelect: (personId: string) => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchPerson[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (query.trim() === '') {
            setResults([]);
            setIsDropdownOpen(false);
            return;
        }

        setIsLoading(true);
        const timerId = setTimeout(() => {
            api.get(`/persons/search/${encodeURIComponent(query)}`)
                .then(res => {
                    setResults(res.data);
                    setIsLoading(false);
                    setIsDropdownOpen(true);
                })
                .catch(err => {
                    console.error("Search failed:", err);
                    setIsLoading(false);
                });
        }, 300); // 300ms debounce

        return () => clearTimeout(timerId);
    }, [query]);

    const handleSelect = (person: SearchPerson) => {
        setQuery('');
        setResults([]);
        setIsDropdownOpen(false);
        onPersonSelect(person._id);
    };

    return (
        <div className="relative w-64" ref={searchRef}>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query && results.length > 0 && setIsDropdownOpen(true)}
                placeholder="Tìm thành viên trong cây..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isDropdownOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                    {isLoading && <div className="p-3 text-sm text-gray-500 text-center">Đang tìm...</div>}
                    {!isLoading && results.length === 0 && query.trim() !== '' && (
                        <div className="p-3 text-sm text-gray-500 text-center">Không tìm thấy kết quả.</div>
                    )}
                    {!isLoading && results.map(person => (
                        <div
                            key={person._id}
                            onClick={() => handleSelect(person)}
                            className="flex items-center p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                        >
                            <img src={person.avatar} alt={person.name} className="w-8 h-8 rounded-full mr-3" />
                            <span className="text-sm font-medium text-gray-800">{person.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

interface HeaderProps {
    isolatedCount: number;
    filterMode: FilterMode;
    onFilterModeChange: (mode: FilterMode) => void;
    onOpenGuestCodeModal: () => void;
    currentView: 'list' | 'tree';
    onChangeView: (view: 'list' | 'tree') => void;
    onPersonSelect: (personId: string) => void;
}

export default function Header({ 
    isolatedCount, 
    filterMode, 
    onFilterModeChange, 
    onOpenGuestCodeModal,
    currentView,
    onChangeView,
    onPersonSelect
}: HeaderProps) {
    const { isAdmin, logout, user } = useAuth();

    return (
        <header className="flex-shrink-0 flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-200 shadow-sm w-full font-sans">
            <button 
                type="button"
                onClick={(e) => { 
                    e.preventDefault(); 
                    onChangeView('tree'); 
                    onFilterModeChange('all'); // Reset filter khi chuyển sang Tree
                }}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-all duration-150 ${
                    currentView === 'tree' && filterMode !== 'isolated' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
            >
                Cây gia phả
            </button>

            <span className="text-gray-300">|</span>

            <button 
                type="button"
                onClick={(e) => { 
                    e.preventDefault(); 
                    onChangeView('list'); 
                    onFilterModeChange('all'); // Reset filter khi chuyển sang List
                }}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-all duration-150 ${
                    currentView === 'list' && filterMode !== 'isolated'
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
            >
                Danh sách thành viên
            </button>

            {isolatedCount > 0 && (
                <button
                    type="button"
                    onClick={() => {
                        onFilterModeChange('isolated'); // Chọn chế độ isolated (không toggle)
                        onChangeView('list'); // Tự động chuyển sang dạng list để dễ xem
                    }}
                    className={`ml-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        filterMode === 'isolated'
                            ? 'bg-amber-600 text-white shadow-md' // Active style
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                >
                    {isolatedCount} chưa có liên hệ
                </button>
            )}

            {/* Search Bar for Tree View */}
            {currentView === 'tree' && (
                <div className="ml-4">
                    <SearchBar onPersonSelect={onPersonSelect} />
                </div>
            )}

            <div className="ml-auto">
                {user && <UserMenu user={user} isAdmin={isAdmin} onLogout={logout} onOpenGuestCodeModal={onOpenGuestCodeModal} />}
            </div>
        </header>
    );
}

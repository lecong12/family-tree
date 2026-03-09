'use client';

import React from 'react';
import UserMenu from './UserMenu/UserMenu';
import { FilterMode } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
    isolatedCount: number;
    filterMode: FilterMode;
    onFilterModeChange: (mode: FilterMode) => void;
    onOpenGuestCodeModal: () => void;
    currentView: 'list' | 'tree';
    onChangeView: (view: 'list' | 'tree') => void;
}

export default function Header({ 
    isolatedCount, 
    filterMode, 
    onFilterModeChange, 
    onOpenGuestCodeModal,
    currentView,
    onChangeView
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

            <div className="ml-auto">
                {user && <UserMenu user={user} isAdmin={isAdmin} onLogout={logout} onOpenGuestCodeModal={onOpenGuestCodeModal} />}
            </div>
        </header>
    );
}

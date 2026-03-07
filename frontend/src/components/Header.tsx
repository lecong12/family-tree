'use client';

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
                onClick={(e) => { e.preventDefault(); onChangeView('tree'); }}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-all duration-150 ${
                    currentView === 'tree' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
            >
                Cây gia phả
            </button>

            <span className="text-gray-300">|</span>

            <button 
                type="button"
                onClick={(e) => { e.preventDefault(); onChangeView('list'); }}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-all duration-150 ${
                    currentView === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
            >
                Danh sách thành viên
            </button>

            {isolatedCount > 0 && (
                <button
                    type="button"
                    onClick={() => onFilterModeChange(filterMode === 'isolated' ? 'all' : 'isolated')}
                    className="ml-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
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

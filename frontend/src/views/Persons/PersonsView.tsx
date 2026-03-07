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
        <header className="flex-shrink-0 flex items-center justify-between px-4 h-14 bg-white border-b border-gray-200 shadow-sm w-full font-sans">
            
            {/* NHÓM BÊN TRÁI: LOGO & ĐIỀU HƯỚNG CHÍNH */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                
                {/* NÚT TRANG CHỦ (MỚI THÊM) */}
                <button 
                    onClick={() => window.location.href = '/'} 
                    className="flex items-center justify-center p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Về trang chủ"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </button>

                <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>

                {/* Nút Cây gia phả */}
                <button 
                    onClick={() => onChangeView('tree')}
                    className={`whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-md transition-all ${
                        currentView === 'tree' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    Cây gia phả
                </button>

                {/* Nút Danh sách */}
                <button 
                    onClick={() => onChangeView('list')}
                    className={`whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-md transition-all ${
                        currentView === 'list' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    Danh sách
                </button>

                {/* Badge báo người chưa liên hệ */}
                {isolatedCount > 0 && (
                    <button
                        onClick={() => onFilterModeChange(filterMode === 'isolated' ? 'all' : 'isolated')}
                        className={`whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                            filterMode === 'isolated' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'
                        }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                        <span className="hidden sm:inline">{isolatedCount} chưa liên hệ</span>
                        <span className="sm:hidden">{isolatedCount}</span>
                    </button>
                )}
            </div>

            {/* NHÓM BÊN PHẢI: TÀI KHOẢN (LUÔN CỐ ĐỊNH) */}
            <div className="flex-shrink-0 flex items-center ml-4">
                {user && (
                    <UserMenu 
                        user={user} 
                        isAdmin={isAdmin} 
                        onLogout={logout} 
                        onOpenGuestCodeModal={onOpenGuestCodeModal} 
                    />
                )}
            </div>
        </header>
    );
}

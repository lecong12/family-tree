'use client';

import { useRouter } from 'next/navigation';

// Chú ý: Dùng đường dẫn tương đối chính xác từ vị trí file này
import UserMenu from '../../../components/UserMenu/UserMenu'; 
import { FilterMode } from '../types';
import { useAuth } from '../../../context/AuthContext';

interface HeaderProps {
    isolatedCount: number;
    filterMode: FilterMode;
    onFilterModeChange: (mode: FilterMode) => void;
    onOpenGuestCodeModal: () => void;
    viewMode: 'list' | 'tree';
    onViewModeChange: (view: 'list' | 'tree') => void;
}

export default function Header({ 
    isolatedCount, 
    filterMode, 
    onFilterModeChange, 
    onOpenGuestCodeModal,
    viewMode,
    onViewModeChange
}: HeaderProps) {
    const { isAdmin, logout, user } = useAuth();
    const router = useRouter();

    return (
        <header className="flex-shrink-0 flex items-center justify-between px-4 h-14 bg-white border-b border-gray-200 shadow-sm w-full font-sans">
            
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {/* NÚT TRANG CHỦ */}
                <button 
                    onClick={() => router.push('/')} 
                    className="flex items-center justify-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </button>

                <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>

                <button 
                    onClick={() => onViewModeChange('tree')}
                    className={`whitespace-nowrap text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
                        viewMode === 'tree' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    Cây gia phả
                </button>

                <button 
                    onClick={() => onViewModeChange('list')}
                    className={`whitespace-nowrap text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
                        viewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    Danh sách
                </button>

                {isolatedCount > 0 && (
                    <button
                        onClick={() => onFilterModeChange(filterMode === 'isolated' ? 'all' : 'isolated')}
                        className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                            filterMode === 'isolated' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                        <span>{isolatedCount} CHƯA LIÊN HỆ</span>
                    </button>
                )}
            </div>

            <div className="flex-shrink-0 flex items-center ml-4">
                {user && <UserMenu user={user} isAdmin={isAdmin} onLogout={logout} onOpenGuestCodeModal={onOpenGuestCodeModal} />}
            </div>
        </header>
    );
}
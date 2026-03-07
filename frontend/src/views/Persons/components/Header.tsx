import UserMenu from 'src/components/UserMenu/UserMenu';
import { FilterMode } from '../types';
import { useAuth } from 'src/context/AuthContext';

interface HeaderProps {
    isolatedCount: number;
    filterMode: FilterMode;
    onFilterModeChange: (mode: FilterMode) => void;
    onOpenGuestCodeModal: () => void;
    currentView: 'list' | 'tree';
    onChangeView: (view: 'list' | 'tree') => void;
}

export default function Header({ isolatedCount, filterMode, onFilterModeChange, onOpenGuestCodeModal, currentView, onChangeView }: HeaderProps) {
    const { isAdmin, logout, user } = useAuth();

    return (
        <header className="flex-shrink-0 flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-200 shadow-sm">
            {/* Tree View Button */}
            <button
                onClick={() => onChangeView('tree')}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-all ${
                    currentView === 'tree' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:text-blue-600'
                }`}
            >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Cây gia phả
            </button>

            <span className="text-gray-300">|</span>

            {/* List View Button */}
            <button
                onClick={() => onChangeView('list')}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-all ${
                    currentView === 'list' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:text-blue-600'
                }`}
            >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Danh sách thành viên
            </button>

            {/* Isolated filter badge */}
            {isolatedCount > 0 && (
                <button
                    onClick={() => onFilterModeChange(filterMode === 'isolated' ? 'all' : 'isolated')}
                    className={`ml-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        filterMode === 'isolated' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                    title="Lọc người chưa có mối liên hệ nào trong cây"
                >
                    <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    {isolatedCount} chưa có liên hệ
                    {filterMode === 'isolated' && (
                        <svg className="w-3 h-3 ml-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                </button>
            )}

            <div className="ml-auto flex items-center gap-2">{user && <UserMenu user={user} isAdmin={isAdmin} onLogout={logout} onOpenGuestCodeModal={onOpenGuestCodeModal} />}</div>
        </header>
    );
}

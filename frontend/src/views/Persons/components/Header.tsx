import UserMenu from 'src/components/UserMenu/UserMenu';
import { FilterMode } from '../types';
import { useAuth } from 'src/context/AuthContext';

type ViewMode = 'list' | 'tree' | 'stats' | 'events' | 'settings';

interface HeaderProps {
    isolatedCount: number;
    filterMode: FilterMode;
    onFilterModeChange: (mode: FilterMode) => void;
    onOpenGuestCodeModal: () => void;
    currentView: ViewMode;
    onChangeView: (view: ViewMode) => void;
}

export default function Header({ isolatedCount, filterMode, onFilterModeChange, onOpenGuestCodeModal, currentView, onChangeView }: HeaderProps) {
    const { isAdmin, logout, user } = useAuth();

    const tabs: { id: ViewMode; label: string }[] = [
        { id: 'tree', label: 'Cây gia phả' },
        { id: 'list', label: 'Thành viên' },
        { id: 'stats', label: 'Thống kê' },
        { id: 'events', label: 'Sự kiện' },
        { id: 'settings', label: 'Cài đặt' },
    ];

    return (
        <header className="flex-shrink-0 flex items-center h-14 bg-white border-b border-gray-200 shadow-sm w-full relative z-30">
            {/* Vùng Tabs: Cho phép cuộn ngang trên mobile */}
            <div className="flex-1 flex items-center overflow-x-auto px-4 gap-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChangeView(tab.id)}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 flex-shrink-0 ${
                            currentView === tab.id
                                ? 'bg-blue-100 text-blue-700 shadow-sm ring-1 ring-blue-200'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}

                {(currentView === 'tree' || currentView === 'list') && isolatedCount > 0 && (
                    <button
                        type="button"
                        onClick={() => {
                            onFilterModeChange("isolated");
                            if (currentView !== 'list') onChangeView("list");
                        }}
                        className={`flex-shrink-0 ml-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                            filterMode === "isolated"
                                ? "bg-amber-600 text-white shadow-md"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        }`}
                    >
                        {isolatedCount} chưa có liên hệ
                    </button>
                )}
            </div>

            {/* Vùng User Menu: Cố định bên phải */}
            <div className="flex-shrink-0 px-2 md:px-4 border-l border-gray-100 bg-white h-full flex items-center">
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

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Person } from 'src/services/personService';
import { useAuth } from 'src/context/AuthContext';
import { useFamilyData } from 'src/hooks/useFamilyData';
import LoadingOverlay from 'src/components/LoadingOverlay/LoadingOverlay';
import PersonDetailModal from 'src/components/PersonDetailModal/PersonDetailModal';
import AddSpouseModal from 'src/components/AddSpouseModal/AddSpouseModal';
import AddChildModal from 'src/components/AddChildModal/AddChildModal';
import AddPersonModal from 'src/components/AddPersonModal/AddPersonModal';
import GuestCodeModal from 'src/components/GuestCodeModal/GuestCodeModal';

import Header from './components/Header';
import Toolbar from './components/Toolbar';
import PersonList from './components/PersonList';
import Pagination from './components/Pagination';
import { FilterMode, PageSize, SortDirection, SortField } from './types';
import { buildConnectedIds } from './utils';
import FamilyTreeFlow from 'src/components/FamilyTree/FamilyTreeFlow';
import StatsView from './components/StatsView'; // Import component thống kê mới
import EventsView from './components/EventsView'; // Import component sự kiện mới
import { toast } from 'react-toastify';

export default function PersonsView() {
    const router = useRouter();
    const { isAdmin, isEditor, logout, user, loading: authLoading } = useAuth();

    // Redirect non-logged-in users
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [authLoading, user, router]);

    const { persons, spouses, parentChilds, isLoading, refetchAll } = useFamilyData();

    // Modal state
    const [personDetailModalOpen, setPersonDetailModalOpen] = useState(false);
    const [addSpouseModalOpen, setAddSpouseModalOpen] = useState(false);
    const [addChildModalOpen, setAddChildModalOpen] = useState(false);
    const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
    const [guestCodeModalOpen, setGuestCodeModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [selectedSpouseIdForChild, setSelectedSpouseIdForChild] = useState<string | null>(null);

    // List state
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState<PageSize>(30);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    
    // Settings State with localStorage persistence
    const [viewMode, setViewMode] = useState<'list' | 'tree' | 'stats' | 'events' | 'settings'>(() => {
        if (typeof window !== 'undefined') {
            const savedView = localStorage.getItem('family-tree-viewMode');
            // Ensure savedView is a valid view mode, otherwise default to 'list'
            if (savedView && ['list', 'tree', 'stats', 'events', 'settings'].includes(savedView)) {
                return savedView as any;
            }
        }
        // Default to 'list' if no valid saved view is found or on server-side
        return 'list';
    });
    const [sortByNamePreference, setSortByNamePreference] = useState<'firstName' | 'lastName'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('family-tree-sortByName') as any) || 'lastName';
        }
        return 'lastName';
    });
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('family-tree-theme') as any) || 'light';
        }
        return 'light';
    });

    // Relationship index
    const connectedIds = useMemo(() => buildConnectedIds(spouses, parentChilds), [spouses, parentChilds]);

    const personById = useMemo(() => {
        const map = new Map<string, Person>();
        persons.forEach((p) => {
            if (p._id) map.set(p._id, p);
        });
        return map;
    }, [persons]);

    // Sync selected person after refetch
    useEffect(() => {
        if (selectedPerson?._id) {
            const updated = personById.get(selectedPerson._id);
            if (updated && updated !== selectedPerson) setSelectedPerson(updated);
        }
    }, [personById, selectedPerson]);

    // Filtered list
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const result = persons.filter((p) => {
            if (q && !p.name.toLowerCase().includes(q)) return false;
            // Also search by CCCD
            if (q && p.cccd && p.cccd.toLowerCase().includes(q)) return true;
            if (q && !p.cccd && !p.name.toLowerCase().includes(q)) return false;

            if (filterMode === 'isolated' && p._id && connectedIds.has(p._id)) return false;
            return true;
        });

        return result.sort((a, b) => {
            let res = 0;
            switch (sortField) {
                case 'name': {
                    const getFirstName = (name: string) => {
                        const parts = name.trim().split(/\s+/);
                        return parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
                    };
                    const getLastName = (name: string) => {
                        const parts = name.trim().split(/\s+/);
                        // Lấy tên cuối cùng, nếu không có thì lấy chuỗi trống
                        return parts.length > 0 ? parts[parts.length - 1] : '';
                    };

                    const nameA = sortByNamePreference === 'lastName' ? getLastName(a.name) : getFirstName(a.name);
                    const nameB = sortByNamePreference === 'lastName' ? getLastName(b.name) : getFirstName(b.name);

                    // Dùng localeCompare để sort tiếng Việt chuẩn
                    res = nameA.localeCompare(nameB, 'vi');
                    // Nếu tên giống nhau thì so sánh full name
                    if (res === 0) res = a.name.localeCompare(b.name, 'vi');
                    break;
                }
                case 'birth': {
                    // Lấy năm sinh, ưu tiên người có năm sinh rõ ràng lên trước/sau
                    // Note: logic slightly different from inline to ensure empty dates are handled consistently
                    const getYear = (d?: Date) => (d ? new Date(d).getFullYear() : sortDirection === 'asc' ? 9999 : -9999);
                    const yearA = getYear(a.birth);
                    const yearB = getYear(b.birth);
                    res = yearA - yearB;
                    break;
                }
                case 'status': {
                    // Còn sống (false) lên trước, đã mất (true) xuống sau hoặc ngược lại
                    const deadA = a.isDead ? 1 : 0;
                    const deadB = b.isDead ? 1 : 0;
                    res = deadA - deadB;
                    break;
                }
            }
            return sortDirection === 'asc' ? res : -res;
        });
    }, [persons, search, filterMode, connectedIds, sortField, sortDirection, sortByNamePreference]);

    // Effect to save settings to localStorage
    useEffect(() => {
        localStorage.setItem('family-tree-viewMode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem('family-tree-sortByName', sortByNamePreference);
    }, [sortByNamePreference]);

    useEffect(() => {
        localStorage.setItem('family-tree-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);



    const isolatedCount = useMemo(() => persons.filter((p) => p._id && !connectedIds.has(p._id)).length, [persons, connectedIds]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    // Handlers
    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    }, []);

    const handlePageSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(e.target.value) as PageSize);
        setCurrentPage(1);
    }, []);

    const handleFilterMode = useCallback((mode: FilterMode) => {
        setFilterMode(mode);
        setCurrentPage(1);
    }, []);

    const handleSort = useCallback(
        (field: SortField) => {
            if (sortField === field) {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
                setSortField(field);
                setSortDirection('asc');
            }
        },
        [sortField, sortDirection],
    );

    const handlePersonClick = useCallback((person: Person) => {
        setSelectedPerson(person);
        setPersonDetailModalOpen(true);
    }, []);

    const handleRelationshipClick = useCallback((relationship: any) => {
        console.log('Relationship clicked:', relationship);
        // TODO: Implement relationship detail view
    }, []);

    const handleAddSpouseFromPerson = useCallback((person: Person) => {
        setSelectedPerson(person);
        setPersonDetailModalOpen(false);
        setAddSpouseModalOpen(true);
    }, []);

    const handleAddChildFromSpouse = useCallback((spouseId: string) => {
        setSelectedSpouseIdForChild(spouseId);
        setPersonDetailModalOpen(false);
        setAddChildModalOpen(true);
    }, []);

    const handleSpouseModalSuccess = useCallback(() => {
        refetchAll();
        setAddSpouseModalOpen(false);
        setPersonDetailModalOpen(true);
    }, [refetchAll]);

    const handleChildModalSuccess = useCallback(() => {
        refetchAll();
        setAddChildModalOpen(false);
        setPersonDetailModalOpen(true);
    }, [refetchAll]);

    const handlePersonModalSuccess = useCallback(() => {
        refetchAll();
        setAddPersonModalOpen(false);
    }, [refetchAll]);

    const handleOpenGuestCodeModal = useCallback(() => setGuestCodeModalOpen(true), []);
    const handleCloseGuestCodeModal = useCallback(() => setGuestCodeModalOpen(false), []);

    const handleClosePersonDetailModal = useCallback(() => setPersonDetailModalOpen(false), []);
    const handleCloseAddSpouseModal = useCallback(() => setAddSpouseModalOpen(false), []);
    const handleCloseAddChildModal = useCallback(() => setAddChildModalOpen(false), []);
    const handleCloseAddPersonModal = useCallback(() => setAddPersonModalOpen(false), []);

    const [isImporting, setIsImporting] = useState(false);
    const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const confirmed = confirm(
            'CẢNH BÁO: Hành động này sẽ XÓA TOÀN BỘ dữ liệu hiện tại và thay thế bằng dữ liệu từ file CSV. Bạn có chắc chắn muốn tiếp tục?',
        );
        if (!confirmed) {
            event.target.value = ''; // Reset input để cho phép tải lại cùng một file
            return;
        }

        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token'); // Giả định token được lưu với key 'token'
            if (!token) {
                toast.error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
                setIsImporting(false);
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            await axios.post(`${apiUrl}/persons/import-csv`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Import thành công! Dữ liệu đang được làm mới...');
            refetchAll(); // Tải lại toàn bộ dữ liệu để cập nhật giao diện
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Import thất bại. Vui lòng kiểm tra console.';
            toast.error(errorMessage);
            console.error('Import CSV failed:', error);
        } finally {
            setIsImporting(false);
            // Reset the input value to allow re-uploading the same file
            event.target.value = '';
        }
    };

    // Show loading state while checking auth
    if (authLoading) return <LoadingOverlay isLoading={true} />;
    
    // If not loading and no user, show loading while redirecting instead of blank screen
    if (!user) return <LoadingOverlay isLoading={true} />;

    return (
        <div className="w-screen h-screen flex flex-col bg-bg-primary text-text-primary font-sans">
            <Header
                isolatedCount={isolatedCount}
                filterMode={filterMode}
                onFilterModeChange={handleFilterMode}
                onOpenGuestCodeModal={handleOpenGuestCodeModal}
                currentView={viewMode}
                onChangeView={setViewMode}
            />

            {viewMode === 'list' && (
                <Toolbar search={search} onSearchChange={handleSearch} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} onAddPerson={() => setAddPersonModalOpen(true)} />
            )}

            <LoadingOverlay isLoading={isLoading || authLoading} />

            <div className={`flex-1 overflow-auto bg-bg-primary relative ${viewMode === 'list' ? 'p-4' : ''}`}>
                {viewMode === 'list' && (
                    <div className="max-w-[900px] mx-auto bg-bg-secondary shadow-sm ring-1 ring-border-color rounded-xl overflow-hidden">
                        <PersonList
                            paginated={paginated}
                            connectedIds={connectedIds}
                            currentPage={currentPage}
                            pageSize={pageSize}
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                            onPersonClick={handlePersonClick}
                        />
                    </div>
                )}

                {viewMode === 'tree' && (
                    <FamilyTreeFlow
                        persons={persons}
                        spouses={spouses}
                        parentChilds={parentChilds}
                        searchRootPersonId={null} // TODO: Add UI to select root person
                        searchGenerations={null} // TODO: Add UI to select generation depth
                        onPersonNodeClick={handlePersonClick}
                        onRelationshipNodeClick={handleRelationshipClick}
                    />
                )}

                {viewMode === 'stats' && <StatsView persons={persons} spouses={spouses} />}

                {viewMode === 'events' && <EventsView persons={persons} spouses={spouses} />}

                {viewMode === 'settings' && (
                    <div className="p-4 md:p-8 bg-bg-primary min-h-full">
                        <div className="max-w-2xl mx-auto bg-bg-secondary p-6 rounded-xl shadow-sm border border-border-color">
                            <h2 className="text-xl font-bold text-text-primary mb-6">Cài đặt hiển thị</h2>
                            <div className="space-y-6">
                                {/* Sort by Name Preference */}
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Sắp xếp danh sách thành viên theo
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center">
                                            <input
                                                id="sort-lastname"
                                                type="radio"
                                                name="sortPreference"
                                                value="lastName"
                                                checked={sortByNamePreference === 'lastName'}
                                                onChange={(e) => setSortByNamePreference(e.target.value as any)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <label htmlFor="sort-lastname" className="ml-2 block text-sm text-text-primary">Tên (ví dụ: An, Bình, Cúc)</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="sort-firstname"
                                                type="radio"
                                                name="sortPreference"
                                                value="firstName"
                                                checked={sortByNamePreference === 'firstName'}
                                                onChange={(e) => setSortByNamePreference(e.target.value as any)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <label htmlFor="sort-firstname" className="ml-2 block text-sm text-text-primary">Họ và tên đệm (ví dụ: Lê Công, Nguyễn Thị)</label>
                                        </div>
                                    </div>
                                </div>

                                {/* Theme Setting */}
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Giao diện
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center">
                                            <input
                                                id="theme-light"
                                                type="radio"
                                                name="themePreference"
                                                value="light"
                                                checked={theme === 'light'}
                                                onChange={(e) => setTheme(e.target.value as any)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <label htmlFor="theme-light" className="ml-2 block text-sm text-text-primary">Sáng</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="theme-dark"
                                                type="radio"
                                                name="themePreference"
                                                value="dark"
                                                checked={theme === 'dark'}
                                                onChange={(e) => setTheme(e.target.value as any)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <label htmlFor="theme-dark" className="ml-2 block text-sm text-text-primary">Tối</label>
                                        </div>
                                    </div>
                                </div>

                                {/* Import CSV */}
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Import Dữ liệu (Nâng cao)
                                    </label>
                                    <div className="p-4 border border-dashed border-red-400 rounded-lg bg-red-50">
                                        <p className="text-sm text-red-700 mb-3">
                                            <strong>Cảnh báo:</strong> Chức năng này sẽ xóa toàn bộ dữ liệu hiện có và thay thế bằng dữ liệu từ file CSV. Chỉ sử dụng khi bạn chắc chắn.
                                        </p>
                                        <label
                                            htmlFor="csv-importer"
                                            className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                                                isImporting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                            }`}
                                        >
                                            {isImporting ? 'Đang xử lý...' : 'Chọn file CSV để Import'}
                                        </label>
                                        <input id="csv-importer" type="file" accept=".csv" className="hidden" onChange={handleImportCsv} disabled={isImporting} />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
            </div>

            {viewMode === 'list' && (
                <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} onPageChange={setCurrentPage} />
            )}

            {/* Modals */}
            <PersonDetailModal
                isOpen={personDetailModalOpen}
                onClose={handleClosePersonDetailModal}
                person={selectedPerson}
                onAddSpouse={handleAddSpouseFromPerson}
                onAddChild={handleAddChildFromSpouse}
                onUpdate={refetchAll}
            />
            <AddSpouseModal isOpen={addSpouseModalOpen} onClose={handleCloseAddSpouseModal} onSuccess={handleSpouseModalSuccess} person={selectedPerson} />
            <AddChildModal isOpen={addChildModalOpen} onClose={handleCloseAddChildModal} onSuccess={handleChildModalSuccess} spouseId={selectedSpouseIdForChild} />
            <AddPersonModal isOpen={addPersonModalOpen} onClose={handleCloseAddPersonModal} onSuccess={handlePersonModalSuccess} />
            <GuestCodeModal isOpen={guestCodeModalOpen} onClose={handleCloseGuestCodeModal} />
        </div>
    );
}

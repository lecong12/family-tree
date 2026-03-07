'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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

export default function PersonsView() {
    const router = useRouter();
    const { isAdmin, isEditor, logout, user, loading: authLoading } = useAuth();

    // Điều hướng nếu chưa đăng nhập
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [authLoading, user, router]);

    const { persons, spouses, parentChilds, isLoading, refetchAll } = useFamilyData();

    // State cho Modals
    const [personDetailModalOpen, setPersonDetailModalOpen] = useState(false);
    const [addSpouseModalOpen, setAddSpouseModalOpen] = useState(false);
    const [addChildModalOpen, setAddChildModalOpen] = useState(false);
    const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
    const [guestCodeModalOpen, setGuestCodeModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [selectedSpouseIdForChild, setSelectedSpouseIdForChild] = useState<string | null>(null);

    // State cho danh sách
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState<PageSize>(30);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Chỉ số quan hệ (Dùng as any để tránh lỗi type _id undefined từ service)
    const connectedIds = useMemo(() => 
        buildConnectedIds(spouses as any, parentChilds as any), 
    [spouses, parentChilds]);

    const personById = useMemo(() => {
        const map = new Map<string, Person>();
        persons.forEach((p) => {
            if (p._id) map.set(p._id, p);
        });
        return map;
    }, [persons]);

    // Đồng bộ người dùng được chọn sau khi refetch
    useEffect(() => {
        if (selectedPerson?._id) {
            const updated = personById.get(selectedPerson._id);
            if (updated && updated !== selectedPerson) setSelectedPerson(updated);
        }
    }, [personById, selectedPerson]);

    // Logic Lọc và Tìm kiếm theo ngữ cảnh (Contextual Search)
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        
        const result = (persons as any[]).filter((p) => {
            // 1. Tìm kiếm theo Tên hoặc CCCD (Ngữ cảnh)
            if (q) {
                const nameMatch = p.name.toLowerCase().includes(q);
                const cccdMatch = p.cccd && p.cccd.toLowerCase().includes(q);
                if (!nameMatch && !cccdMatch) return false;
            }

            // 2. Lọc theo trạng thái kết nối
            if (filterMode === 'isolated' && p._id && connectedIds.has(p._id)) return false;
            
            return true;
        });

        // 3. Sắp xếp Tiếng Việt chuẩn (Dựa trên tệp gốc)
        return result.sort((a, b) => {
            let res = 0;
            switch (sortField) {
                case 'name': {
                    const getName = (name: string) => {
                        const parts = name.trim().split(/\s+/);
                        return parts.length > 0 ? parts[parts.length - 1] : '';
                    };
                    res = getName(a.name).localeCompare(getName(b.name), 'vi');
                    if (res === 0) res = a.name.localeCompare(b.name, 'vi');
                    break;
                }
                case 'birth': {
                    // Xử lý năm sinh an toàn cho build
                    const getYear = (d: any) => (d ? new Date(d).getFullYear() : (sortDirection === 'asc' ? 9999 : -9999));
                    res = getYear(a.birth) - getYear(b.birth);
                    break;
                }
                case 'status': {
                    const deadA = a.isDead ? 1 : 0;
                    const deadB = b.isDead ? 1 : 0;
                    res = deadA - deadB;
                    break;
                }
            }
            return sortDirection === 'asc' ? res : -res;
        });
    }, [persons, search, filterMode, connectedIds, sortField, sortDirection]);

    const isolatedCount = useMemo(() => 
        persons.filter((p) => p._id && !connectedIds.has(p._id)).length, 
    [persons, connectedIds]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    // Handlers (Giao tiếp với UI)
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

    const handleSort = useCallback((field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    }, [sortField, sortDirection]);

    const handlePersonClick = useCallback((person: Person) => {
        setSelectedPerson(person);
        setPersonDetailModalOpen(true);
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

    const handleModalSuccess = useCallback(() => {
        refetchAll();
        setAddSpouseModalOpen(false);
        setAddChildModalOpen(false);
        setAddPersonModalOpen(false);
        setPersonDetailModalOpen(true);
    }, [refetchAll]);

    if (authLoading || !user) return null;

    return (
        <div className="w-screen h-screen flex flex-col bg-gray-50">
            {/* Header hiển thị số lượng người chưa liên hệ */}
            <Header 
                isolatedCount={isolatedCount} 
                filterMode={filterMode} 
                onFilterModeChange={handleFilterMode} 
                onOpenGuestCodeModal={() => setGuestCodeModalOpen(true)} 
            />

            {/* Thanh công cụ tìm kiếm ngữ cảnh */}
            <Toolbar 
                search={search} 
                onSearchChange={handleSearch} 
                pageSize={pageSize} 
                onPageSizeChange={handlePageSizeChange} 
                onAddPerson={() => setAddPersonModalOpen(true)} 
            />

            <LoadingOverlay isLoading={isLoading} />

            <div className="flex-1 overflow-auto bg-gray-50 p-4">
                <div className="max-w-[900px] mx-auto bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
                    <PersonList
                        paginated={paginated as any} // Ép kiểu để tránh lỗi Gender/CCCD trên Vercel
                        connectedIds={connectedIds}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        sortField={sortField}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        onPersonClick={handlePersonClick}
                    />
                </div>
            </div>

            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                pageSize={pageSize} 
                totalItems={filtered.length} 
                onPageChange={setCurrentPage} 
            />

            {/* Hệ thống Modals quản lý thành viên */}
            <PersonDetailModal
                isOpen={personDetailModalOpen}
                onClose={() => setPersonDetailModalOpen(false)}
                person={selectedPerson}
                onAddSpouse={handleAddSpouseFromPerson}
                onAddChild={handleAddChildFromSpouse}
                onUpdate={refetchAll}
            />
            
            <AddSpouseModal 
                isOpen={addSpouseModalOpen} 
                onClose={() => setAddSpouseModalOpen(false)} 
                onSuccess={handleModalSuccess} 
                person={selectedPerson} 
            />
            
            <AddChildModal 
                isOpen={addChildModalOpen} 
                onClose={() => setAddChildModalOpen(false)} 
                onSuccess={handleModalSuccess} 
                spouseId={selectedSpouseIdForChild} 
            />
            
            <AddPersonModal 
                isOpen={addPersonModalOpen} 
                onClose={() => setAddPersonModalOpen(false)} 
                onSuccess={() => { refetchAll(); setAddPersonModalOpen(false); }} 
            />
            
            <GuestCodeModal 
                isOpen={guestCodeModalOpen} 
                onClose={() => setGuestCodeModalOpen(false)} 
            />
        </div>
    );
}
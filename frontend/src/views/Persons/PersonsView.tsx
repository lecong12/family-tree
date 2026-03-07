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
import FamilyTreeFlow from 'src/components/FamilyTree/FamilyTreeFlow';

export default function PersonsView() {
    const router = useRouter();
    const { isAdmin, isEditor, logout, user, loading: authLoading } = useAuth();

    // Điều hướng người dùng nếu chưa đăng nhập
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [authLoading, user, router]);

    const { persons, spouses, parentChilds, isLoading, refetchAll } = useFamilyData();

    // Quản lý trạng thái Modal
    const [personDetailModalOpen, setPersonDetailModalOpen] = useState(false);
    const [addSpouseModalOpen, setAddSpouseModalOpen] = useState(false);
    const [addChildModalOpen, setAddChildModalOpen] = useState(false);
    const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
    const [guestCodeModalOpen, setGuestCodeModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [selectedSpouseIdForChild, setSelectedSpouseIdForChild] = useState<string | null>(null);

    // Trạng thái Danh sách & Chế độ xem
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState<PageSize>(30);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

    // Chỉ mục mối quan hệ
    const connectedIds = useMemo(() => buildConnectedIds(spouses, parentChilds), [spouses, parentChilds]);

    const personById = useMemo(() => {
        const map = new Map<string, Person>();
        persons.forEach((p) => {
            if (p._id) map.set(p._id, p);
        });
        return map;
    }, [persons]);

    // Đồng bộ lại thông tin thành viên sau khi Refetch dữ liệu
    useEffect(() => {
        if (selectedPerson?._id) {
            const updated = personById.get(selectedPerson._id);
            if (updated && updated !== selectedPerson) setSelectedPerson(updated);
        }
    }, [personById, selectedPerson]);

    // Xử lý Lọc và Sắp xếp danh sách
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const result = persons.filter((p) => {
            if (q && !p.name.toLowerCase().includes(q) && !(p.cccd && p.cccd.toLowerCase().includes(q))) return false;
            if (filterMode === 'isolated' && p._id && connectedIds.has(p._id)) return false;
            return true;
        });

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
                    const getYear = (d?: Date) => (d ? new Date(d).getFullYear() : sortDirection === 'asc' ? 9999 : -9999);
                    res = getYear(a.birth) - getYear(b.birth);
                    break;
                }
                case 'status': {
                    res = (a.isDead ? 1 : 0) - (b.isDead ? 1 : 0);
                    break;
                }
            }
            return sortDirection === 'asc' ? res : -res;
        });
    }, [persons, search, filterMode, connectedIds, sortField, sortDirection]);

    const isolatedCount = useMemo(() => persons.filter((p) => p._id && !connectedIds.has(p._id)).length, [persons, connectedIds]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    // Các hàm xử lý sự kiện (Handlers)
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

    const handleRelationshipClick = useCallback((relationship: any) => {
        console.log('Relationship clicked:', relationship);
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

    if (authLoading) return <LoadingOverlay isLoading={true} />;
    if (!user) return <LoadingOverlay isLoading={true} />;

    return (
        <div className="w-screen h-screen flex flex-col bg-white overflow-hidden">
            {/* Header luôn hiển thị */}
            <Header
                isolatedCount={isolatedCount}
                filterMode={filterMode}
                onFilterModeChange={handleFilterMode}
                onOpenGuestCodeModal={handleOpenGuestCodeModal}
                currentView={viewMode}
                onChangeView={setViewMode}
            />

            {/* LOGIC ĐIỀU KIỆN 1: Toolbar chỉ hiện ở tab Danh sách */}
            {viewMode === 'list' && (
                <Toolbar 
                    search={search} 
                    onSearchChange={handleSearch} 
                    pageSize={pageSize} 
                    onPageSizeChange={handlePageSizeChange} 
                    onAddPerson={() => setAddPersonModalOpen(true)} 
                />
            )}

            <LoadingOverlay isLoading={isLoading} />

            {/* VÙNG HIỂN THỊ CHÍNH */}
            <div className="flex-1 relative overflow-hidden bg-gray-50">
                {viewMode === 'list' ? (
                    /* GIAO DIỆN DANH SÁCH */
                    <div className="h-full overflow-auto p-4 md:p-6 flex flex-col items-center">
                        <div className="w-full max-w-[1000px] bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
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
                        
                        {/* LOGIC ĐIỀU KIỆN 2: Pagination chỉ hiện ở tab Danh sách và nằm trong vùng cuộn */}
                        <div className="w-full max-w-[1000px] mt-6 mb-10">
                            <Pagination 
                                currentPage={currentPage} 
                                totalPages={totalPages} 
                                pageSize={pageSize} 
                                totalItems={filtered.length} 
                                onPageChange={setCurrentPage} 
                            />
                        </div>
                    </div>
                ) : (
                    /* GIAO DIỆN CÂY GIA PHẢ: TRÀN MÀN HÌNH - KHÔNG TOOLBAR/PAGINATION */
                    <div className="absolute inset-0 w-full h-full bg-white">
                        <FamilyTreeFlow
                            persons={persons}
                            spouses={spouses}
                            parentChilds={parentChilds}
                            searchRootPersonId={null}
                            searchGenerations={null}
                            onPersonNodeClick={handlePersonClick}
                            onRelationshipNodeClick={handleRelationshipClick}
                        />
                    </div>
                )}
            </div>

            {/* Các Modals xử lý dữ liệu - Giữ nguyên logic */}
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

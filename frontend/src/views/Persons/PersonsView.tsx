'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ReactFlowProvider } from '@xyflow/react';

// Context & Hooks
import { useAuth } from 'src/context/AuthContext';
import { useFamilyData } from 'src/hooks/useFamilyData';

// Components trong thư mục views
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import PersonList from './components/PersonList';
import Pagination from './components/Pagination';

// ĐƯỜNG DẪN ĐÚNG ĐẾN THƯ MỤC COMPONENTS CHUNG
// Chúng ta trỏ ngược ra ngoài 3 cấp: src/views/Persons -> src/views -> src -> src/components
const FamilyTreeFlow = dynamic(
  () => import('../../components/FamilyTree/FamilyTreeFlow'),
  { 
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center text-gray-400">Đang tải sơ đồ...</div>
  }
);

// Modals (Cũng nằm ở thư mục components chung)
import LoadingOverlay from 'src/components/LoadingOverlay/LoadingOverlay';
import PersonDetailModal from 'src/components/PersonDetailModal/PersonDetailModal';
import AddSpouseModal from 'src/components/AddSpouseModal/AddSpouseModal';
import AddChildModal from 'src/components/AddChildModal/AddChildModal';
import AddPersonModal from 'src/components/AddPersonModal/AddPersonModal';
import GuestCodeModal from 'src/components/GuestCodeModal/GuestCodeModal';

// Utils & Types
import { FilterMode, PageSize, SortDirection, SortField } from './types';

export default function PersonsView() {
    const router = useRouter();
    const { isAdmin, logout, user, loading: authLoading } = useAuth();
    const { persons, spouses, parentChilds, isLoading, refetchAll } = useFamilyData();

    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState<PageSize>(30);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const [personDetailModalOpen, setPersonDetailModalOpen] = useState(false);
    const [addSpouseModalOpen, setAddSpouseModalOpen] = useState(false);
    const [addChildModalOpen, setAddChildModalOpen] = useState(false);
    const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
    const [guestCodeModalOpen, setGuestCodeModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<any>(null);
    const [selectedSpouseIdForChild, setSelectedSpouseIdForChild] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) router.replace('/login');
    }, [authLoading, user, router]);

    // FIX LOGIC: Tính toán danh sách ID đã liên kết trực tiếp tại đây để đảm bảo chính xác
    const connectedIds = useMemo(() => {
        const ids = new Set<string>();
        const getId = (item: any) => {
            if (!item) return null;
            return typeof item === 'object' ? item._id : item;
        };

        if (Array.isArray(spouses)) {
            spouses.forEach((s: any) => {
                if (s.husband) ids.add(getId(s.husband));
                if (s.wife) ids.add(getId(s.wife));
            });
        }
        if (Array.isArray(parentChilds)) {
            parentChilds.forEach((pc: any) => {
                if (pc.child) ids.add(getId(pc.child));
            });
        }
        return ids;
    }, [spouses, parentChilds]);

    const { isolatedPersons, isolatedCount } = useMemo(() => {
        const isolated = (persons as any[]).filter(p => p._id && !connectedIds.has(p._id));
        return { isolatedPersons: isolated, isolatedCount: isolated.length };
    }, [persons, connectedIds]);

    const filtered = useMemo(() => {
        // Bắt đầu với danh sách nguồn phù hợp (tất cả hoặc chỉ những người chưa có liên hệ)
        const source = filterMode === 'isolated' ? isolatedPersons : (persons as any[]);

        const q = search.trim().toLowerCase();
        let res = source;

        // Áp dụng bộ lọc tìm kiếm nếu có
        if (q) {
            res = res.filter((p) => {
                const n = p.name?.toLowerCase().includes(q);
                const c = p.cccd?.toString().includes(q);
                return n || c;
            });
        }

        return [...res].sort((a, b) => { // Sắp xếp trên một bản sao để tránh thay đổi `persons`
            let val = 0;
            if (sortField === 'name') {
                const nA = (a.name || '').trim().split(' ').pop() || '';
                const nB = (b.name || '').trim().split(' ').pop() || '';
                val = nA.localeCompare(nB, 'vi');
            } else if (sortField === 'birth') {
                const yA = a.birth ? new Date(a.birth).getFullYear() : (sortDirection === 'asc' ? 9999 : -9999);
                const yB = b.birth ? new Date(b.birth).getFullYear() : (sortDirection === 'asc' ? 9999 : -9999);
                val = yA - yB;
            }
            return sortDirection === 'asc' ? val : -val;
        });
    }, [persons, isolatedPersons, search, filterMode, sortField, sortDirection]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (authLoading || !user) return null;

    return (
        <div className="w-screen h-screen flex flex-col bg-gray-50 overflow-hidden">
            <Header 
                user={user} isAdmin={isAdmin} onLogout={logout}
                isolatedCount={isolatedCount} 
                filterMode={filterMode} onFilterModeChange={(m: any) => { setFilterMode(m); setCurrentPage(1); }}
                onOpenGuestCodeModal={() => setGuestCodeModalOpen(true)}
                viewMode={viewMode} onViewModeChange={setViewMode}
            />

            <Toolbar 
                search={search} onSearchChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
                pageSize={pageSize} onPageSizeChange={(e) => { setPageSize(Number(e.target.value) as PageSize); setCurrentPage(1); }} 
                onAddPerson={() => setAddPersonModalOpen(true)} 
            />

            <LoadingOverlay isLoading={isLoading} />

            <div className="flex-1 overflow-hidden relative">
                {viewMode === 'list' ? (
                    <div className="h-full overflow-auto p-4">
                        <div className="max-w-[1200px] mx-auto bg-white shadow rounded-xl border border-gray-200">
                            <PersonList
                                paginated={paginated as any} connectedIds={connectedIds}
                                currentPage={currentPage} pageSize={pageSize}
                                sortField={sortField} sortDirection={sortDirection}
                                onSort={(f) => { setSortField(f); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}
                                onPersonClick={(p) => { setSelectedPerson(p); setPersonDetailModalOpen(true); }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full bg-white relative">
                        <ReactFlowProvider>
                            <FamilyTreeFlow 
                                persons={filtered} 
                                spouses={spouses} 
                                parentChilds={parentChilds}
                                filterMode={filterMode}
                                onPersonClick={(p: any) => { setSelectedPerson(p); setPersonDetailModalOpen(true); }}
                            />
                        </ReactFlowProvider>
                    </div>
                )}
            </div>

            {/* Chỉ hiện phân trang khi ở chế độ danh sách */}
            {viewMode === 'list' && (
                <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} onPageChange={setCurrentPage} />
            )}

            {/* Modals giữ nguyên */}
            <PersonDetailModal isOpen={personDetailModalOpen} onClose={() => setPersonDetailModalOpen(false)} person={selectedPerson} onUpdate={refetchAll} onAddSpouse={(p: any) => { setSelectedPerson(p); setPersonDetailModalOpen(false); setAddSpouseModalOpen(true); }} onAddChild={(sid: string) => { setSelectedSpouseIdForChild(sid); setPersonDetailModalOpen(false); setAddChildModalOpen(true); }} />
            <AddSpouseModal isOpen={addSpouseModalOpen} onClose={() => setAddSpouseModalOpen(false)} onSuccess={() => { refetchAll(); setAddSpouseModalOpen(false); setPersonDetailModalOpen(true); }} person={selectedPerson} />
            <AddChildModal isOpen={addChildModalOpen} onClose={() => setAddChildModalOpen(false)} onSuccess={() => { refetchAll(); setAddChildModalOpen(false); setPersonDetailModalOpen(true); }} spouseId={selectedSpouseIdForChild} />
            <AddPersonModal isOpen={addPersonModalOpen} onClose={() => setAddPersonModalOpen(false)} onSuccess={() => { refetchAll(); setAddPersonModalOpen(false); }} />
            <GuestCodeModal isOpen={guestCodeModalOpen} onClose={() => setGuestCodeModalOpen(false)} />
        </div>
    );
}
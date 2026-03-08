'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Context & Hooks
import { useAuth } from 'src/context/AuthContext';
import { useFamilyData } from 'src/hooks/useFamilyData';

// Components
import Header from '../../components/Header';
import Toolbar from './components/Toolbar';
import PersonList from './components/PersonList';
import Pagination from './components/Pagination';
import GenerationalTree from '../../components/GenerationalTree';

// Modals (Cũng nằm ở thư mục components chung)
import LoadingOverlay from 'src/components/LoadingOverlay/LoadingOverlay';
import PersonDetailModal from 'src/components/PersonDetailModal/PersonDetailModal';
import AddSpouseModal from 'src/components/AddSpouseModal/AddSpouseModal';
import AddChildModal from 'src/components/AddChildModal/AddChildModal';
import AddPersonModal from 'src/components/AddPersonModal/AddPersonModal';
import GuestCodeModal from 'src/components/GuestCodeModal/GuestCodeModal';

// Utils & Types
import { FilterMode, PageSize, SortDirection, SortField } from './types';

// Helper: Xây dựng cây gia phả từ dữ liệu thô tại Client
const buildGenerationalTreeData = (rootId: string, persons: any[], spouses: any[], parentChilds: any[], maxGenerations: number = 10) => {
    const getId = (item: any) => typeof item === 'object' ? item._id : item;
    
    const personMap = new Map(persons.map(p => [p._id, p]));
    const spouseMap = new Map<string, any[]>();
    const childMap = new Map<string, string[]>();

    // Index spouses
    spouses.forEach(s => {
        const hId = getId(s.husband);
        const wId = getId(s.wife);
        if (hId && wId) {
             if (!spouseMap.has(hId)) spouseMap.set(hId, []);
             spouseMap.get(hId)?.push({ ...s, partnerId: wId, type: 'husband' });

             if (!spouseMap.has(wId)) spouseMap.set(wId, []);
             spouseMap.get(wId)?.push({ ...s, partnerId: hId, type: 'wife' });
        }
    });

    // Index children
    parentChilds.forEach(pc => {
        const pId = getId(pc.parent);
        const cId = getId(pc.child);
        if (pId && cId) {
            if (!childMap.has(pId)) childMap.set(pId, []);
            childMap.get(pId)?.push(cId);
        }
    });

    const generations: any[][] = [];
    const visited = new Set<string>();
    let currentGenIds = [rootId];
    visited.add(rootId);

    for (let i = 0; i < maxGenerations; i++) {
        if (currentGenIds.length === 0) break;
        
        const currentGenFamilies: any[] = [];
        const nextGenIds: string[] = [];

        for (const userId of currentGenIds) {
            const userSpouses = spouseMap.get(userId) || [];
            userSpouses.sort((a, b) => (a.spouseOrder || 0) - (b.spouseOrder || 0));

            const spousesNode = userSpouses.map(s => {
                const partnerId = s.partnerId;
                const myChildren = childMap.get(userId) || [];
                const partnerChildren = childMap.get(partnerId) || [];
                
                // Tìm con chung của cặp vợ chồng này
                const commonChildren = myChildren.filter(c => partnerChildren.includes(c));
                
                commonChildren.forEach(c => {
                    if (!visited.has(c)) {
                        visited.add(c);
                        nextGenIds.push(c);
                    }
                });

                return {
                    user: { id: partnerId, spouseOrder: s.spouseOrder || 1 },
                    spouseOrder: s.spouseOrder || 1,
                    children: commonChildren
                };
            });

            currentGenFamilies.push({
                user: userId,
                spouses: spousesNode
            });
        }

        if (currentGenFamilies.length > 0) {
            generations.push(currentGenFamilies);
        }
        currentGenIds = nextGenIds;
    }

    const personData: Record<string, any> = {};
    persons.forEach(p => {
        personData[p._id] = p;
    });

    return { personData, treeData: generations };
};

export default function PersonsView() {
    const router = useRouter();
    const { isAdmin, logout, user, loading: authLoading } = useAuth();
    const { persons, spouses, parentChilds, isLoading, refetchAll } = useFamilyData();

    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState<PageSize>(30);
    
    // State cho cây gia phả theo thế hệ
    const [generationalTreeData, setGenerationalTreeData] = useState<any>(null);
    const [treeLoading, setTreeLoading] = useState(false);
    const [treeError, setTreeError] = useState<string | null>(null);

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

    // Effect để tải dữ liệu cây gia phả khi chuyển sang view 'tree'
    useEffect(() => {
        const fetchTreeData = async () => {
            // Chỉ fetch khi ở chế độ 'tree' và chưa có dữ liệu
            if (viewMode === 'tree' && !generationalTreeData) {
                setTreeLoading(true);
                setTreeError(null);

                if (!persons || persons.length === 0) {
                    // Đợi hook useFamilyData tải xong
                    if (!isLoading) {
                        setTreeError("Chưa có dữ liệu thành viên để dựng cây.");
                    }
                    setTreeLoading(false);
                    return;
                }

                // Tìm người gốc, ưu tiên người có isRoot, nếu không thì lấy người đầu tiên
                const rootPerson = persons.find((p: any) => p.isRoot) || persons[0];
                if (!rootPerson) {
                    setTreeError("Không tìm thấy người gốc để bắt đầu.");
                    setTreeLoading(false);
                    return;
                }

                try {
                    // Xử lý dữ liệu tại Client thay vì gọi API bị lỗi
                    const data = buildGenerationalTreeData(rootPerson._id, persons, spouses, parentChilds);
                    setGenerationalTreeData(data);
                } catch (error: any) {
                    console.error(error);
                    setTreeError("Lỗi khi xử lý dữ liệu cây gia phả.");
                } finally {
                    setTreeLoading(false);
                }
            }
        };
        fetchTreeData();
    }, [viewMode, persons, spouses, parentChilds, generationalTreeData, isLoading]);

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
                filterMode={filterMode} 
                onFilterModeChange={(m: any) => { 
                    setFilterMode(m); 
                    setCurrentPage(1); 
                }}
                onOpenGuestCodeModal={() => setGuestCodeModalOpen(true)}
                currentView={viewMode}
                onChangeView={setViewMode}
            />

            {viewMode === 'list' && (
                <Toolbar 
                    search={search} onSearchChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
                    pageSize={pageSize} onPageSizeChange={(e) => { setPageSize(Number(e.target.value) as PageSize); setCurrentPage(1); }} 
                    onAddPerson={() => setAddPersonModalOpen(true)} 
                />
            )}

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
                    <div className="w-full h-full relative">
                        {treeLoading && (
                            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
                                <div className="text-center">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="mt-2 text-gray-600">Đang dựng cây gia phả...</p>
                                </div>
                            </div>
                        )}
                        {treeError && <div className="p-8 text-center text-red-500">{treeError}</div>}
                        {generationalTreeData && !treeError && (
                            <GenerationalTree 
                                data={generationalTreeData}
                                onPersonClick={(p: any) => { setSelectedPerson(p); setPersonDetailModalOpen(true); }}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Chỉ hiện phân trang khi ở chế độ danh sách */}
            {viewMode === 'list' && (
                <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} onPageChange={setCurrentPage} />
            )}

            {/* Modals giữ nguyên */}
            <PersonDetailModal isOpen={personDetailModalOpen} onClose={() => setPersonDetailModalOpen(false)} person={selectedPerson} onUpdate={() => { refetchAll(); setGenerationalTreeData(null); }} onAddSpouse={(p: any) => { setSelectedPerson(p); setPersonDetailModalOpen(false); setAddSpouseModalOpen(true); }} onAddChild={(sid: string) => { setSelectedSpouseIdForChild(sid); setPersonDetailModalOpen(false); setAddChildModalOpen(true); }} />
            <AddSpouseModal isOpen={addSpouseModalOpen} onClose={() => setAddSpouseModalOpen(false)} onSuccess={() => { 
                refetchAll(); 
                setGenerationalTreeData(null); 
                setAddSpouseModalOpen(false); 
                setPersonDetailModalOpen(true); 
            }} person={selectedPerson} />
            <AddChildModal isOpen={addChildModalOpen} onClose={() => setAddChildModalOpen(false)} onSuccess={() => { 
                refetchAll(); 
                setGenerationalTreeData(null); 
                setAddChildModalOpen(false); 
                setPersonDetailModalOpen(true); 
            }} spouseId={selectedSpouseIdForChild} />
            <AddPersonModal isOpen={addPersonModalOpen} onClose={() => setAddPersonModalOpen(false)} onSuccess={() => { refetchAll(); setGenerationalTreeData(null); setAddPersonModalOpen(false); }} />
            <GuestCodeModal isOpen={guestCodeModalOpen} onClose={() => setGuestCodeModalOpen(false)} />
        </div>
    );
}
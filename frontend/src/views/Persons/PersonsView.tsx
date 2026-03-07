'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// SỬA ĐƯỜNG DẪN IMPORT Ở ĐÂY
import { Person, SpouseWithDetails } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useFamilyData } from '../../hooks/useFamilyData';

import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import PersonDetailModal from '../../components/PersonDetailModal/PersonDetailModal';
import AddSpouseModal from '../../components/AddSpouseModal/AddSpouseModal';
import AddChildModal from '../../components/AddChildModal/AddChildModal';
import AddPersonModal from '../../components/AddPersonModal/AddPersonModal';
import GuestCodeModal from '../../components/GuestCodeModal/GuestCodeModal';
import RelationshipDetailModal from '../../components/RelationshipDetailModal/RelationshipDetailModal';

import Header from './components/Header';
import Toolbar from './components/Toolbar';
import PersonList from './components/PersonList';
import Pagination from './components/Pagination';
import { FilterMode, PageSize, SortDirection, SortField, PersonListState } from './types';
import { buildConnectedIds } from './utils';
import FamilyTreeFlow from '../../components/FamilyTree/FamilyTreeFlow';

export default function PersonsView() {
    const [currentView, setCurrentView] = useState<'list' | 'tree'>('list');

    // State for Modals
    const [personDetailModalOpen, setPersonDetailModalOpen] = useState(false);
    const [addSpouseModalOpen, setAddSpouseModalOpen] = useState(false);
    const [addChildModalOpen, setAddChildModalOpen] = useState(false);
    const [addPersonModalOpen, setAddPersonModalOpen] = useState(false);
    const [guestCodeModalOpen, setGuestCodeModalOpen] = useState(false);
    const [relDetailModalOpen, setRelDetailModalOpen] = useState(false);

    // State for selected items
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [selectedSpouse, setSelectedSpouse] = useState<SpouseWithDetails | null>(null);
    const [selectedSpouseForChild, setSelectedSpouseForChild] = useState<string | null>(null);

    // State for list view management
    const [listState, setListState] = useState<PersonListState>({
        search: '',
        pageSize: 15,
        currentPage: 1,
        filterMode: 'all',
        sortField: 'name',
        sortDirection: 'asc',
    });

    const { isAdmin, isEditor, user, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const { persons, spouses, parentChilds, isLoading, refetchAll } = useFamilyData();

    // Redirect non-logged-in users
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [authLoading, user, router]);

    // Lọc ra những người có _id hợp lệ và dùng type guard `is Person` để TypeScript hiểu rằng
    // mảng này chứa các đối tượng Person hợp lệ (từ `../../types`), giải quyết lỗi build.
    const validPersons = useMemo(() => (persons || []).filter((p: any) => !!p._id) as unknown as Person[], [persons]);

    const personById = useMemo(() => {
        const map = new Map<string, Person>();
        validPersons.forEach((p) => {
            if (p._id) map.set(p._id, p as any);
        });
        return map;
    }, [validPersons]);

    // Sync selected person after refetch
    useEffect(() => {
        if (selectedPerson?._id) {
            const updated = personById.get(selectedPerson._id);
            if (updated && updated !== selectedPerson) setSelectedPerson(updated);
        }
    }, [personById, selectedPerson]);

    const handleViewChange = useCallback((view: 'list' | 'tree') => {
        setCurrentView(view);
    }, []);

    const handleRelationshipClick = useCallback((spouseData: SpouseWithDetails) => {
        if (spouseData) {
            setSelectedSpouse(spouseData);
            setRelDetailModalOpen(true);
        }
    }, []);

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
        setSelectedSpouseForChild(spouseId);
        setPersonDetailModalOpen(false);
        setAddChildModalOpen(true);
    }, []);

    const connectedIds = useMemo(() => buildConnectedIds(validPersons as any, spouses as any, parentChilds as any), [validPersons, spouses, parentChilds]);
    const isolatedCount = useMemo(() => validPersons.length - connectedIds.size, [validPersons, connectedIds]);

    const { filteredAndSortedPersons, totalPages } = useMemo(() => {
        if (!validPersons) return { filteredAndSortedPersons: [], totalPages: 0 };

        let tempPersons = [...validPersons];

        if (listState.filterMode === 'isolated') {
            tempPersons = tempPersons.filter(p => p._id && !connectedIds.has(p._id));
        }

        if (listState.search) {
            const searchTerm = listState.search.toLowerCase();
            tempPersons = tempPersons.filter(p => {
                const person = p as any;
                return person.name.toLowerCase().includes(searchTerm) || (person.cccd && person.cccd.includes(searchTerm));
            });
        }

        tempPersons.sort((a, b) => {
            const field = listState.sortField;
            const dir = listState.sortDirection === 'asc' ? 1 : -1;
            let res = 0;

            switch (field) {
                case 'name': {
                    const getName = (name: string) => {
                        const parts = name.trim().split(/\s+/);
                        return parts.length > 0 ? parts[parts.length - 1] : '';
                    };
                    const nameA = getName(a.name || '');
                    const nameB = getName(b.name || '');
                    res = nameA.localeCompare(nameB, 'vi');
                    if (res === 0) res = (a.name || '').localeCompare(b.name || '', 'vi');
                    break;
                }
                case 'birth': {
                    const getYear = (d?: string | Date) => (d ? new Date(d).getFullYear() : (listState.sortDirection === 'asc' ? 9999 : -9999));
                    const yearA = getYear(a.birth);
                    const yearB = getYear(b.birth);
                    res = yearA - yearB;
                    break;
                }
                case 'status': {
                    const deadA = a.isDead ? 1 : 0;
                    const deadB = b.isDead ? 1 : 0;
                    res = deadA - deadB;
                    break;
                }
            }

            return res * dir;
        });

        const total = tempPersons.length;
        const pages = Math.ceil(total / listState.pageSize);

        return { filteredAndSortedPersons: tempPersons, totalPages: pages };
    }, [validPersons, listState, connectedIds]);

    const paginatedPersons = useMemo(() => {
        const start = (listState.currentPage - 1) * listState.pageSize;
        const end = start + listState.pageSize;
        return filteredAndSortedPersons.slice(start, end);
    }, [filteredAndSortedPersons, listState.currentPage, listState.pageSize]);

    if (isLoading && !validPersons.length) {
        return <LoadingOverlay isLoading={true} />;
    }

    if (authLoading || !user) return null;

    return (
        <div className="flex flex-col h-screen bg-gray-100 font-sans">
            <Header 
                isolatedCount={isolatedCount}
                filterMode={listState.filterMode}
                onFilterModeChange={(mode) => setListState(s => ({ ...s, filterMode: mode, currentPage: 1 }))}
                onOpenGuestCodeModal={() => setGuestCodeModalOpen(true)} 
                currentView={currentView}
                onChangeView={handleViewChange} 
            />

            {currentView === 'list' && (
                <Toolbar 
                    search={listState.search}
                    onSearchChange={(e) => setListState(s => ({ ...s, search: e.target.value, currentPage: 1 }))}
                    pageSize={listState.pageSize}
                    onPageSizeChange={(e) => setListState(s => ({ ...s, pageSize: parseInt(e.target.value, 10) as PageSize, currentPage: 1 }))}
                    onAddPerson={() => setAddPersonModalOpen(true)}
                />
            )}

            <main className="flex-1 overflow-y-auto">
                {currentView === 'tree' ? (
                    <FamilyTreeFlow 
                        persons={validPersons} 
                        spouses={spouses}
                        parentChilds={parentChilds}
                        filterMode={listState.filterMode} 
                        onRelationshipClick={handleRelationshipClick}
                        onPersonClick={handlePersonClick}
                    />
                ) : (
                    <div className="max-w-[900px] mx-auto bg-white shadow-sm rounded-b-lg">
                        <PersonList 
                            paginated={paginatedPersons}
                            connectedIds={connectedIds}
                            currentPage={listState.currentPage}
                            pageSize={listState.pageSize}
                            sortField={listState.sortField}
                            sortDirection={listState.sortDirection}
                            onSort={(field) => setListState(s => ({ ...s, sortField: field, sortDirection: s.sortField === field && s.sortDirection === 'asc' ? 'desc' : 'asc' }))}
                            onPersonClick={handlePersonClick}
                        />
                    </div>
                )}
            </main>

            {currentView === 'list' && totalPages > 1 && (
                 <Pagination 
                    currentPage={listState.currentPage}
                    totalPages={totalPages}
                    pageSize={listState.pageSize}
                    totalItems={filteredAndSortedPersons.length}
                    onPageChange={(page) => setListState(s => ({ ...s, currentPage: page }))}
                />
            )}

            <PersonDetailModal isOpen={personDetailModalOpen} onClose={() => setPersonDetailModalOpen(false)} person={selectedPerson} onAddSpouse={handleAddSpouseFromPerson} onAddChild={handleAddChildFromSpouse} onUpdate={refetchAll} />
            <AddSpouseModal isOpen={addSpouseModalOpen} onClose={() => setAddSpouseModalOpen(false)} onSuccess={() => { refetchAll(); setAddSpouseModalOpen(false); }} person={selectedPerson} />
            <AddChildModal isOpen={addChildModalOpen} onClose={() => setAddChildModalOpen(false)} onSuccess={() => { refetchAll(); setAddChildModalOpen(false); }} spouseId={selectedSpouseForChild} />
            <AddPersonModal isOpen={addPersonModalOpen} onClose={() => setAddPersonModalOpen(false)} onSuccess={() => { refetchAll(); setAddPersonModalOpen(false); }} />
            <RelationshipDetailModal isOpen={relDetailModalOpen} onClose={() => setRelDetailModalOpen(false)} spouse={selectedSpouse} />
            <GuestCodeModal isOpen={guestCodeModalOpen} onClose={() => setGuestCodeModalOpen(false)} />
        </div>
    );
}

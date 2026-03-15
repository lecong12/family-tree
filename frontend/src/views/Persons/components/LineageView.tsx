'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Person } from 'src/services/personService';
import { Spouse, SpouseWithDetails } from 'src/services/spouseService';
import { ParentChild } from 'src/services/parentChildService';
import { isMale } from 'src/utils/genderUtils';
import { Avatar_Male, Avatar_Female } from 'src/constants/imagePaths';
import LineageMemberCard from './LineageMemberCard';
import MemberDetailModal from './MemberDetailModal';

interface LineageViewProps {
    persons: Person[];
    spouses: (Spouse | SpouseWithDetails)[];
    parentChilds: any[];
}

const LineageView: React.FC<LineageViewProps> = ({ persons, spouses, parentChilds }) => {
    const [selectedGeneration, setSelectedGeneration] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [detailMember, setDetailMember] = useState<Person | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // 1. Tính toán thống kê theo đời và tìm đời lớn nhất
    const { generationStats, maxGen } = useMemo(() => {
        const stats: Record<number, { total: number }> = {};
        let max = 0;
        persons.forEach(p => {
            const gen = (p as any).generation || 1;
            if (gen > max) max = gen;
            if (!stats[gen]) stats[gen] = { total: 0 };
            stats[gen].total++;
        });
        return { generationStats: stats, maxGen: max };
    }, [persons]);

    // 2. Lọc thành viên theo đời được chon
    const membersOfSelectedGeneration = useMemo(() => {
        return persons
            .filter(p => ((p as any).generation || 1) === selectedGeneration)
            .sort((a, b) => ((a as any).order || 99) - ((b as any).order || 99)); // Sắp xếp theo thứ tự trong đời
    }, [persons, selectedGeneration]);

    // 3. Logic tìm kiếm
    const filteredResults = useMemo(() => {
        if (!searchTerm || searchTerm.trim().length < 1) return [];
        const lowerTerm = searchTerm.toLowerCase();
        return persons
            .filter(p => p.name.toLowerCase().includes(lowerTerm))
            .slice(0, 8); // Giới hạn 8 kết quả
    }, [searchTerm, persons]);

    const handleSelectResult = (person: Person) => {
        const gen = (person as any).generation || 1;
        setSelectedGeneration(gen);
        setHighlightedId(person._id || null);
        setSearchTerm('');
        
        // Đợi DOM render xong rồi scroll tới
        setTimeout(() => {
            const element = document.getElementById(`card-${person._id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    };

    const handleOpenDetail = (person: Person) => {
        setDetailMember(person);
        setIsDetailOpen(true);
    };

    if (persons.length === 0) {
        return <div className="p-10 text-center text-gray-500">Không có dữ liệu để hiển thị.</div>;
    }

    return (
        <div className="flex h-full bg-gray-50">
             {/* Sidebar chọn Đời - Styled theo phong cách dọc đơn giản */}
            <aside className="w-20 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto flex flex-col items-center py-4 gap-3 select-none">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Chọn Đời</h3>
                {Array.from({ length: maxGen }, (_, i) => i + 1).map(gen => {
                    const isActive = gen === selectedGeneration;
                    return (
                        <div
                            key={gen}
                            onClick={() => setSelectedGeneration(gen)}
                            className={`w-14 cursor-pointer text-center py-2 px-1 rounded transition-all duration-200 ${
                                isActive 
                                    ? 'bg-red-50 text-red-800 border-r-4 border-red-800 shadow-sm' 
                                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                            }`}
                        >
                            <span className="text-[9px] block uppercase leading-tight opacity-80">Đời</span>
                            <span className={`text-xl font-bold block ${isActive ? 'scale-110' : ''}`}>{gen}</span>
                        </div>
                    );
                })}
            </aside>

             {/* Nội dung chính */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
                <div className="max-w-3xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 relative">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                Đời thứ {selectedGeneration}
                                <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                    {membersOfSelectedGeneration.length} thành viên
                                </span>
                            </h2>
                        </div>

                        {/* Thanh tìm kiếm nhanh */}
                        <div className="relative w-full md:w-72 z-20">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Tìm thành viên..." 
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-800/20 focus:border-red-800 shadow-sm"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>

                            {/* Dropdown kết quả tìm kiếm */}
                            {searchTerm.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 max-h-80 overflow-y-auto">
                                    {filteredResults.length > 0 ? (
                                        filteredResults.map(p => (
                                            <div key={p._id} onClick={() => handleSelectResult(p)} className="p-2 hover:bg-red-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3 transition-colors">
                                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 relative">
                                                    <Image src={p.avatar?.trim() ? p.avatar : (isMale(p.gender) ? Avatar_Male : Avatar_Female)} alt={p.name} fill className="object-cover" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-800">{p.name}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Đời {(p as any).generation || '?'}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-sm text-gray-400 text-center italic">Không tìm thấy thành viên</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        {membersOfSelectedGeneration.length > 0 ? (
                            membersOfSelectedGeneration.map(member => (
                                <LineageMemberCard 
                                    key={member._id} 
                                    id={`card-${member._id}`}
                                    isHighlighted={highlightedId === member._id}
                                    person={member} 
                                    allPersons={persons} 
                                    allSpouses={spouses} 
                                    allParentChilds={parentChilds} 
                                    onShowDetail={handleOpenDetail}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-dashed border-gray-300 text-gray-400">
                                <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <span>Chưa có thành viên nào trong đời này.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Chi Tiết */}
                <MemberDetailModal 
                    member={detailMember}
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    allPersons={persons}
                    allSpouses={spouses}
                    allParentChilds={parentChilds}
                />
            </main>
        </div>
    );
};

export default LineageView;
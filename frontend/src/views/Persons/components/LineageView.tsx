'use client';

import React, { useState, useMemo } from 'react';
import { Person } from 'src/services/personService';
import { Spouse, SpouseWithDetails } from 'src/services/spouseService';
import { ParentChild } from 'src/services/parentChildService';
import LineageMemberCard from './LineageMemberCard';

interface LineageViewProps {
    persons: Person[];
    spouses: (Spouse | SpouseWithDetails)[];
    parentChilds: any[];
}

const LineageView: React.FC<LineageViewProps> = ({ persons, spouses, parentChilds }) => {
    const [selectedGeneration, setSelectedGeneration] = useState<number>(1);

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
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Danh sách Đời thứ {selectedGeneration}
                            <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                {membersOfSelectedGeneration.length} thành viên
                            </span>
                        </h2>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        {membersOfSelectedGeneration.length > 0 ? (
                            membersOfSelectedGeneration.map(member => (
                                <LineageMemberCard 
                                    key={member._id} 
                                    person={member} 
                                    allPersons={persons} 
                                    allSpouses={spouses} 
                                    allParentChilds={parentChilds} 
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
            </main>
        </div>
    );
};

export default LineageView;
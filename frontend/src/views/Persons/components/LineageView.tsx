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

    // 2. Lọc thành viên theo đời được chọn
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
            {/* Sidebar chọn Đời */}
            <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
                <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Chọn Đời</h3>
                    <div className="space-y-2">
                        {Array.from({ length: maxGen }, (_, i) => i + 1).map(gen => {
                            const stats = generationStats[gen] || { total: 0 };
                            const isActive = gen === selectedGeneration;
                            return (
                                <button
                                    key={gen}
                                    onClick={() => setSelectedGeneration(gen)}
                                    className={`w-full flex justify-between items-center px-4 py-2 text-left text-sm font-medium rounded-lg transition-colors ${
                                        isActive ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <span>Đời thứ {gen}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-blue-500' : 'bg-gray-200 text-gray-600'}`}>
                                        {stats.total}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </aside>

            {/* Nội dung chính */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Danh sách thành viên Đời thứ {selectedGeneration}</h2>
                    <div className="space-y-4">
                        {membersOfSelectedGeneration.length > 0 ? (
                            membersOfSelectedGeneration.map(member => <LineageMemberCard key={member._id} person={member} allPersons={persons} allSpouses={spouses} allParentChilds={parentChilds} />)
                        ) : (<div className="text-center text-gray-500 py-10">Không có thành viên nào trong đời này.</div>)}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LineageView;
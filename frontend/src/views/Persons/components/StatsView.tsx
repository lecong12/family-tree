'use client';

import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Person } from 'src/services/personService';
import { Gender } from 'src/constants';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface StatsViewProps {
    persons: Person[];
    spouses: any[];
}

const StatsView: React.FC<StatsViewProps> = ({ persons, spouses }) => {
    const genderData = useMemo(() => {
        const male = persons.filter(p => p.gender === Gender.MALE).length;
        const female = persons.filter(p => p.gender === Gender.FEMALE).length;
        return {
            labels: ['Nam', 'Nữ'],
            datasets: [
                {
                    label: 'Số lượng',
                    data: [male, female],
                    backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)'],
                    borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
                    borderWidth: 1,
                },
            ],
        };
    }, [persons]);

    const livingStatusData = useMemo(() => {
        const living = persons.filter(p => !p.isDead).length;
        const deceased = persons.filter(p => p.isDead).length;
        return {
            labels: ['Còn sống', 'Đã mất'],
            datasets: [
                {
                    label: 'Số lượng',
                    data: [living, deceased],
                    backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)'],
                    borderColor: ['rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'],
                    borderWidth: 1,
                },
            ],
        };
    }, [persons]);
    
    const ageDistributionData = useMemo(() => {
        const ageGroups = {
            '0-18': 0,
            '19-40': 0,
            '41-60': 0,
            '61+': 0,
            'Không rõ': 0,
        };

        persons.forEach(p => {
            if (!p.birth) {
                ageGroups['Không rõ']++;
                return;
            }
            const birthYear = new Date(p.birth).getFullYear();
            // Use current year for living people, death year for deceased
            const endYear = p.isDead && p.death ? new Date(p.death).getFullYear() : new Date().getFullYear();
            const age = endYear - birthYear;

            if (age < 0) { // Handle cases where death date might be before birth date in data
                ageGroups['Không rõ']++;
            } else if (age <= 18) {
                ageGroups['0-18']++;
            } else if (age <= 40) {
                ageGroups['19-40']++;
            } else if (age <= 60) {
                ageGroups['41-60']++;
            } else {
                ageGroups['61+']++;
            }
        });

        return {
            labels: Object.keys(ageGroups),
            datasets: [
                {
                    label: 'Số lượng thành viên',
                    data: Object.values(ageGroups),
                    backgroundColor: 'rgba(255, 159, 64, 0.6)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1,
                },
            ],
        };
    }, [persons]);

    const branchData = useMemo(() => {
        const counts: Record<string, number> = {};
        persons.forEach(p => {
            // @ts-ignore
            const branch = p.branch;
            const label = branch && branch !== '0' ? `Phái ${branch}` : 'Gốc / Chưa rõ';
            counts[label] = (counts[label] || 0) + 1;
        });

        const labels = Object.keys(counts).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        return {
            labels,
            datasets: [{
                label: 'Thành viên',
                data: labels.map(l => counts[l]),
                backgroundColor: 'rgba(255, 206, 86, 0.6)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1,
            }]
        };
    }, [persons]);

    const generationData = useMemo(() => {
        const counts: Record<number, number> = {};
        let maxGen = 0;
        persons.forEach(p => {
            // @ts-ignore
            if (p.generation) {
                // @ts-ignore
                counts[p.generation] = (counts[p.generation] || 0) + 1;
                // @ts-ignore
                if (p.generation > maxGen) maxGen = p.generation;
            }
        });

        const labels = [];
        const data = [];
        for (let i = 1; i <= maxGen; i++) {
            if (counts[i]) {
                labels.push(`Đời ${i}`);
                data.push(counts[i]);
            }
        }

        return {
            labels,
            datasets: [{
                label: 'Thành viên',
                data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            }]
        };
    }, [persons]);

    const spouseCountData = useMemo(() => {
        const husbandCounts: Record<string, number> = {};
        
        // Khởi tạo đếm cho nam giới
        persons.forEach(p => {
            if (p.gender === Gender.MALE && p._id) husbandCounts[p._id] = 0;
        });

        spouses.forEach(s => {
            const husbandId = typeof s.husband === 'string' ? s.husband : s.husband?._id;
            if (husbandId && husbandCounts[husbandId] !== undefined) husbandCounts[husbandId]++;
        });

        const data = [0, 0, 0, 0, 0]; // 0, 1, 2, 3, >3
        Object.values(husbandCounts).forEach(c => {
            if (c >= 4) data[4]++;
            else data[c]++;
        });

        return {
            labels: ['Độc thân', '1 Vợ', '2 Vợ', '3 Vợ', '>3 Vợ'],
            datasets: [{
                label: 'Số lượng Nam giới',
                data,
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
            }]
        };
    }, [persons, spouses]);

    const birthMonthData = useMemo(() => {
        const counts = Array(12).fill(0);
        persons.forEach(p => {
            if (p.birth) {
                const date = new Date(p.birth);
                if (!isNaN(date.getTime())) {
                    counts[date.getMonth()]++; // getMonth() trả về 0-11
                }
            }
        });

        return {
            labels: Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`),
            datasets: [{
                label: 'Số lượng',
                data: counts,
                backgroundColor: 'rgba(54, 162, 235, 0.6)', // Màu xanh dương
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            }]
        };
    }, [persons]);

    if (persons.length === 0) {
        return <div className="p-10 text-center text-gray-500">Không có dữ liệu để thống kê.</div>;
    }

    return (
        <div className="p-4 md:p-8 min-h-full bg-slate-50/50">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Thống kê Gia tộc</h2>
                        <p className="text-gray-500 text-sm mt-1">Tổng quan dữ liệu về thành viên và các mối quan hệ</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm font-medium text-gray-600">
                        Tổng số: <span className="text-blue-600 font-bold text-lg ml-1">{persons.length}</span> thành viên
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    
                    {/* 1. Giới tính - Doughnut */}
                    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 xl:col-span-1">
                        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3 bg-gradient-to-r from-blue-50/50 to-white">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">👥</div>
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Giới tính</h3>
                        </div>
                        <div className="p-6 flex justify-center">
                            <div className="w-48">
                                <Doughnut data={genderData} options={{ plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } } }} />
                            </div>
                        </div>
                    </div>

                    {/* 2. Tình trạng - Doughnut */}
                    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 xl:col-span-1">
                        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3 bg-gradient-to-r from-green-50/50 to-white">
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">❤️</div>
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Tình trạng</h3>
                        </div>
                        <div className="p-6 flex justify-center">
                             <div className="w-48">
                                <Doughnut data={livingStatusData} options={{ plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } } }} />
                            </div>
                        </div>
                    </div>

                    {/* 3. Số lượng Vợ (Nam giới) - Bar (Vertical) */}
                    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 xl:col-span-1">
                        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3 bg-gradient-to-r from-purple-50/50 to-white">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm">💍</div>
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Hôn phối (Nam)</h3>
                        </div>
                        <div className="p-4 h-64">
                            <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={spouseCountData} />
                        </div>
                    </div>

                     {/* 4. Độ tuổi - Bar (Vertical) */}
                     <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 xl:col-span-1">
                        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3 bg-gradient-to-r from-orange-50/50 to-white">
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm">🎂</div>
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Độ tuổi</h3>
                        </div>
                        <div className="p-4 h-64">
                            <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: false } } }} data={ageDistributionData} />
                        </div>
                    </div>
                    
                    {/* 5. Phân bổ theo Phái/Chi */}
                    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 xl:col-span-2">
                        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3 bg-gradient-to-r from-yellow-50/50 to-white">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-sm">🌿</div>
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Phân bổ theo Phái / Chi</h3>
                        </div>
                        <div className="p-5 h-80">
                            <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={branchData} />
                        </div>
                    </div>

                    {/* 6. Phân bổ sinh nhật (Tháng) */}
                    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 xl:col-span-2">
                        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3 bg-gradient-to-r from-cyan-50/50 to-white">
                            <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-sm">📅</div>
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Sinh nhật theo Tháng</h3>
                        </div>
                         <div className="p-5 h-80">
                            <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={birthMonthData} />
                        </div>
                    </div>

                    {/* 7. Phân bổ theo Thế hệ (Đời) - Full width */}
                    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 xl:col-span-4">
                        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3 bg-gradient-to-r from-indigo-50/50 to-white">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">🌳</div>
                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Thành viên qua các Thế hệ</h3>
                        </div>
                         <div className="p-5 h-96">
                            <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={generationData} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StatsView;
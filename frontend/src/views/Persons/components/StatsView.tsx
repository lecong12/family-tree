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
        <div className="p-4 md:p-8 bg-gray-50 min-h-full">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Phân bổ theo Giới tính</h3>
                    <div className="w-full max-w-xs mx-auto">
                        <Doughnut data={genderData} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Phân bổ theo Tình trạng</h3>
                    <div className="w-full max-w-xs mx-auto">
                        <Doughnut data={livingStatusData} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Số lượng Vợ (Nam giới)</h3>
                    <div className="w-full h-64 mx-auto">
                        <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={spouseCountData} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Phân bổ sinh nhật (Tháng)</h3>
                    <div className="w-full h-64 mx-auto">
                        <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={birthMonthData} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-shadow duration-300 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Phân bổ theo Phái/Chi</h3>
                    <div className="w-full h-80 mx-auto">
                        <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={branchData} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-shadow duration-300 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Phân bổ theo Độ tuổi</h3>
                    <div className="w-full h-80 mx-auto">
                        <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false, }, title: { display: true, text: 'Số lượng thành viên trong các nhóm tuổi', }, }, }} data={ageDistributionData} />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Phân bổ theo Thế hệ (Đời)</h3>
                    <div className="w-full h-80 mx-auto">
                        <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={generationData} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsView;
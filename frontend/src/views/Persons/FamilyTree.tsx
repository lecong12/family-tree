'use client';

import React from 'react';

interface Person {
    _id: string;
    name: string;
    gender: number | string;
    avatar: string;
    birth?: string;
    death?: string;
}

interface SpouseNode {
    user: {
        id: string;
        spouseOrder: number;
    };
    spouseOrder: number;
    children: string[];
}

interface FamilyUnit {
    user: string;
    spouses: SpouseNode[];
}

interface TreeData {
    personData: Record<string, Person>;
    treeData: FamilyUnit[][];
}

interface FamilyTreeProps {
    data: TreeData;
}

export default function FamilyTree({ data }: FamilyTreeProps) {
    const { personData, treeData } = data;

    if (!treeData || treeData.length === 0) return <div className="p-4 text-center text-gray-500">Chưa có dữ liệu gia phả</div>;

    return (
        <div className="p-8 overflow-x-auto min-h-screen bg-gray-50 font-sans">
            <div className="flex flex-col gap-12 min-w-max">
                {treeData.map((generation, genIndex) => (
                    <div key={genIndex} className="relative flex items-start pt-4 pb-8 border-b border-dashed border-gray-200 last:border-0">
                        {/* Nhãn thế hệ (Màu vàng, ô nhỏ dễ nhìn) */}
                        <div className="absolute left-0 top-0 z-10 sticky left-0">
                            <div className="bg-yellow-200 border border-yellow-400 text-red-600 font-bold text-xs px-2 py-1 rounded shadow-sm uppercase tracking-wide">
                                Thế hệ {genIndex + 1}
                            </div>
                        </div>

                        {/* Nội dung thế hệ */}
                        <div className="flex-1 flex justify-center gap-16 pt-6 pl-20">
                            {generation.map((family, famIndex) => (
                                <FamilyNode
                                    key={`${genIndex}-${famIndex}`}
                                    family={family}
                                    personData={personData}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FamilyNode({ family, personData }: { family: FamilyUnit; personData: Record<string, Person> }) {
    const mainPerson = personData[family.user];
    if (!mainPerson) return null;

    const isMainMale = isMale(mainPerson);

    return (
        <div className="flex items-start gap-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            {/* Người chính (Chồng hoặc Vợ gốc) */}
            <PersonCard person={mainPerson} isRoot={true} />

            {/* Danh sách vợ/chồng */}
            {family.spouses.map((spouseRel, index) => {
                const spouse = personData[spouseRel.user.id];
                if (!spouse) return null;

                return (
                    <div key={index} className="flex items-center gap-4">
                        {/* Mối quan hệ (Hình thoi nửa xanh nửa đỏ) */}
                        <div className="flex flex-col items-center justify-center relative px-1">
                            <div className="w-8 h-8 relative flex items-center justify-center">
                                {/* Hình thoi xoay 45 độ */}
                                <div 
                                    className="w-6 h-6 transform rotate-45 border border-gray-300 shadow-sm overflow-hidden"
                                    style={{
                                        // Gradient chéo 135 độ để tạo hiệu ứng chia đôi khi xoay 45 độ
                                        background: 'linear-gradient(135deg, #3b82f6 50%, #ef4444 50%)'
                                    }}
                                >
                                </div>
                                {/* Ký tự v1, v2 hoặc c1, c2 */}
                                <span className="absolute text-[10px] font-bold text-white drop-shadow-md z-10">
                                    {isMainMale ? `v${spouseRel.spouseOrder}` : `c${spouseRel.spouseOrder}`}
                                </span>
                            </div>
                            {/* Đường nối xuống con (nếu cần vẽ thêm SVG sau này) */}
                            {spouseRel.children && spouseRel.children.length > 0 && (
                                <div className="w-[1px] h-4 bg-gray-300 mt-1"></div>
                            )}
                        </div>

                        {/* Người phối ngẫu */}
                        <PersonCard person={spouse} />
                    </div>
                );
            })}
        </div>
    );
}

function PersonCard({ person, isRoot = false }: { person: Person; isRoot?: boolean }) {
    const isMaleGender = isMale(person);
    const borderColor = isMaleGender ? 'border-blue-500' : 'border-red-500';
    const textColor = isMaleGender ? 'text-blue-700' : 'text-red-700';
    const bgColor = isRoot ? (isMaleGender ? 'bg-blue-50' : 'bg-red-50') : 'bg-white';

    return (
        <div className="flex flex-col items-center gap-2 w-28 relative group cursor-pointer">
            <div className={`w-16 h-16 rounded-full border-2 p-0.5 ${borderColor} overflow-hidden shadow-md transition-transform hover:scale-110 bg-white`}>
                <img 
                    src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}`} 
                    alt={person.name}
                    className="w-full h-full object-cover rounded-full"
                />
            </div>
            <div className={`text-center px-2 py-1 rounded shadow-sm border border-gray-100 w-full z-10 ${bgColor}`}>
                <p className={`font-bold text-xs truncate ${textColor}`}>
                    {person.name}
                </p>
                <p className="text-[10px] text-gray-500">
                    {getYear(person.birth)} {person.death ? `- ${getYear(person.death)}` : ''}
                </p>
            </div>
        </div>
    );
}

function isMale(person: Person) {
    return person.gender === 0 || person.gender === 'MALE' || person.gender === 'Nam' || String(person.gender) === '0';
}

function getYear(dateStr?: string) {
    if (!dateStr) return '';
    return new Date(dateStr).getFullYear();
}
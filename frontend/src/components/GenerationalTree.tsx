'use client';

import React from 'react';

// Interfaces
interface Person {
    _id: string;
    name: string;
    gender: number | string;
    avatar: string;
    birth?: string;
    death?: string;
}

interface SpouseNode {
    user: { id: string; spouseOrder: number; };
    spouseOrder: number;
    children: string[];
}

interface FamilyUnit {
    user: string;
    spouses: SpouseNode[];
    children?: string[];
}

interface TreeData {
    personData: Record<string, Person>;
    treeData: FamilyUnit[][];
}

interface GenerationalTreeProps {
    data: TreeData;
    onPersonClick: (person: Person) => void;
}

// Helper Functions
const isMale = (person: Person) => person.gender === 0 || person.gender === 'MALE' || String(person.gender) === '0';
const getYear = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return isNaN(date.getFullYear()) ? '' : date.getFullYear();
};

// Sub-components
function PersonCard({ person, isRoot = false, onClick }: { person: Person; isRoot?: boolean; onClick: () => void }) {
    const isMaleGender = isMale(person);
    const borderColor = isMaleGender ? 'border-blue-500' : 'border-red-500';
    const textColor = isMaleGender ? 'text-blue-700' : 'text-red-700';
    const bgColor = isRoot ? (isMaleGender ? 'bg-blue-50' : 'bg-red-50') : 'bg-white';

    return (
        <div className="flex flex-col items-center gap-2 w-28 relative group cursor-pointer" onClick={onClick}>
            <div className={`w-16 h-16 rounded-full border-2 p-0.5 ${borderColor} overflow-hidden shadow-md transition-transform hover:scale-110 bg-white`}>
                <img 
                    src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}`} 
                    alt={person.name}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => { 
                        const target = e.target as HTMLImageElement;
                        const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random`;
                        // Tránh vòng lặp vô hạn nếu fallback cũng lỗi
                        if (target.src !== fallback) {
                            target.src = fallback;
                        } else {
                            target.style.display = 'none'; // Ẩn ảnh nếu lỗi hẳn
                            if (target.parentElement) {
                                target.parentElement.style.backgroundColor = '#e5e7eb'; // Màu nền xám thay thế
                            }
                        }
                    }}
                />
            </div>
            <div className={`text-center px-2 py-1 rounded shadow-sm border border-gray-100 w-full z-10 ${bgColor}`}>
                <p className={`font-bold text-xs truncate ${textColor}`}>{person.name}</p>
                <p className="text-[10px] text-gray-500">{getYear(person.birth)} {person.death ? `- ${getYear(person.death)}` : ''}</p>
            </div>
        </div>
    );
}

function FamilyNode({ family, personData, onPersonClick }: { family: FamilyUnit; personData: Record<string, Person>; onPersonClick: (person: Person) => void; }) {
    const mainPerson = personData[family.user];
    if (!mainPerson) return null;

    const isMainMale = isMale(mainPerson);

    // Hợp nhất tất cả con cái từ các mối quan hệ vợ chồng và con riêng
    const allChildrenIds = [
        ...(family.children || []),
        ...family.spouses.flatMap(s => s.children || [])
    ];
    const uniqueChildren = [...new Set(allChildrenIds)]
        .map(id => personData[id])
        .filter((p): p is Person => Boolean(p));

    return (
        <div className="inline-flex flex-col items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            {/* Hàng cha mẹ */}
            <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                    <PersonCard person={mainPerson} isRoot={true} onClick={() => onPersonClick(mainPerson)} />
                </div>

                {family.spouses.map((spouseRel, index) => {
                    const spouse = personData[spouseRel.user.id];
                    if (!spouse) return null;

                    return (
                        <div key={index} className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center relative px-1">
                                <div className="w-8 h-8 relative flex items-center justify-center">
                                    <div 
                                        className="w-6 h-6 transform rotate-45 border border-gray-400 shadow-sm overflow-hidden"
                                        style={{ background: 'linear-gradient(135deg, #3b82f6 50%, #ef4444 50%)' }}
                                    ></div>
                                    <span className="absolute text-[10px] font-bold text-white drop-shadow-md z-10">
                                        {isMainMale ? `v${spouseRel.spouseOrder}` : `c${spouseRel.spouseOrder}`}
                                    </span>
                                </div>
                            </div>
                            <PersonCard person={spouse} onClick={() => onPersonClick(spouse)} />
                        </div>
                    );
                })}
            </div>

            {/* Hàng con cái */}
            {uniqueChildren.length > 0 && (
                <div className="flex flex-col items-center w-full pt-4">
                    {/* Đường nối từ cha mẹ xuống con cái */}
                    <div className="w-px h-6 bg-gray-300 mb-4" />
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-4">
                        {uniqueChildren.map(child => (
                            <PersonCard key={child._id} person={child} onClick={() => onPersonClick(child)} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Main Component
export default function GenerationalTree({ data, onPersonClick }: GenerationalTreeProps) {
    const { personData, treeData } = data;

    if (!treeData || treeData.length === 0) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-gray-50">
                <div className="text-center text-gray-500">
                    <p className="text-lg font-medium">Chưa có dữ liệu gia phả</p>
                    <p className="text-sm mt-2">Hãy thêm thành viên và mối quan hệ để hiển thị cây.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 overflow-auto w-full h-[calc(100vh-3.5rem)] bg-gray-100" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23e0e0e0\" fill-opacity=\"0.4\" fill-rule=\"evenodd\"%3E%3Ccircle cx=\"3\" cy=\"3\" r=\"3\"/%3E%3Ccircle cx=\"13\" cy=\"13\" r=\"3\"/%3E%3C/g%3E%3C/svg%3E')" }}>
            <div className="flex flex-col items-center gap-12 min-w-max pb-20">
                {treeData.map((generation, genIndex) => (
                    <div key={genIndex} className="flex flex-col items-center gap-4 w-full">
                        <div className="sticky top-4 z-10">
                            <div className="bg-yellow-200 border-2 border-yellow-300 text-red-600 font-bold px-3 py-1 rounded-md shadow-md uppercase tracking-wider text-sm">
                                Thế hệ {genIndex + 1}
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center items-start gap-8">
                            {generation.map((family, famIndex) => (
                                <FamilyNode
                                    key={`${genIndex}-${famIndex}`}
                                    family={family}
                                    personData={personData}
                                    onPersonClick={onPersonClick}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
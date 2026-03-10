'use client';

import React, { useMemo, useEffect } from 'react';
import { SearchBar } from './SearchBar';

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
    focusedPersonId?: string | null;
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
        <div data-person-id={person._id} className="flex flex-col items-center gap-2 w-28 relative group cursor-pointer" onClick={onClick}>
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
            <div className={`text-center px-2 py-1 rounded shadow-sm border border-gray-100 w-full ${bgColor}`}>
                <p className={`font-bold text-xs truncate ${textColor}`}>{person.name}</p>
                <p className="text-[10px] text-gray-500">{getYear(person.birth)} {person.death ? `- ${getYear(person.death)}` : ''}</p>
            </div>
        </div>
    );
}

function TreeNode({ 
    family, 
    personData, 
    onPersonClick, 
    familyMap,
}: { 
    family: FamilyUnit; 
    personData: Record<string, Person>; 
    onPersonClick: (person: Person) => void;
    familyMap: Map<string, FamilyUnit>;
}) {
    const mainPerson = personData[family.user];
    if (!mainPerson) return null;

    const isMainMale = isMale(mainPerson);

    // 1. Lọc và Sắp xếp Vợ/Chồng
    const uniqueSpouses = family.spouses.filter((spouse, index, self) => 
        index === self.findIndex((t) => t.user.id === spouse.user.id)
    );
    // Sắp xếp theo thứ tự kết hôn (spouseOrder)
    uniqueSpouses.sort((a, b) => a.spouseOrder - b.spouseOrder);

    // Tìm con "mồ côi" (không thuộc về cuộc hôn nhân nào được liệt kê)
    const spouseChildrenIds = new Set(uniqueSpouses.flatMap(s => s.children || []));
    const orphanChildrenIds = (family.children || []).filter(id => !spouseChildrenIds.has(id));

    // 2. Phân chia Vợ/Chồng sang Trái/Phải
    const leftSpouses: SpouseNode[] = [];
    const rightSpouses: SpouseNode[] = [];

    if (uniqueSpouses.length === 1) {
        rightSpouses.push(uniqueSpouses[0]);
    } else {
        uniqueSpouses.forEach((s, i) => {
            if (i % 2 === 0) leftSpouses.push(s); // Chẵn (0, 2...) -> Trái
            else rightSpouses.push(s);            // Lẻ (1, 3...) -> Phải
        });
        // Đảo ngược bên trái để người có order nhỏ nhất (Vợ 1) nằm gần Chồng nhất
        leftSpouses.reverse();
    }

    // 3. Hàm render một nhánh Vợ/Chồng và Con cái của họ
    const renderSpouseBranch = (spouseRel: SpouseNode, side: 'left' | 'right') => {
        const spouse = personData[spouseRel.user.id];
        if (!spouse) return null;

        const childrenIds = spouseRel.children || [];

        return (
            <div key={spouse._id} className={`flex flex-col items-center ${side === 'left' ? 'mr-8' : 'ml-8'}`}>
                {/* Hàng Vợ Chồng: Card + Dây nối */}
                <div className={`flex items-center ${side === 'left' ? 'flex-row' : 'flex-row-reverse'}`}>
                    {/* Thẻ Vợ/Chồng */}
                    <PersonCard person={spouse} onClick={() => onPersonClick(spouse)} />
                    
                    {/* Dây nối tới Chồng (MainPerson) */}
                    <div className="relative flex items-center">
                        {/* Thanh ngang nối Vợ - Chồng */}
                        <div className="w-12 h-px bg-gray-400"></div>
                        
                        {/* Dây dọc xuống Con cái (xuất phát từ giữa thanh ngang) */}
                        {childrenIds.length > 0 && (
                            <div className="absolute left-1/2 top-0 w-px h-10 bg-gray-400 transform -translate-x-1/2"></div>
                        )}

                        {/* Icon hôn nhân (trái tim/chấm tròn) */}
                        <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 z-10">
                            <div className="w-8 h-8 relative flex items-center justify-center">
                                <div 
                                    className="w-6 h-6 transform rotate-45 border border-gray-400 shadow-sm overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, #3b82f6 50%, #ef4444 50%)' }}
                                ></div>
                                <span className="absolute text-[10px] font-bold text-white drop-shadow-md">
                                    {isMainMale ? `v${spouseRel.spouseOrder}` : `c${spouseRel.spouseOrder}`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hàng Con cái */}
                {childrenIds.length > 0 && (
                    <div className="flex flex-col items-center mt-10">
                        <div className="flex justify-center items-start gap-6">
                            {childrenIds.map((childId, index) => {
                                const childPerson = personData[childId];
                                if (!childPerson) return null;

                                const childFamily = familyMap.get(childId);
                                const isFirst = index === 0;
                                const isLast = index === childrenIds.length - 1;
                                const isOnly = childrenIds.length === 1;

                                return (
                                    <div key={childId} className="flex flex-col items-center relative">
                                        {/* Vẽ khung dây nối phía trên đầu con */}
                                        {!isOnly && (
                                            <>
                                                <div className={`absolute top-0 left-0 w-1/2 h-6 border-t border-gray-400 ${isFirst ? 'invisible' : ''}`}></div>
                                                <div className={`absolute top-0 right-0 w-1/2 h-6 border-t border-gray-400 ${isLast ? 'invisible' : ''}`}></div>
                                            </>
                                        )}
                                        <div className="absolute top-0 w-px h-6 bg-gray-400"></div>
                                        
                                        {/* Khoảng cách đệm để dây chạm vào đầu thẻ */}
                                        <div className="h-6"></div>

                                        {/* Đệ quy vẽ tiếp hoặc vẽ thẻ con */}
                                        <div>
                                            {childFamily ? (
                                                <TreeNode 
                                                    family={childFamily} 
                                                    personData={personData} 
                                                    onPersonClick={onPersonClick} 
                                                    familyMap={familyMap}
                                                />
                                            ) : (
                                                <PersonCard person={childPerson} onClick={() => onPersonClick(childPerson)} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center">
            <div className="flex items-start">
                {/* Nhóm Vợ bên Trái */}
                <div className="flex">
                    {leftSpouses.map(s => renderSpouseBranch(s, 'left'))}
                </div>

                {/* Người Chồng (Trung tâm) */}
                <div className="mx-4 z-10 relative">
                    <PersonCard person={mainPerson} isRoot={true} onClick={() => onPersonClick(mainPerson)} />
                    {/* Render con "mồ côi" ngay dưới người cha/mẹ chính */}
                    {orphanChildrenIds.length > 0 && (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                            <div className="w-px h-8 bg-gray-300"></div>
                            <div className="flex justify-center items-start gap-6">
                                {orphanChildrenIds.map((childId) => {
                                    const childPerson = personData[childId];
                                    if (!childPerson) return null;
                                    const childFamily = familyMap.get(childId);
                                    
                                    return (
                                        <div key={childId} className="flex flex-col items-center relative pt-6">
                                            <div className="absolute top-0 w-px h-6 bg-gray-300"></div>
                                            {/* Có thể thêm logic vẽ đường nối ngang cho nhiều con mồ côi ở đây */}
                                            
                                            {childFamily ? (
                                                <TreeNode 
                                                    family={childFamily} 
                                                    personData={personData} 
                                                    onPersonClick={onPersonClick} 
                                                    familyMap={familyMap}
                                                />
                                            ) : (
                                                <PersonCard person={childPerson} onClick={() => onPersonClick(childPerson)} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Nhóm Vợ bên Phải */}
                <div className="flex">
                    {rightSpouses.map(s => renderSpouseBranch(s, 'right'))}
                </div>
            </div>
        </div>
    );
}

// Main Component
export default function GenerationalTree({ data, onPersonClick, focusedPersonId }: GenerationalTreeProps) {
    const { personData, treeData } = data;
    const [internalFocusedId, setInternalFocusedId] = React.useState<string | null>(null);

    useEffect(() => {
        const targetId = internalFocusedId || focusedPersonId;
        if (targetId) {
            const element = document.querySelector(`[data-person-id="${targetId}"]`);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center',
                });

                // Add a temporary highlight effect
                element.classList.add('ring-4', 'ring-offset-4', 'ring-yellow-400', 'rounded-lg', 'transition-all', 'duration-300');
                const timer = setTimeout(() => {
                    element.classList.remove('ring-4', 'ring-offset-4', 'ring-yellow-400', 'rounded-lg');
                }, 2500); // Highlight for 2.5 seconds

                return () => clearTimeout(timer);
            }
        }
    }, [focusedPersonId, internalFocusedId]);

    // Chuẩn bị dữ liệu: Map và Root Families
    const { familyMap, rootFamilies } = useMemo(() => {
        if (!treeData || treeData.length === 0) return { familyMap: new Map(), rootFamilies: [] };
        
        const map = new Map<string, FamilyUnit>();
        treeData.forEach(gen => {
            gen.forEach(family => {
                map.set(family.user, family);
            });
        });

        // Thế hệ đầu tiên trong mảng treeData được coi là gốc
        const roots = treeData[0] || [];
        return { familyMap: map, rootFamilies: roots };
    }, [treeData]);

    if (!treeData || treeData.length === 0) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-gray-50">
                <div className="text-center text-gray-500">
                    <p className="text-lg font-medium">Chưa có dữ liệu gia phả</p>
                    <p className="text-sm mt-2">Hãy thêm thành viên và mối quan hệ để hiển thị.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[calc(100vh-3.5rem)]">
            {/* Search Bar đặt trực tiếp trên màn hình cây */}
            <SearchBar onNodeSelect={setInternalFocusedId} />

            <div className="w-full h-full bg-gray-100 overflow-auto cursor-grab active:cursor-grabbing" 
                 style={{ backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
                <div className="min-w-max min-h-full p-20 flex justify-center items-start">
                    <div className="flex gap-16">
                        {rootFamilies.map(family => (
                            <TreeNode
                                key={family.user}
                                family={family}
                                personData={personData}
                                onPersonClick={onPersonClick}
                                familyMap={familyMap}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
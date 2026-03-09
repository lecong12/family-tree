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
    renderedIds 
}: { 
    family: FamilyUnit; 
    personData: Record<string, Person>; 
    onPersonClick: (person: Person) => void;
    familyMap: Map<string, FamilyUnit>;
    renderedIds: Set<string>;
}) {
    const mainPerson = personData[family.user];
    if (!mainPerson) return null;

    // Kiểm tra nếu gia đình này đã được vẽ ở nhánh khác để tránh lặp vô hạn
    if (renderedIds.has(family.user)) {
        return (
            <div className="flex flex-col items-center opacity-50">
                <PersonCard person={mainPerson} onClick={() => onPersonClick(mainPerson)} />
                <div className="mt-1 text-[10px] text-gray-400 font-medium">(Đã hiển thị)</div>
            </div>
        );
    }
    renderedIds.add(family.user);

    const isMainMale = isMale(mainPerson);

    // Lọc danh sách vợ/chồng để tránh trùng lặp (nếu dữ liệu backend trả về bị dư)
    const uniqueSpouses = family.spouses.filter((spouse, index, self) => 
        index === self.findIndex((t) => t.user.id === spouse.user.id)
    );

    // Hợp nhất tất cả con cái
    const allChildrenIds = [
        ...(family.children || []),
        ...family.spouses.flatMap(s => s.children || [])
    ];
    const uniqueChildrenIds = [...new Set(allChildrenIds)];

    return (
        <div className="flex flex-col items-center">
            {/* Hàng Cha Mẹ */}
            <div className="flex items-start gap-4 relative">
                {/* Spacer (ẩn) để cân bằng layout: Giúp MainPerson luôn nằm chính giữa, 
                    từ đó đường nối xuống con cái sẽ xuất phát từ MainPerson (theo huyết thống) 
                    thay vì từ giữa cặp vợ chồng. */}
                {uniqueSpouses.map((_, index) => (
                    <div key={`spacer-${index}`} className="flex items-center gap-3 invisible" aria-hidden="true">
                        <div className="flex flex-col items-center justify-center relative px-1">
                            <div className="w-6 h-6"></div>
                        </div>
                        <div className="w-28"></div>
                    </div>
                ))}

                <PersonCard person={mainPerson} isRoot={true} onClick={() => onPersonClick(mainPerson)} />
                
                {uniqueSpouses.map((spouseRel, index) => {
                    const spouse = personData[spouseRel.user.id];
                    if (!spouse) return null;

                    return (
                        <div key={index} className="flex items-center gap-3">
                            {/* Icon kết hôn */}
                            <div className="flex flex-col items-center justify-center relative px-1">
                                <div className="w-6 h-6 relative flex items-center justify-center">
                                    <div className="w-4 h-4 transform rotate-45 border border-gray-300 bg-pink-50 shadow-sm"></div>
                                </div>
                            </div>
                            <PersonCard person={spouse} onClick={() => onPersonClick(spouse)} />
                        </div>
                    );
                })}
            </div>

            {/* Hàng Con Cái */}
            {uniqueChildrenIds.length > 0 && (
                <div className="flex flex-col items-center">
                    {/* Đường nối dọc từ cha mẹ xuống */}
                    <div className="w-px h-8 bg-gray-300"></div>
                    
                    <div className="flex justify-center items-start">
                        {uniqueChildrenIds.map((childId, index) => {
                            const childPerson = personData[childId];
                            if (!childPerson) return null;

                            const childFamily = familyMap.get(childId);
                            const isFirst = index === 0;
                            const isLast = index === uniqueChildrenIds.length - 1;
                            const isOnly = uniqueChildrenIds.length === 1;

                            return (
                                <div key={childId} className="flex flex-col items-center relative px-4">
                                    {/* Vẽ các đường nối ngang/dọc tạo hình cây */}
                                    {!isOnly && (
                                        <>
                                            <div className={`absolute top-0 left-0 w-1/2 h-8 border-t-2 border-gray-300 ${isFirst ? 'invisible' : ''}`}></div>
                                            <div className={`absolute top-0 right-0 w-1/2 h-8 border-t-2 border-gray-300 ${isLast ? 'invisible' : ''}`}></div>
                                        </>
                                    )}
                                    <div className="absolute top-0 w-px h-8 bg-gray-300"></div>
                                    
                                    {/* Khoảng cách đệm */}
                                    <div className="h-8"></div>

                                    {/* Render Node con (Đệ quy hoặc Leaf) */}
                                    <div>
                                        {childFamily ? (
                                            <TreeNode 
                                                family={childFamily} 
                                                personData={personData} 
                                                onPersonClick={onPersonClick} 
                                                familyMap={familyMap}
                                                renderedIds={renderedIds}
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

    // Set theo dõi các node đã render trong lần vẽ này
    const renderedIds = new Set<string>();

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
                                renderedIds={renderedIds}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
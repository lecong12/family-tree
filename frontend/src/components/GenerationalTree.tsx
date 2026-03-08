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
const getYear = (dateStr?: string) => dateStr ? new Date(dateStr).getFullYear() : '';

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
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}`; }}
                />
            </div>
            <div className={`text-center px-2 py-1 rounded shadow-sm border border-gray-100 w-full z-10 ${bgColor}`}>
                <p className={`font-bold text-xs truncate ${textColor}`}>{person.name}</p>
                <p className="text-[10px] text-gray-500">{getYear(person.birth)} {person.death ? `- ${getYear(person.death)}` : ''}</p>
            </div>
        </div>
    );
}

function FamilyNode({ family, personData, onPersonClick }: { family: FamilyUnit; personData: Record<string, Person>; onPersonClick: (person: Person) => void }) {
    const mainPerson = personData[family.user];
    if (!mainPerson) return null;

    const isMainMale = isMale(mainPerson);

    return (
        <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <PersonCard person={mainPerson} isRoot={true} onClick={() => onPersonClick(mainPerson)} />

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
    );
}

// Main Component
export default function GenerationalTree({ data, onPersonClick }: GenerationalTreeProps) {
    const { personData, treeData } = data;

    if (!treeData || treeData.length === 0) {
        return <div className="p-4 text-center text-gray-500">Chưa có dữ liệu gia phả để hiển thị.</div>;
    }

    return (
        <div className="p-8 overflow-auto min-h-full bg-gray-100" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23e0e0e0\" fill-opacity=\"0.4\" fill-rule=\"evenodd\"%3E%3Ccircle cx=\"3\" cy=\"3\" r=\"3\"/%3E%3Ccircle cx=\"13\" cy=\"13\" r=\"3\"/%3E%3C/g%3E%3C/svg%3E')" }}>
            <div className="flex flex-col gap-12 min-w-max">
                {treeData.map((generation, genIndex) => (
                    <div key={genIndex} className="relative flex items-start pl-28">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                            <div className="bg-yellow-200 border-2 border-yellow-300 text-red-600 font-bold px-3 py-1 rounded-md shadow-md uppercase tracking-wider text-sm">
                                Thế hệ {genIndex + 1}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-wrap justify-center items-start gap-8 py-4 border-l-2 border-dashed border-gray-300 ml-4">
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
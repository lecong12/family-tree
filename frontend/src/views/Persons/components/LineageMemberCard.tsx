'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Person } from 'src/services/personService';
import { Spouse, SpouseWithDetails } from 'src/services/spouseService';
import { ParentChild } from 'src/services/parentChildService';
import { isMale } from 'src/utils/genderUtils';
import { Avatar_Male, Avatar_Female } from 'src/constants/imagePaths';

interface LineageMemberCardProps {
    person: Person;
    allPersons: Person[];
    allSpouses: (Spouse | SpouseWithDetails)[];
    allParentChilds: any[];
}

const COLORS = {
    headerBg: '#8b1c1c', // Đỏ đô
    subLabel: '#f1b400', // Vàng nhãn (Vợ/Con)
    textGray: '#666666',
    borderLight: '#e5e7eb'
};

const getId = (p: string | { _id?: string } | undefined | null): string => {
    if (!p) return '';
    if (typeof p === 'string') return p;
    return p._id || '';
};

const getAge = (birth: Date | string | undefined, death: Date | string | undefined, isDead: boolean) => {
    if (!birth) return 0;
    const b = new Date(birth);
    if (isNaN(b.getTime())) return 0;
    const end = isDead && death ? new Date(death) : new Date();
    const age = end.getFullYear() - b.getFullYear();
    return age > 0 ? age : 0;
};

const LineageMemberCard: React.FC<LineageMemberCardProps> = ({ person, allPersons, allSpouses, allParentChilds }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const { spouses, children } = useMemo(() => {
        const personMap = new Map(allPersons.map(p => [p._id, p]));

        // Tìm vợ/chồng
        const spouseRelations = allSpouses.filter(s => getId(s.husband) === person._id || getId(s.wife) === person._id);
        const spouseList = spouseRelations.map(s => {
            const hId = getId(s.husband);
            const wId = getId(s.wife);
            return personMap.get(hId === person._id ? wId : hId);
        }).filter(Boolean) as Person[];

        // Tìm con cái
        const childrenList = spouseRelations.flatMap(s => 
            allParentChilds.filter(pc => getId(pc.parent) === s._id).map(pc => personMap.get(getId(pc.child)))
        ).filter(Boolean) as Person[];

        // Sort children by order
        childrenList.sort((a, b) => ((a as any).order || 99) - ((b as any).order || 99));

        return { spouses: spouseList, children: childrenList };
    }, [person, allPersons, allSpouses, allParentChilds]);

    // Helper to get stats for a child/relative (used in the list)
    const getStats = (pId: string) => {
        const pSpouses = allSpouses.filter(s => getId(s.husband) === pId || getId(s.wife) === pId);
        const pSpouseIds = pSpouses.map(s => s._id);
        const pChildrenCount = allParentChilds.filter(pc => pSpouseIds.includes(getId(pc.parent))).length;
        return {
            spouseCount: pSpouses.length,
            childCount: pChildrenCount
        };
    };

    const avatarSrc = person.avatar?.trim() ? person.avatar : isMale(person.gender) ? Avatar_Male : Avatar_Female;
    const age = getAge(person.birth, person.death, person.isDead === true);

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mb-4 hover:shadow-lg transition-shadow duration-300">
            {/* HEADER: CHỦ HỘ */}
            <div 
                style={{ backgroundColor: COLORS.headerBg }} 
                className="p-3 flex justify-between items-center text-white cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 border-2 border-white/20 rounded flex items-center justify-center overflow-hidden bg-red-900 flex-shrink-0 relative">
                        <Image src={avatarSrc} alt={person.name} fill className="object-cover" sizes="48px" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-none uppercase flex items-center gap-2">
                            <span className="text-[10px] opacity-60">●</span> {person.name}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs opacity-90">
                            <span>{isMale(person.gender) ? 'Nam' : 'Nữ'}</span>
                            <span>{age} Tuổi</span>
                            <span>{spouses.length} {isMale(person.gender) ? 'Vợ' : 'Chồng'}</span>
                            <span>{children.length} Con</span>
                        </div>
                    </div>
                </div>
                <button className="w-8 h-8 flex items-center justify-center bg-black/10 rounded-full transition-transform duration-200 hover:bg-black/20">
                    <svg 
                        className={`w-4 h-4 text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                </button>
            </div>

            {/* CHI TIẾT: VỢ & CON */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-1 bg-gray-50/50">
                    {/* Hàng của Vợ/Chồng */}
                    {spouses.map((spouse) => {
                         const sStats = getStats(spouse._id!);
                         return (
                            <div key={spouse._id} className="flex items-center gap-3 p-3 border-b border-gray-100 bg-white mx-1 my-1 rounded-sm shadow-sm">
                                <div className="relative flex-shrink-0">
                                    <div className="w-12 h-12 bg-orange-50 rounded flex items-center justify-center overflow-hidden border border-orange-100">
                                         <Image 
                                            src={spouse.avatar?.trim() ? spouse.avatar : (isMale(spouse.gender) ? Avatar_Male : Avatar_Female)} 
                                            alt={spouse.name} 
                                            width={48} height={48} 
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <span style={{ backgroundColor: COLORS.subLabel }} className="absolute -bottom-1 left-0 right-0 text-[9px] text-white text-center font-bold rounded shadow-sm">
                                        {isMale(spouse.gender) ? 'CHỒNG' : 'VỢ'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 uppercase truncate text-sm">● {spouse.name}</h4>
                                    <p className="text-xs text-yellow-600 mt-0.5">
                                        {isMale(spouse.gender) ? 'Nam' : 'Nữ'} · {getAge(spouse.birth, spouse.death, spouse.isDead === true)} Tuổi
                                    </p>
                                </div>
                                <div className="text-xs text-gray-400 font-medium text-right flex-shrink-0">
                                    {sStats.childCount} Con
                                </div>
                            </div>
                        );
                    })}

                    {/* Danh sách các con */}
                    {children.map((child, idx) => {
                        const cStats = getStats(child._id!);
                        const isSon = isMale(child.gender);
                        return (
                            <div key={child._id} className="flex items-center gap-3 p-3 ml-6 border-l-2 border-dashed border-gray-300 relative">
                                {/* Connecting line visual */}
                                <div className="absolute top-1/2 -left-[2px] w-4 h-px bg-gray-300"></div>

                                <div className="relative flex-shrink-0">
                                    <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center overflow-hidden border border-gray-200">
                                        <Image 
                                            src={child.avatar?.trim() ? child.avatar : (isSon ? Avatar_Male : Avatar_Female)} 
                                            alt={child.name} 
                                            width={48} height={48} 
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <span style={{ backgroundColor: COLORS.subLabel }} className="absolute -bottom-1 left-0 right-0 text-[9px] text-white text-center font-bold rounded shadow-sm uppercase">
                                        CON {idx + 1}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 uppercase truncate text-sm">● {child.name}</h4>
                                    <p className={`text-xs mt-0.5 ${isSon ? 'text-red-700 font-medium' : 'text-yellow-600'}`}>
                                        {isSon ? 'Nam' : 'Nữ'} · {getAge(child.birth, child.death, child.isDead === true)} Tuổi
                                    </p>
                                </div>
                                <div className="text-[10px] text-gray-400 font-medium text-right flex-shrink-0 leading-tight">
                                   {cStats.spouseCount} {isSon ? 'Vợ' : 'Chồng'} <br/> {cStats.childCount} Con
                                </div>
                            </div>
                        );
                    })}
                    
                    {spouses.length === 0 && children.length === 0 && (
                        <div className="p-4 text-center text-xs text-gray-400 italic">
                            Chưa có thông tin thành viên gia đình
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LineageMemberCard;
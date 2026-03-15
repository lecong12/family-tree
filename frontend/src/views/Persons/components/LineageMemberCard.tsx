'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Person } from 'src/services/personService';
import { Spouse } from 'src/services/spouseService';
import { ParentChild } from 'src/services/parentChildService';
import { isMale } from 'src/utils/genderUtils';
import { Avatar_Male, Avatar_Female } from 'src/constants/imagePaths';

interface LineageMemberCardProps {
    person: Person;
    allPersons: Person[];
    allSpouses: Spouse[];
    allParentChilds: ParentChild[];
}

const LineageMemberCard: React.FC<LineageMemberCardProps> = ({ person, allPersons, allSpouses, allParentChilds }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const { parentText, spouses, children } = useMemo(() => {
        const personMap = new Map(allPersons.map(p => [p._id, p]));

        // Tìm cha mẹ
        let pText = "Chưa cập nhật";
        const childRelation = allParentChilds.find(pc => pc.child === person._id);
        if (childRelation) {
            const parentSpouseRelation = allSpouses.find(s => s._id === childRelation.parent);
            if (parentSpouseRelation) {
                const father = personMap.get(parentSpouseRelation.husband as string);
                const mother = personMap.get(parentSpouseRelation.wife as string);
                if (father && mother) pText = `Ông ${father.name} và Bà ${mother.name}`;
                else if (father) pText = `Ông ${father.name}`;
            }
        } else if (person.generation === 1) {
            pText = "Thủy Tổ";
        }

        // Tìm vợ/chồng
        const spouseRelations = allSpouses.filter(s => s.husband === person._id || s.wife === person._id);
        const spouseList = spouseRelations.map(s => personMap.get((s.husband === person._id ? s.wife : s.husband) as string)).filter(Boolean) as Person[];

        // Tìm con cái
        const childrenList = spouseRelations.flatMap(s => allParentChilds.filter(pc => pc.parent === s._id).map(pc => personMap.get(pc.child as string))).filter(Boolean) as Person[];

        return { parentText: pText, spouses: spouseList, children: childrenList };
    }, [person, allPersons, allSpouses, allParentChilds]);

    const avatarSrc = person.avatar?.trim() ? person.avatar : isMale(person.gender) ? Avatar_Male : Avatar_Female;
    const isDeceased = person.isDead === true;
    const borderColor = isMale(person.gender) ? 'border-blue-400' : 'border-pink-400';

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Phụ mẫu: {parentText}</div>
                <div className="flex items-center gap-4">
                    <Image src={avatarSrc} alt={person.name} width={48} height={48} className={`rounded-full object-cover border-2 ${borderColor} ${isDeceased ? 'grayscale' : ''}`} />
                    <div className="flex-1">
                        <h3 className={`text-lg font-bold ${isDeceased ? 'text-gray-500' : 'text-gray-900'}`}>{person.name}</h3>
                        <p className="text-sm text-gray-600">{isMale(person.gender) ? 'Nam' : 'Nữ'} • {children.length} Con</p>
                    </div>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Toggle details">
                        <svg className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                    <div className="space-y-2">
                        {spouses.map((s, idx) => (
                            <div key={s._id} className="flex items-center text-sm">
                                <span className="font-semibold text-gray-700 w-24 flex-shrink-0">Vợ/Chồng {spouses.length > 1 ? idx + 1 : ''}</span>
                                <span className="text-gray-800">{s.name}</span>
                            </div>
                        ))}
                        {children.map((c, idx) => (
                            <div key={c._id} className="flex items-center text-sm">
                                <span className="font-semibold text-gray-700 w-24 flex-shrink-0">Con thứ {idx + 1}</span>
                                <span className="text-gray-800">{c.name}</span>
                            </div>
                        ))}
                        {spouses.length === 0 && children.length === 0 && (
                            <p className="text-sm text-gray-500 italic">Chưa có thông tin vợ/chồng hoặc con cái.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LineageMemberCard;
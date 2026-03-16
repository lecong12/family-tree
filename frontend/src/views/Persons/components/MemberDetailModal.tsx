'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Person } from 'src/services/personService';
import { Spouse, SpouseWithDetails } from 'src/services/spouseService';
import { isMale } from 'src/utils/genderUtils';
import { Avatar_Male, Avatar_Female } from 'src/constants/imagePaths';

interface MemberDetailModalProps {
    member: Person | null;
    isOpen: boolean;
    onClose: () => void;
    allPersons: Person[];
    allSpouses: (Spouse | SpouseWithDetails)[];
    allParentChilds: any[];
}

// --- Icons Components (Inline SVGs to avoid dependencies) ---
const IconX = ({ size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
);
const IconUser = ({ size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IconUsers = ({ size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const IconCamera = ({ size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
);
const IconHeart = ({ size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 14c1.49-1.28 3.6-2.33 3.6-4.7 0-2.43-1.95-4.3-4.35-4.3-1.44 0-2.67 1.05-3.25 1.5-.58-.45-1.8-1.5-3.25-1.5C9.4 5 7.45 6.87 7.45 9.3c0 2.37 2.1 3.42 3.6 4.7l6.95 6.45L19 14z"/></svg>
);
const IconBaby = ({ size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/></svg>
);

const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ member, isOpen, onClose, allPersons, allSpouses, allParentChilds }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'rel'>('info');

    const relationships = useMemo(() => {
        if (!member) return { spouses: [], children: [] };

        const personMap = new Map(allPersons.map(p => [p._id, p]));
        const getId = (p: any) => (typeof p === 'string' ? p : p?._id || '');

        // Vợ/Chồng
        const spouseRelations = allSpouses.filter(s => getId(s.husband) === member._id || getId(s.wife) === member._id);
        const spouseList = spouseRelations.map(s => {
            const hId = getId(s.husband);
            const wId = getId(s.wife);
            const spousePerson = personMap.get(hId === member._id ? wId : hId);
            return { ...spousePerson, relationId: s._id, marriageDate: s.marriageDate };
        }).filter(s => s._id) as any[];

        // Con cái
        const childrenList = spouseRelations.flatMap(s => 
            allParentChilds.filter(pc => getId(pc.parent) === s._id).map(pc => personMap.get(getId(pc.child)))
        ).filter(Boolean) as Person[];
        
        // Sắp xếp con
        childrenList.sort((a, b) => ((a as any).order || 99) - ((b as any).order || 99));

        return { spouses: spouseList, children: childrenList };
    }, [member, allPersons, allSpouses, allParentChilds]);

    if (!isOpen || !member) return null;

    const avatarSrc = member.avatar?.trim() ? member.avatar : isMale(member.gender) ? Avatar_Male : Avatar_Female;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
            <div className="bg-[#f5f5dc] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/40 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-[#f9f9e0] pt-4 px-4 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full transition-colors">
                            <IconX size={24} className="text-[#4a3f35]" />
                        </button>
                        <h2 className="text-xl font-bold text-[#8b1c1c] uppercase tracking-wide">{member.name}</h2>
                        <div className="w-10"></div>
                    </div>
                    
                    <div className="flex border-b border-[#d7ccc8]">
                        <button 
                            onClick={() => setActiveTab('info')}
                            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${activeTab === 'info' ? 'border-b-4 border-[#8b1c1c] text-[#8b1c1c] bg-[#eceacc]' : 'text-gray-500 hover:text-[#8b1c1c]/70'}`}
                        >
                            <IconUser size={18} /> Cá nhân
                        </button>
                        <button 
                            onClick={() => setActiveTab('rel')}
                            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${activeTab === 'rel' ? 'border-b-4 border-[#8b1c1c] text-[#8b1c1c] bg-[#eceacc]' : 'text-gray-500 hover:text-[#8b1c1c]/70'}`}
                        >
                            <IconUsers size={18} /> Quan hệ
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white/80 p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {activeTab === 'info' ? (
                        <div className="space-y-6">
                             {/* Avatar Section */}
                            <div className="flex items-center gap-5 justify-center">
                                <div className="w-28 h-28 bg-orange-50 rounded-full border-4 border-white shadow-lg overflow-hidden relative group">
                                    <Image src={avatarSrc} alt={member.name} fill className="object-cover" />
                                    <button className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <IconCamera size={24} className="text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Info Fields */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#8b1c1c] uppercase tracking-wider">Họ và tên</label>
                                    <div className="w-full p-3 bg-[#fdfbf7] border border-[#e0dcd5] rounded-xl text-[#4a3f35] font-semibold">
                                        {member.name}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#8b1c1c] uppercase tracking-wider">Giới tính</label>
                                        <div className="w-full p-3 bg-[#fdfbf7] border border-[#e0dcd5] rounded-xl text-[#4a3f35]">
                                            {isMale(member.gender) ? 'Nam' : 'Nữ'}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#8b1c1c] uppercase tracking-wider">Đời thứ</label>
                                        <div className="w-full p-3 bg-[#fdfbf7] border border-[#e0dcd5] rounded-xl text-[#4a3f35]">
                                            {(member as any).generation || 1}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[#8b1c1c] uppercase tracking-wider">Ngày sinh</label>
                                    <div className="w-full p-3 bg-[#fdfbf7] border border-[#e0dcd5] rounded-xl text-[#4a3f35]">
                                        {member.birth ? new Date(member.birth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                    </div>
                                </div>
                                
                                {member.isDead && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-[#8b1c1c] uppercase tracking-wider">Ngày mất</label>
                                        <div className="w-full p-3 bg-[#fdfbf7] border border-[#e0dcd5] rounded-xl text-[#4a3f35]">
                                            {member.death ? new Date(member.death).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* SECTION: VỢ / CHỒNG */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-[#e0dcd5] pb-2">
                                    <h3 className="flex items-center gap-2 font-bold text-[#4a3f35]">
                                        <IconHeart size={18} className="text-red-600 fill-red-600" /> Vợ / Chồng
                                    </h3>
                                    <span className="text-xs font-semibold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">{relationships.spouses.length}</span>
                                </div>
                                
                                {relationships.spouses.length > 0 ? (
                                    relationships.spouses.map((s, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-[#fffdf5] rounded-2xl border border-[#e0dcd5] shadow-sm hover:border-[#f1b400] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 flex-shrink-0 relative">
                                                    <Image 
                                                        src={s.avatar?.trim() ? s.avatar : (isMale(s.gender) ? Avatar_Male : Avatar_Female)} 
                                                        alt={s.name} fill className="object-cover" 
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-[#4a3f35]">{s.name}</p>
                                                    <p className="text-[10px] text-gray-400 italic">
                                                        {s.marriageDate ? `Cưới: ${new Date(s.marriageDate).getFullYear()}` : 'Ngày cưới: ...'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 text-center py-4 italic bg-gray-50 rounded-xl">Chưa có thông tin hôn nhân</p>
                                )}
                            </div>

                            {/* SECTION: CON CÁI */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-[#e0dcd5] pb-2">
                                    <h3 className="flex items-center gap-2 font-bold text-[#4a3f35]">
                                        <IconBaby size={18} className="text-blue-600 fill-blue-600" /> Con cái
                                    </h3>
                                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{relationships.children.length}</span>
                                </div>

                                {relationships.children.length > 0 ? (
                                    relationships.children.map((child, idx) => (
                                        <div key={child._id} className="flex items-center justify-between p-3 bg-[#fffdf5] rounded-2xl border border-[#e0dcd5] shadow-sm hover:border-[#f1b400] transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-inner ${isMale(child.gender) ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'}`}>
                                                    {isMale(child.gender) ? '♂' : '♀'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-[#4a3f35] group-hover:text-[#8b1c1c] transition-colors">{child.name}</p>
                                                    <p className="text-[10px] text-gray-500">Con thứ {idx + 1} • {isMale(child.gender) ? 'Nam' : 'Nữ'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 text-center py-4 italic bg-gray-50 rounded-xl">Chưa có thông tin con cái</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer Actions if needed */}
                <div className="p-4 bg-[#f9f9e0] border-t border-[#d7ccc8] flex justify-end gap-2">
                     <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-black/5">Đóng</button>
                </div>
            </div>
        </div>
    );
};

export default MemberDetailModal;
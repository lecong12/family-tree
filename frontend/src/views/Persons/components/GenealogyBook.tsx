"use client";

import React, { useState, useMemo, useEffect } from 'react';
// Import các thư viện khác của bạn ở đây (ví dụ: PageFlip, các icon, ...)

interface GenealogyBookProps {
    persons: any[];
    spouses: any[];
    parentChilds: any[];
    isAdmin: boolean;
}

const GenealogyBook: React.FC<GenealogyBookProps> = ({ persons, spouses, parentChilds, isAdmin }) => {
    // 1. Khai báo các State (Đã có import useState)
    const [isBookLoaded, setIsBookLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [bookInstance, setBookInstance] = useState<any>(null);

    // 2. Logic xử lý dữ liệu với useMemo
    const pagesData = useMemo(() => {
        if (!persons || !Array.isArray(persons)) {
            console.warn("[Build Log]: Dữ liệu persons không hợp lệ.");
            return [];
        }

        console.log(`[Build Log]: Đang xử lý ${persons.length} thành viên.`);

        // Lọc ra những người là "Chủ hộ" (Nam giới thuộc dòng tộc)
        return persons
            .filter(m => {
                const isMale = m.gender === 'Nam';
                const isRoot = Number(m.id) === 1;
                const hasParent = !!m.parentId;
                return isMale && (hasParent || isRoot);
            })
            .map(member => {
                // Tự động xác định "Đời" (Generation)
                let gen = 1;
                let current = member;
                while (current && current.parentId) {
                    const parent = persons.find(p => p.id === current.parentId);
                    if (parent) {
                        gen++;
                        current = parent;
                    } else break;
                }

                // Tự động tạo 'desc' dựa trên quan hệ (Không hardcode)
                const father = persons.find(p => p.id === member.parentId);
                let relationshipDesc = `Đời thứ ${gen}`;
                if (father) {
                    relationshipDesc += ` - Con ông ${father.name}`;
                } else if (Number(member.id) === 1) {
                    relationshipDesc = "Thủy Tổ Dòng Họ";
                }

                return {
                    ...member,
                    generation: gen,
                    desc: relationshipDesc // Sử dụng mối quan hệ thực tế để điền mô tả
                };
            });
    }, [persons]);

    // 3. Các logic useEffect khác (nếu có)
    useEffect(() => {
        if (pagesData.length > 0) {
            setIsBookLoaded(true);
        }
    }, [pagesData]);

    // ... Phần JSX Render phía dưới
    return (
        <div className="genealogy-book-container">
            {/* Nội dung hiển thị của bạn */}
        </div>
    );
};

export default GenealogyBook;
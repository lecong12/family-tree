"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Person } from 'src/services/personService';
import { Spouse, SpouseWithDetails } from 'src/services/spouseService';

interface GenealogyBookProps {
    persons: Person[];
    spouses: (Spouse | SpouseWithDetails)[];
    parentChilds: any[];
    isAdmin: boolean;
}

const GenealogyBook: React.FC<GenealogyBookProps> = ({ persons, spouses, parentChilds, isAdmin }) => {
    const [isBookLoaded, setIsBookLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1); // Removed unused variable
    const [bookInstance, setBookInstance] = useState<any>(null);
    const bookContainer = useRef<HTMLDivElement>(null); // Added type annotation
    const [allMembers, setAllMembers] = useState<any[]>([]);

    useEffect(() => {
        const bookMembers = persons.map(p => ({ 
            id: (p as any)._id || (p as any).id, 
            full_name: p.name, 
            generation: (p as any).generation, 
            branch: (p as any).branch 
        }));
        setAllMembers(bookMembers);
    }, [persons]);

    // Sửa lỗi: Đã có import useMemo ở trên
    const pagesData = useMemo(() => {
        if (!persons) return [];
        return persons.filter(m => {
            // You're casting to any here. But it would be better to modify Person type to include `fid`, `mid`
            const mAny = m as any;
            const isBloodline = mAny.id === 1 || mAny.fid || mAny.mid;
            return isBloodline && m.gender === 'MALE';
        })
    }, [persons]);

    const generatePageContent = useCallback((father: Person) => {
        // Lưu ý: Đây là HTML string, dùng 'class' thay vì 'className'
        return `<div class="text-center" style="padding: 20px;">
                    <h3 style="color: #5d4037;">${father.name}</h3>
                    <p>Đời thứ: ${(father as any).generation || '...'}</p>
                </div>`;
    }, []); // useCallback should include all dependencies used inside it

    useEffect(() => {
        async function loadAndInitBook() {
            const loadScript = (src: string) => {
                return new Promise<void>((resolve, reject) => {
                    if (document.querySelector(`script[src="${src}"]`)) return resolve();
                    const script = document.createElement('script');
                    script.src = src;
                    script.onload = () => resolve();
                    script.onerror = () => reject();
                    document.head.appendChild(script);
                });
            };

            try {
                await loadScript('https://cdn.jsdelivr.net/npm/page-flip/dist/js/page-flip.browser.js');
                setIsBookLoaded(true);
            } catch (error) {
                console.error("Failed to load PageFlip", error);
            }
        }
        loadAndInitBook();
    }, []);

    useEffect(() => {
        if (isBookLoaded && bookContainer.current && pagesData.length > 0) {
            const initializeBook = () => {
                const isMobile = window.innerWidth < 768;
                const width = isMobile ? Math.min(window.innerWidth - 20, 400) : 450;
                const height = isMobile ? Math.min(window.innerHeight - 200, 600) : 650;

                const PageFlipClass = (window as any).St?.PageFlip;
                if (!PageFlipClass) return;

                const book = new PageFlipClass(bookContainer.current, {
                    width: width,
                    height: height,
                    size: isMobile ? "stretch" : "fixed",
                    showCover: true,
                    mobileScrollSupport: true
                });

                let pagesHTML = '';
                // TRANG BÌA
                pagesHTML += `
                    <div class="page" data-density="hard">
                        <div class="page-content cover-page" style="background: #5d4037; color: white; display: flex; align-items: center; justify-content: center; height: 100%;">
                            <div class="cover-border" style="border: 4px double #d7ccc8; padding: 40px; text-align: center; width: 80%;">
                                <h1 style="font-family: serif; font-size: 30pt;">GIA PHẢ<br/>HỌ LÊ CÔNG</h1>
                                <p style="font-size: 14pt; margin-top: 20px;">Thôn Linh An, Quảng Trị</p>
                            </div>
                        </div>
                    </div>
                `;

                // TRANG NỘI DUNG
                pagesData.forEach((member, index) => {
                    const content = generatePageContent(member);
                    pagesHTML += `
                        <div class="page">
                            <div class="page-content notebook-page" style="background: #fff8e1; height: 100%; border: 1px solid #ddd; padding: 20px;">
                                <div style="text-align: right; font-size: 10px;">Trang ${index + 1}</div>
                                ${content}
                            </div>
                        </div>
                    `;
                });

                book.loadFromHTML(pagesHTML);
                setBookInstance(book);
            };

            initializeBook();
        }
    }, [isBookLoaded, generatePageContent, pagesData]);

     return (
        <div className="py-4">
            <div className="book-controls" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                <button 
                    onClick={() => bookInstance?.flipPrev()}
                    className="px-4 py-2 bg-stone-700 text-white rounded"
                >
                    Trước
                </button>
                <span className="flex items-center font-bold">Trang {currentPage}</span>
                <button 
                    onClick={() => bookInstance?.flipNext()}
                    className="px-4 py-2 bg-stone-700 text-white rounded"
                >
                    Sau
                </button>
            </div>

            <div className="book-stage" style={{ display: 'flex', justifyContent: 'center' }}>
                <div id="my-book" ref={bookContainer}></div>
            </div>
        </div>
     );
};

export default GenealogyBook;
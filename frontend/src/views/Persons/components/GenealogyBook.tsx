'use client';

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
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [bookInstance, setBookInstance] = useState<any>(null); // Biến lưu instance của PageFlip
    const bookContainer = useRef<HTMLDivElement>(null);

    // Biến lưu trữ toàn bộ thành viên (để tìm kiếm)
    const [allMembers, setAllMembers] = useState<any[]>([]);

    useEffect(() => {
        // Khi dữ liệu persons thay đổi, cập nhật allMembers
        // Ép kiểu dữ liệu từ persons sang BookMember
        const bookMembers = persons.map(p => ({ id: (p as any)._id, full_name: p.name, generation: (p as any).generation, branch: (p as any).branch }));
        setAllMembers(bookMembers);
    }, [persons]);


    const pagesData = useMemo(() => {
        // Lọc ra những người là "Chủ hộ" (Thường là Nam giới thuộc dòng huyết thống)
        // Điều kiện: Là Nam VÀ (Có cha/mẹ HOẶC là Thủy tổ id=1)
        return persons.filter(m => {
            const isBloodline = (m as any).id === 1 || (m as any).fid || (m as any).mid;
            return isBloodline && m.gender === 'MALE';
        });
    }, [persons]);

    const generatePageContent = useCallback((father: Person) => {
        // Thay thế bằng logic tạo nội dung trang sách thực tế
        return `<div class="text-center">Content for ${father.name}</div>`;
    }, [allMembers]);

    useEffect(() => {
        async function loadAndInitBook() {
            //Load PageFlip library
            const loadScript = (src: string) => {
                return new Promise<void>((resolve, reject) => {
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
        if (isBookLoaded && bookContainer.current) {
            const initializeBook = () => {
                const isMobile = window.innerWidth < 768;
                const width = isMobile ? Math.min(window.innerWidth - 20, 400) : 450;
                const height = isMobile ? Math.min(window.innerHeight - 200, 600) : 650;

                const book = new (window as any).St.PageFlip(bookContainer.current, {
                    width: width,
                    height: height,
                    size: isMobile ? "stretch" : "fixed",
                    minWidth: 300,
                    maxWidth: 600,
                    minHeight: 400,
                    maxHeight: 800,
                    maxShadowOpacity: 0.5,
                    showCover: true,
                    mobileScrollSupport: true,
                    startPage: 0
                });

                let pagesHTML = '';
                // --- TRANG BÌA ---
                pagesHTML += `
                    <div class="page" data-density="hard">
                        <div class="page-content cover-page">
                            <div class="cover-border">
                                <h1 style="font-family: 'Times New Roman', serif; font-size: 40pt; margin-bottom: 30px; text-shadow: 1px 1px 2px #000;">GIA PHẢ<br/>HỌ LÊ CÔNG</h1>
                                <div style="width: 150px; height: 3px; background: #d7ccc8; margin: 30px auto;"></div>
                                <p style="font-size: 20pt; margin-top: 20px; font-family: 'Times New Roman', serif;">Thôn Linh An, Tỉnh Quảng Trị</p>
                                <p style="margin-top: auto; font-size: 16pt; font-family: 'Times New Roman', serif;">Năm ${new Date().getFullYear()}</p>
                            </div>
                        </div>
                    </div>
                `;

                // --- MẶT SAU CỦA BÌA (Trang lót - Trống) ---
                if (!isMobile) {
                    pagesHTML += `
                        <div class="page" data-density="hard">
                            <div class="page-content cover-page" style="background-color: #5d4037; border-left: 1px solid #3e2723;"></div>
                        </div>
                    `;
                }

                // --- CÁC TRANG NỘI DUNG ---
                pagesData.forEach((member, index) => {
                    const content = generatePageContent(member);
                    // 1. Trang nội dung (Mặt phải)
                    pagesHTML += `
                        <div class="page">
                            <div class="page-content notebook-page">
                                <div style="position:absolute; top:15px; right:20px; font-size:12px; color:#8d6e63; font-family:serif; font-style:italic;">Trang ${index + 1}/${pagesData.length}</div>
                                ${content}
                            </div>
                        </div>
                    `;

                    // 2. Trang trắng (Mặt trái - Mặt sau của tờ giấy)
                    if (!isMobile) {
                        pagesHTML += `
                            <div class="page">
                                <div class="page-content" style="background-color: #fff8e1; height: 100%; opacity: 0.6; box-shadow: inset -5px 0 20px rgba(0,0,0,0.05);">
                                    {/* Có thể thêm họa tiết mờ hoặc để trống hoàn toàn */}
                                </div>
                            </div>
                        `;
                    }
                });

                // --- TRANG BÌA SAU ---
                pagesHTML += `
                    <div class="page" data-density="hard">
                        <div class="page-content cover-page" style="background-color:#5d4037;"></div>
                    </div>
                `;

                book.loadFromHTML(pagesHTML);

                setBookInstance(book);
            };




            initializeBook();
        }
    }, [isBookLoaded, generatePageContent, pagesData]);

    return (
        <div>
            <div className="book-controls" style={{ textAlign: 'center', marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                 {/* Search Box for Book */}
                <div className="book-search-wrapper" style={{ position: 'relative', marginRight: '2px' }}>
                    <input type="text" id="book-search-input" placeholder="🔍 Tìm..." style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid #ccc', width: '110px', fontSize: '13px' }} />
                    <div id="book-search-results" className="search-results" style={{ textAlign: 'left', width: '250px', left: '50%', transform: 'translateX(-50%)' }}></div>
                </div>

                <button className="btn-control" id="btn-book-prev" title="Trang trước" style={{ width: '32px', height: '32px', padding: '0', minWidth: '32px', flex: '0 0 auto' }}><i className="fas fa-chevron-left"></i></button>

                 {/* Pagination Input (Phân trang) */}
                <div className="book-pagination" style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'white', padding: '2px 5px', borderRadius: '8px', border: '1px solid #ddd' }}>
                    <input type="number" id="book-page-input" min={1} style={{ width: '40px', textAlign: 'center', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', fontWeight: 'bold' }} />
                    <span id="book-total-pages" style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>/..</span>
                    <button className="btn-control" id="btn-book-goto" style={{ padding: '4px 8px', minWidth: 'auto', height: '28px' }} title="Đi đến trang"><i className="fas fa-level-down-alt" style={{ transform: 'rotate(90deg)' }}></i></button>
                </div>

                <button className="btn-control" id="btn-book-next" title="Trang sau" style={{ width: '32px', height: '32px', padding: '0', minWidth: '32px', flex: '0 0 auto' }}><i className="fas fa-chevron-right"></i></button>
                {isAdmin &&
                    <button className="btn-control" id="btn-book-print" style={{ width: '32px', height: '32px', padding: '0', minWidth: '32px', flex: '0 0 auto', color: '#c0392b' }} title="In Sổ (PDF)"><i className="fas fa-print"></i></button>
                }
            </div>

            <div className="book-stage" id="so-gia-pha-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                <div id="my-book" ref={bookContainer}>
                     {/* Pages will be injected here */}
                </div>
            </div>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '10px' }}>
                <i className="fas fa-hand-pointer"></i> Vuốt hoặc kéo góc giấy để lật trang
            </p>
        </div>
 );
};

export default GenealogyBook;
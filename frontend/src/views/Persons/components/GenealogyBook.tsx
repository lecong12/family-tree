'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Person } from 'src/services/personService';
import { Spouse, SpouseWithDetails } from 'src/services/spouseService';
import styles from './GenealogyBook.module.css'; // Import styles


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
                    <div class="${styles.page}" data-density="hard">
                        <div class="${styles.pageContent} ${styles.coverPage}">
                            <div class="${styles.coverBorder}">
                                <h1 class="${styles.coverTitle}">GIA PHẢ<br/>HỌ LÊ CÔNG</h1>
                                <div class="${styles.coverDivider}"></div>
                                <p class="${styles.coverText}">Thôn Linh An, Tỉnh Quảng Trị</p>
                                <p class="${styles.coverYear}">Năm ${new Date().getFullYear()}</p>
                            </div>
                        </div>
                    </div>
                `;

                // --- MẶT SAU CỦA BÌA (Trang lót - Trống) ---
                if (!isMobile) {
                    pagesHTML += `
                        <div class="${styles.page}" data-density="hard">
                            <div class="${styles.pageContent} ${styles.coverPage}" style="border-left: 1px solid #3e2723;"></div>
                        </div>
                    `;
                }

                // --- CÁC TRANG NỘI DUNG ---
                pagesData.forEach((member, index) => {
                    const content = generatePageContent(member);
                    // 1. Trang nội dung (Mặt phải)
                    pagesHTML += `
                        <div class="${styles.page}">
                            <div class="${styles.pageContent} ${styles.notebookPage}">
                                <div class="${styles.pageNumber}">Trang ${index + 1}/${pagesData.length}</div>
                                ${content}
                            </div>
                        </div>
                    `;

                    // 2. Trang trắng (Mặt trái - Mặt sau của tờ giấy)
                    if (!isMobile) {
                        pagesHTML += `
                            <div class="${styles.page}">
                                <div class="${styles.pageContent} ${styles.emptyBackPage}">
                                <!-- Có thể thêm họa tiết mờ hoặc để trống hoàn toàn -->
                                </div>
                            </div>
                        `;
                    }
                });

                // --- TRANG BÌA SAU ---
                pagesHTML += `
                    <div class="${styles.page}" data-density="hard">
                        <div class="${styles.pageContent} ${styles.coverPage}"></div>
                    </div>
                `;

                // Chuyển đổi chuỗi HTML thành NodeList vì loadFromHTML yêu cầu Node, không phải string
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = pagesHTML;
                book.loadFromHTML(tempDiv.querySelectorAll(`.${styles.page}`));

                setBookInstance(book);
            };




            initializeBook();
        }
    }, [isBookLoaded, generatePageContent, pagesData]);

    return (
        <div className={styles.container} id="book-tab">
            <div className={styles.controls}>
                 {/* Search Box for Book */}
                <div className={styles.searchWrapper}>
                    <input type="text" className={styles.searchInput} id="book-search-input" placeholder="🔍 Tìm..." />
                    <div id="book-search-results" className="search-results" style={{ position: 'absolute', textAlign: 'left', width: '250px', left: '50%', transform: 'translateX(-50%)' }}></div>
                </div>

                <button className={styles.btnControl} id="btn-book-prev" title="Trang trước"><i className="fas fa-chevron-left"></i></button>

                 {/* Pagination Input (Phân trang) */}
                <div className={styles.pagination}>
                    <input type="number" className={styles.pageInput} id="book-page-input" min={1} />
                    <span id="book-total-pages" style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>/..</span>
                    <button className={styles.btnControl} id="btn-book-goto" style={{ width: 'auto', padding: '0 8px', height: '28px', minWidth: 'auto' }} title="Đi đến trang"><i className="fas fa-level-down-alt" style={{ transform: 'rotate(90deg)' }}></i></button>
                </div>

                <button className={styles.btnControl} id="btn-book-next" title="Trang sau"><i className="fas fa-chevron-right"></i></button>
                {isAdmin &&
                    <button className={styles.btnControl} id="btn-book-print" style={{ color: '#c0392b' }} title="In Sổ (PDF)"><i className="fas fa-print"></i></button>
                }
            </div>

            <div className={styles.stage} id="so-gia-pha-content">
                <div id="my-book" ref={bookContainer}>
                     {/* Pages will be injected here */}
                </div>
            </div>
            <p className={styles.helperText}>
                <i className="fas fa-hand-pointer"></i> Vuốt hoặc kéo góc giấy để lật trang
            </p>
        </div>
 );
};

export default GenealogyBook;
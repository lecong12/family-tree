'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Person } from 'src/services/personService';
import { Spouse, SpouseWithDetails } from 'src/services/spouseService';
import styles from './GenealogyBook.module.css'; // Import styles
import { isMale } from 'src/utils/genderUtils'; // Giả sử bạn có utils này, nếu không thì dùng logic check 0/1


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
        // 1. Lọc ra Nam giới để làm chủ trang (theo truyền thống Gia phả)
        // Bạn có thể bỏ filter này nếu muốn in cả Nữ giới ra trang riêng
        const males = persons.filter(p => {
            // Kiểm tra giới tính: 0 hoặc 'MALE' là Nam
            return p.gender === 0 || p.gender === 'MALE' || (p as any).gender === '0';
        });

        // 2. Sắp xếp: Đời (Tăng dần) -> Phái (Tăng dần) -> Con thứ (Tăng dần)
        return males.sort((a, b) => {
            const genA = (a as any).generation || 999;
            const genB = (b as any).generation || 999;
            if (genA !== genB) return genA - genB;

            const branchA = (a as any).branch || '0';
            const branchB = (b as any).branch || '0';
            const branchComp = String(branchA).localeCompare(String(branchB), undefined, { numeric: true });
            if (branchComp !== 0) return branchComp;

            const orderA = (a as any).order || 999;
            const orderB = (b as any).order || 999;
            return orderA - orderB;
        });
    }, [persons]);

    const generatePageContent = useCallback((person: Person) => {
        const pId = person._id;
        const formatDate = (d: any) => d ? new Date(d).getFullYear() : '...';
        const birth = formatDate(person.birth);
        const death = person.isDead ? formatDate(person.death) : 'Nay';
        
        // --- TÌM VỢ VÀ CON ---
        // 1. Tìm các Spouse record mà người này là chồng
        const mySpouses = spouses.filter(s => {
            const hId = typeof s.husband === 'string' ? s.husband : (s.husband as any)?._id;
            return hId === pId;
        });

        // 2. Tạo HTML cho phần Vợ & Con
        let familyHtml = '';
        if (mySpouses.length > 0) {
            mySpouses.forEach((s, idx) => {
                // Lấy thông tin Vợ
                const wifeId = typeof s.wife === 'string' ? s.wife : (s.wife as any)?._id;
                const wife = persons.find(p => p._id === wifeId);
                const wifeName = wife ? wife.name : 'Không rõ';
                
                // Tìm con chung của cặp vợ chồng này
                const children = parentChilds.filter(pc => {
                    const parentId = typeof pc.parent === 'string' ? pc.parent : (pc.parent as any)?._id;
                    return parentId === s._id; // ParentID trong bảng ParentChild chính là SpouseID
                }).map(pc => {
                    const cId = typeof pc.child === 'string' ? pc.child : (pc.child as any)?._id;
                    return persons.find(p => p._id === cId);
                }).filter(Boolean).sort((a, b) => ((a as any).order || 0) - ((b as any).order || 0));

                const childrenListHtml = children.length > 0 
                    ? `<ul style="margin: 5px 0 10px 20px; padding: 0; list-style-type: circle;">
                        ${children.map(c => `<li>${c!.name} (${formatDate(c!.birth)})</li>`).join('')}
                       </ul>`
                    : '<p style="margin-left: 20px; font-style: italic; font-size: 14px;">(Chưa cập nhật con)</p>';

                familyHtml += `
                    <div style="margin-bottom: 15px;">
                        <div style="font-weight: bold; color: #4e342e;">★ Vợ ${idx + 1}: ${wifeName}</div>
                        ${childrenListHtml}
                    </div>
                `;
            });
        } else {
            familyHtml = '<p>Chưa có thông tin vợ con.</p>';
        }

        return `
            <h2 style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; color: #3e2723;">${person.name}</h2>
            <p style="text-align: center; font-style: italic; margin-bottom: 25px;">(${birth} - ${death})</p>
            
            <div style="font-size: 16px; line-height: 1.6; text-align: justify;">
                <p><strong>• Đời thứ:</strong> ${(person as any).generation || 1}</p>
                <p><strong>• Con thứ:</strong> ${(person as any).order || 1}</p>
                <p><strong>• Thụy hiệu/Tên tự:</strong> ${(person as any).nickname || '...'}</p>
                
                <div style="margin-top: 20px;">
                    <h3 style="font-size: 18px; font-weight: bold; border-bottom: 1px solid #8d6e63; padding-bottom: 5px; margin-bottom: 10px; color: #5d4037;">Tiểu sử</h3>
                    <p>${person.desc || 'Chưa có thông tin tiểu sử chi tiết.'}</p>
                </div>
                
                <div style="margin-top: 20px;">
                    <h3 style="font-size: 18px; font-weight: bold; border-bottom: 1px solid #8d6e63; padding-bottom: 5px; margin-bottom: 10px; color: #5d4037;">Gia đình</h3>
                    ${familyHtml}
                </div>
            </div>
        `;
    }, [persons, spouses, parentChilds]);

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
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
    const [totalPages, setTotalPages] = useState(0);
    const [isMobileView, setIsMobileView] = useState(false);
    const [searchResults, setSearchResults] = useState<{ name: string; pageIndex: number; generation: number }[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    
    const bookContainer = useRef<HTMLDivElement>(null);
    const pageInputRef = useRef<HTMLInputElement>(null);

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

    const generatePageContent = useCallback((person: Person, css: any = styles) => {
        const pId = person._id;
        const formatDate = (d: any) => d ? new Date(d).getFullYear() : '';
        const birth = formatDate(person.birth);
        const death = person.isDead ? (formatDate(person.death) || '...') : 'Nay';
        const lifeStr = birth ? `(${birth} - ${death})` : '';
        
        // --- TÌM VỢ VÀ CON ---
        const mySpouses = spouses.filter(s => {
            const hId = typeof s.husband === 'string' ? s.husband : (s.husband as any)?._id;
            return hId === pId;
        });

        // Tạo thông tin Vợ (Mẹ của các con)
        let motherInfoHtml = '';
        if (mySpouses.length > 0) {
            const wives = mySpouses.map(s => {
                const wId = typeof s.wife === 'string' ? s.wife : (s.wife as any)?._id;
                return persons.find(p => p._id === wId);
            }).filter(Boolean);
            
            motherInfoHtml = wives.map(w => `Bà <strong>${w?.name}</strong>`).join(', ');
            if (motherInfoHtml) motherInfoHtml = `Sánh duyên cùng: ${motherInfoHtml}`;
        } else {
            motherInfoHtml = '(Chưa cập nhật thông tin vợ)';
        }

        // Tìm tất cả con (gộp từ các đời vợ)
        let allChildren: Person[] = [];
        mySpouses.forEach(s => {
            const children = parentChilds.filter(pc => {
                const parentId = typeof pc.parent === 'string' ? pc.parent : (pc.parent as any)?._id;
                return parentId === s._id;
            }).map(pc => {
                const cId = typeof pc.child === 'string' ? pc.child : (pc.child as any)?._id;
                return persons.find(p => p._id === cId);
            }).filter(Boolean) as Person[];
            allChildren = [...allChildren, ...children];
        });
        // Sắp xếp con theo thứ tự
        allChildren.sort((a, b) => ((a as any).order || 0) - ((b as any).order || 0));

        // Tạo HTML danh sách con
        const childrenHtml = allChildren.length > 0 
            ? allChildren.map((c, idx) => {
                const cBirth = formatDate(c.birth);
                const cDeath = c.isDead ? (formatDate(c.death) || '...') : '...';
                const cLife = cBirth ? `(${cBirth} - ${cDeath})` : '';
                return `
                <div class="${css.childLine}">
                    <span class="${css.orderNo}">${idx + 1}.</span>
                    <span class="${css.childName}">${c.name}</span>
                    <span class="${css.lifeDates}">${cLife}</span>
                </div>`;
            }).join('')
            : `<div class="${css.childLine}" style="font-style:italic; opacity:0.7;">(Chưa có thông tin con cái)</div>`;

        return `
            <div class="${css.pageHeader}">
                <div class="${css.generationTitle}">
                    Đời thứ <span class="${css.generationNumber}">${(person as any).generation || 1}</span>
                    ${(person as any).branch ? `<span class="${css.branchName}">Phái ${(person as any).branch}</span>` : ''}
                </div>
                <div class="${css.mainCouple}">
                    <div class="${css.fatherName}">${person.name}</div>
                    <div class="${css.lifeDates}" style="display:block; margin-top:-5px; margin-bottom:5px;">${lifeStr}</div>
                    <div class="${css.motherInfo}">${motherInfoHtml}</div>
                </div>
            </div>
            
            <div class="${css.pageContentBody}">
                <div class="${css.sinhHaTitle}">Sinh hạ</div>
                <div class="${css.childrenGrid}">
                    ${childrenHtml}
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
        let activeBook: any = null;

        // Kiểm tra St.PageFlip có tồn tại không trước khi chạy
        const PageFlip = (window as any).St?.PageFlip;

        if (isBookLoaded && bookContainer.current && PageFlip) {
            const initializeBook = () => {
                // QUAN TRỌNG: Xóa nội dung cũ trong container trước khi tạo sách mới
                if (bookContainer.current) {
                    bookContainer.current.innerHTML = '';
                }

                const isMobile = window.innerWidth < 768;
                setIsMobileView(isMobile); // Lưu lại chế độ view để dùng cho logic tính trang
                const width = isMobile ? Math.min(window.innerWidth - 20, 400) : 450;
                const height = isMobile ? Math.min(window.innerHeight - 200, 600) : 650;

                const book = new PageFlip(bookContainer.current, {
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
                    <div class="${styles.page} ${styles.pageRight} page-element" data-density="hard">
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
                        <div class="${styles.page} ${styles.pageLeft} page-element" data-density="hard">
                            <div class="${styles.pageContent} ${styles.coverPage}" style="border-left: 1px solid #3e2723;"></div>
                        </div>
                    `;
                }

                // --- CÁC TRANG NỘI DUNG ---
                pagesData.forEach((member, index) => {
                    const content = generatePageContent(member);
                    // 1. Trang nội dung (Luôn nằm bên Phải - Recto)
                    pagesHTML += `
                        <div class="${styles.page} ${styles.pageRight} page-element">
                            <div class="${styles.pageContent} ${styles.notebookPage}">
                                <div class="${styles.pageNumber}">Trang ${index + 1}/${pagesData.length}</div>
                                ${content}
                            </div>
                        </div>
                    `;

                    // 2. Trang trắng (Mặt trái - Verso - Mặt sau của tờ giấy)
                    if (!isMobile) {
                        pagesHTML += `
                            <div class="${styles.page} ${styles.pageLeft} page-element">
                                <div class="${styles.pageContent} ${styles.emptyBackPage}">
                                <!-- Có thể thêm họa tiết mờ hoặc để trống hoàn toàn -->
                                </div>
                            </div>
                        `;
                    }
                });

                // --- TRANG BÌA SAU ---
                pagesHTML += `
                    <div class="${styles.page} ${styles.pageLeft} page-element" data-density="hard">
                        <div class="${styles.pageContent} ${styles.coverPage}"></div>
                    </div>
                `;

                // Chuyển đổi chuỗi HTML thành NodeList vì loadFromHTML yêu cầu Node, không phải string
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = pagesHTML;
                // Sửa: Dùng class tĩnh 'page-element' để query chắc chắn tìm thấy
                book.loadFromHTML(tempDiv.querySelectorAll('.page-element'));

                // Cập nhật tổng số trang sau khi load
                setTotalPages(book.getPageCount());

                // Sự kiện lật trang: Âm thanh + Cập nhật state trang hiện tại
                book.on('flip', (e: any) => {
                    // Đảm bảo bạn đã có file này trong thư mục public/sounds/
                    const audio = new Audio('/sounds/page-flip.mp3');
                    audio.volume = 0.4; // Điều chỉnh âm lượng vừa phải
                    audio.play().catch(() => {}); // Bỏ qua lỗi nếu trình duyệt chưa cho phép autoplay
                    
                    setCurrentPage(e.data + 1); // e.data là index 0-based
                });

                setBookInstance(book);
                activeBook = book;
            };

            initializeBook();
        }

        // Cleanup function: Hủy instance khi component unmount hoặc re-render
        return () => {
            if (activeBook) {
                activeBook.destroy();
            }
        };
    }, [isBookLoaded, generatePageContent, pagesData]);

    // --- HANDLERS CHO CÁC NÚT ĐIỀU KHIỂN ---
    const handlePrevPage = () => bookInstance?.flipPrev();
    
    const handleNextPage = () => bookInstance?.flipNext();
    
    const handleGotoPage = () => {
        if (!bookInstance || !pageInputRef.current) return;
        const pageNum = parseInt(pageInputRef.current.value);
        if (pageNum >= 1 && pageNum <= totalPages) {
            bookInstance.flip(pageNum - 1); // PageFlip dùng index 0
        }
    };

    // --- LOGIC TÌM KIẾM ---
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        setShowSearchResults(!!term);

        if (!term.trim()) {
            setSearchResults([]);
            return;
        }

        // Lọc trong pagesData
        const results = pagesData
            .map((p, index) => ({
                name: p.name,
                generation: (p as any).generation,
                // Tính toán vị trí trang trong sách:
                // Mobile: 1 trang bìa + index
                // Desktop: 2 trang (Bìa + Lót) + (index * 2) (vì mỗi người 2 trang: nội dung + mặt sau)
                pageIndex: isMobileView ? (1 + index) : (2 + index * 2)
            }))
            .filter(item => item.name.toLowerCase().includes(term.toLowerCase()))
            .slice(0, 5); // Lấy tối đa 5 kết quả

        setSearchResults(results);
    };

    const handleSelectResult = (pageIndex: number) => {
        bookInstance?.flip(pageIndex);
        setShowSearchResults(false);
        setSearchTerm('');
    };

    // --- LOGIC IN ẤN ---
    const handlePrintBook = () => {
        // 1. Định nghĩa map CSS class cho bản in (không dùng hash của module)
        const printCss = {
            pageHeader: 'page-header',
            generationTitle: 'generation-title',
            generationNumber: 'generation-number',
            branchName: 'branch-name',
            mainCouple: 'main-couple',
            fatherName: 'father-name',
            lifeDates: 'life-dates',
            motherInfo: 'mother-info',
            pageContentBody: 'page-content-body',
            sinhHaTitle: 'sinh-ha-title',
            childrenGrid: 'children-grid',
            childLine: 'child-line',
            orderNo: 'order-no',
            childName: 'child-name',
        };

        // 2. Tạo nội dung HTML cho từng trang
        const printContent = pagesData.map((member, index) => {
            const content = generatePageContent(member, printCss);
            return `
                <div class="print-page">
                    <div class="page-number">Trang ${index + 1}</div>
                    ${content}
                </div>
            `;
        }).join('');

        // 3. Tạo trang Bìa
        const coverPage = `
            <div class="cover-page">
                <div class="cover-border">
                    <h1 class="cover-title">GIA PHẢ<br/>HỌ LÊ CÔNG</h1>
                    <div class="cover-divider"></div>
                    <p class="cover-text">Thôn Linh An, Tỉnh Quảng Trị</p>
                    <p class="cover-year">Năm ${new Date().getFullYear()}</p>
                </div>
            </div>
        `;

        // 4. Mở cửa sổ in
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>In Sổ Gia Phả</title>
                    <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap" rel="stylesheet">
                    <link href="https://fonts.googleapis.com/css2?family=Times+New+Roman:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        @page { size: A4; margin: 0; }
                        body { margin: 0; padding: 0; background-color: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        
                        /* Cover Page Styles */
                        .cover-page { width: 210mm; height: 297mm; page-break-after: always; background-color: #5d4037; color: #d7ccc8; display: flex; justify-content: center; align-items: center; padding: 20mm; box-sizing: border-box; }
                        .cover-border { border: 5px double #d7ccc8; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
                        .cover-title { font-family: 'Times New Roman', serif; font-size: 40pt; margin-bottom: 30px; font-weight: bold; }
                        .cover-divider { width: 150px; height: 3px; background: #d7ccc8; margin: 30px auto; }
                        .cover-text { font-size: 20pt; margin-top: 20px; font-family: 'Times New Roman', serif; }
                        .cover-year { margin-top: auto; font-size: 16pt; font-family: 'Times New Roman', serif; }

                        /* Content Page Styles */
                        .print-page { width: 210mm; height: 297mm; page-break-after: always; position: relative; background-color: #f4ecd8; background-image: linear-gradient(90deg, rgba(139, 69, 19, 0.1) 1px, transparent 1px), linear-gradient(rgba(139, 69, 19, 0.1) 1px, transparent 1px); background-size: 25px 25px; padding: 25mm 20mm; box-sizing: border-box; font-family: 'Dancing Script', cursive; color: #4b3621; }
                        .page-header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid rgba(93, 64, 55, 0.3); padding-bottom: 15px; }
                        .generation-title { color: #b71c1c; font-size: 24pt; font-weight: 700; margin-bottom: 5px; }
                        .generation-number { font-family: 'Times New Roman', serif; font-size: 24pt; }
                        .branch-name { display: block; font-size: 14pt; color: #e65100; font-weight: bold; margin-top: 5px; }
                        .main-couple { margin-top: 15px; }
                        .father-name { font-size: 26pt; font-weight: 700; border-bottom: 2px solid #b71c1c; display: inline-block; margin-bottom: 5px; }
                        .life-dates { display: block; font-size: 12pt; color: #5d4037; margin-bottom: 5px; font-family: 'Times New Roman', serif; }
                        .mother-info { font-size: 16pt; color: #3e2723; margin-top: 5px; }
                        .page-content-body { margin-top: 30px; }
                        .sinh-ha-title { text-align: center; font-size: 20pt; font-weight: bold; text-decoration: underline; margin-bottom: 15px; color: #3e2723; }
                        .children-grid { padding-left: 10px; }
                        .child-line { font-size: 15pt; line-height: 25px; display: flex; align-items: baseline; margin-bottom: 5px; }
                        .order-no { font-family: 'Times New Roman', serif; font-weight: bold; margin-right: 10px; width: 25px; text-align: right; }
                        .child-name { font-weight: 600; }
                        .page-number { position: absolute; bottom: 15mm; right: 15mm; font-family: 'Times New Roman', serif; font-size: 11pt; color: #5d4037; }
                    </style>
                </head>
                <body>${coverPage}${printContent}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 1000);
        }
    };

    return (
        <div className={styles.container} id="book-tab">
            <div className={styles.controls}>
                 {/* Search Box for Book */}
                <div className={styles.searchWrapper}>
                    <input 
                        type="text" 
                        className={styles.searchInput} 
                        placeholder="🔍 Tìm tên..." 
                        value={searchTerm}
                        onChange={handleSearch}
                        onFocus={() => setShowSearchResults(!!searchTerm)}
                    />
                    
                    {/* Dropdown kết quả tìm kiếm */}
                    {showSearchResults && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto transform -translate-x-1/4">
                            {searchResults.map((res, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => handleSelectResult(res.pageIndex)}
                                    className="px-4 py-2 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-0 text-left"
                                >
                                    <div className="font-bold text-gray-800 text-sm">{res.name}</div>
                                    <div className="text-xs text-gray-500">Đời {res.generation} • Trang {res.pageIndex + 1}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {showSearchResults && searchTerm && searchResults.length === 0 && (
                        <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2 text-center text-xs text-gray-500">
                            Không tìm thấy
                        </div>
                    )}
                </div>

                <button className={styles.btnControl} onClick={handlePrevPage} title="Trang trước">
                    <i className="fas fa-chevron-left"></i>
                </button>

                 {/* Pagination Input (Phân trang) */}
                <div className={styles.pagination}>
                    <input 
                        ref={pageInputRef}
                        type="number" 
                        className={styles.pageInput} 
                        min={1} 
                        max={totalPages}
                        defaultValue={1}
                        placeholder={currentPage.toString()}
                        onKeyDown={(e) => e.key === 'Enter' && handleGotoPage()}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>/{totalPages}</span>
                    <button 
                        className={styles.btnControl} 
                        onClick={handleGotoPage}
                        style={{ width: 'auto', padding: '0 8px', height: '28px', minWidth: 'auto' }} 
                        title="Đi đến trang"
                    >
                        <i className="fas fa-level-down-alt" style={{ transform: 'rotate(90deg)' }}></i>
                    </button>
                </div>

                <button className={styles.btnControl} onClick={handleNextPage} title="Trang sau">
                    <i className="fas fa-chevron-right"></i>
                </button>
                
                {isAdmin &&
                    <button 
                        className={styles.btnControl} 
                        style={{ color: '#c0392b' }} 
                        title="In Sổ (PDF)"
                        onClick={handlePrintBook}
                    >
                        <i className="fas fa-print"></i>
                    </button>
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
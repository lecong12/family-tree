import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { join } from 'path';
import { PersonService } from './modules/person/person.service';
import { SpouseService } from './modules/spouse/spouse.service';
import { ParentChildService } from './modules/parent-child/parent-child.service';
import { Gender } from './constants';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);

    // Lấy Services để dùng cho seeding dữ liệu mẫu (an toàn hơn)
    const personService = app.get(PersonService);
    const spouseService = app.get(SpouseService);
    const parentChildService = app.get(ParentChildService);

    // Lấy trực tiếp Model để ghi đè mọi quy tắc của Service
    const personModel = app.get<Model<any>>(getModelToken('Person'));
    const spouseModel = app.get<Model<any>>(getModelToken('Spouse'));
    const parentChildModel = app.get<Model<any>>(getModelToken('ParentChild'));

    const filePath = join(process.cwd(), 'Banchuan.csv');

    console.log('--------------------------------------------------');
    console.log('🧹 BƯỚC 1: XÓA SẠCH DỮ LIỆU CŨ...');
    await personModel.deleteMany({});
    await spouseModel.deleteMany({});
    await parentChildModel.deleteMany({});

    let useHardcoded = false;

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Không tìm thấy file CSV tại ${filePath}.`);
        console.log('⚠️ Chuyển sang chế độ NẠP DỮ LIỆU MẪU (Hardcoded)...');
        useHardcoded = true;
    } else {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const records: any[] = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true, bom: true });

            if (records.length === 0) {
                console.log('⚠️ File CSV rỗng. Chuyển sang nạp dữ liệu mẫu...');
                useHardcoded = true;
            } else {
                const personMap = new Map(); 
                const spouseMap = new Map(); 

                // Pre-scan to build relationship maps for description generation
                const personInfoMap = new Map<string, { name: string, fid: string, mid: string }>();
                const childrenOfParentMap = new Map<string, Array<{ name: string, order: number }>>();

                for (const row of records) {
                    const id = String(row.id).trim();
                    if (!id) continue;

                    const name = row.full_name || row.name || "Không tên";
                    const fid = String(row.fid).trim();
                    const mid = String(row.mid).trim();
                    const order = parseInt(row.order) || 999;

                    personInfoMap.set(id, { name, fid, mid });

                    const childEntry = { name, order };

                    // We map children to their father's ID (fid)
                    if (fid && fid !== '0') {
                        if (!childrenOfParentMap.has(fid)) childrenOfParentMap.set(fid, []);
                        childrenOfParentMap.get(fid)!.push(childEntry);
                    }
                    // We also map children to their mother's ID (mid)
                    if (mid && mid !== '0') {
                        if (!childrenOfParentMap.has(mid)) childrenOfParentMap.set(mid, []);
                        childrenOfParentMap.get(mid)!.push(childEntry);
                    }
                }

                console.log(`🚀 BƯỚC 2: NẠP ${records.length} NHÂN VẬT TỪ CSV...`);
                for (const row of records) {
                    const id = String(row.id).trim();
                    if (!id) continue;

                    const gen = parseInt(row.generation) || 1;
                    const genderRaw = String(row.gender).trim().toLowerCase();
                    const isMale = (genderRaw === 'nam' || genderRaw === '0' || genderRaw === 'male');

                    // Avatar logic: Prioritize 'image' from CSV, then fallback to default.
                    const avatarUrl = (row.image && row.image.trim() !== '')
                        ? row.image.trim()
                        : (isMale 
                            ? 'https://www.cartoonize.net/wp-content/uploads/2024/05/avatar-maker-photo-to-cartoon.png'
                            : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3rzFZs0tioVeqNH0BKGWxnzfGNevCLpvoXN-vWtjvsjUl5gjNW6lXGyuD7AwJltJgoKk&usqp=CAU');

                    // Birth date logic: Prioritize 'birth_date' from CSV, then fallback to generated date.
                    const birthDate = row.birth_date && new Date(row.birth_date).toString() !== 'Invalid Date'
                        ? new Date(row.birth_date)
                        : new Date(1800 + (gen * 25), 0, 1);
                    
                    // Death date logic from CSV
                    const deathDate = row.death_date && new Date(row.death_date).toString() !== 'Invalid Date'
                        ? new Date(row.death_date)
                        : null;

                    // isDead logic: based on CSV 'is_live' or if death date is in the past.
                    const isDead = row.is_live === '0' || (deathDate !== null && deathDate <= new Date());

                    // Description logic: Prioritize CSV 'desc', then generate, then fallback to 'note' or simple text.
                    // let finalDesc = row.desc?.trim(); // Tạm bỏ qua trường desc từ CSV theo yêu cầu để tránh lỗi
                    let finalDesc = null;

                    if (!finalDesc) {
                        const descParts: string[] = [];

                        // Parent Info
                        const fid = String(row.fid).trim();
                        const mid = String(row.mid).trim();
                        const fatherInfo = personInfoMap.get(fid);
                        const motherInfo = personInfoMap.get(mid);

                        if (fatherInfo && motherInfo) {
                            descParts.push(`Là con của ông ${fatherInfo.name} và bà ${motherInfo.name}.`);
                        } else if (fatherInfo) {
                            descParts.push(`Là con của ông ${fatherInfo.name}.`);
                        }

                        // Children Info
                        const childrenList = childrenOfParentMap.get(id);
                        if (childrenList && childrenList.length > 0) {
                            // Sort by order
                            childrenList.sort((a, b) => a.order - b.order);
                            
                            const childrenString = childrenList.map((c, i) => `${i + 1}. ${c.name}`).join('; ');
                            descParts.push(`Sinh hạ ${childrenList.length} người con là: ${childrenString}.`);
                        }
                        finalDesc = descParts.join(' ');
                    }

                    // Tạo trực tiếp bằng Model để lách lỗi 409
                    const pId = new Types.ObjectId();
                    await personModel.create({
                        _id: pId,
                        cccd: id.padStart(10, '0'),
                        name: row.full_name || row.name || "Không tên",
                        gender: isMale ? 0 : 1,
                        birth: birthDate,
                        death: deathDate,
                        avatar: avatarUrl,
                        isDead: isDead,
                        address: row.address || "",
                        desc: finalDesc || row.note || (isMale ? `Thế hệ thứ ${gen}` : `Thành viên nữ`),
                        phone: row.phone || "",
                        job: row.job || "",
                        generation: gen,
                        branch: row.branch || "0",
                        order: parseInt(row.order) || 1,
                    });
                    personMap.set(id, { _id: pId, name: row.full_name });
                }

                console.log('💍 BƯỚC 3: THIẾT LẬP VỢ CHỒNG (GHI ĐÈ TRỰC TIẾP DB)...');
                const husbandWifeCount = new Map<string, number>(); // Đếm số vợ của một người chồng
                const wifeHusbandCount = new Map<string, number>(); // Đếm số chồng của một người vợ

                for (const row of records) {
                    const husbandId = String(row.pid).trim();
                    const wifeId = String(row.id).trim();
                    const genderRaw = String(row.gender).trim().toLowerCase();
                    const isFemale = (genderRaw === 'nữ' || genderRaw === '1' || genderRaw === 'female');

                    if (husbandId && husbandId !== '0' && isFemale) {
                        // Kiểm tra trùng lặp để tránh tạo 2 quan hệ vợ chồng cho cùng 1 cặp
                        if (spouseMap.has(`${husbandId}_${wifeId}`)) {
                            continue;
                        }

                        const husband = personMap.get(husbandId);
                        const wife = personMap.get(wifeId);

                        if (husband && wife) {
                            const wifeOrder = (husbandWifeCount.get(husbandId) || 0) + 1;
                            const husbandOrder = (wifeHusbandCount.get(wifeId) || 0) + 1;

                            // Ghi trực tiếp vào Model - Không thông qua Service để tránh lỗi Conflict 409
                            const spouse = await spouseModel.create({
                                husband: husband._id,
                                wife: wife._id,
                                husbandOrder: husbandOrder,
                                wifeOrder: wifeOrder,
                            });
                            spouseMap.set(`${husbandId}_${wifeId}`, spouse);
                            husbandWifeCount.set(husbandId, wifeOrder);
                            wifeHusbandCount.set(wifeId, husbandOrder);
                        }
                    }
                }

                console.log('🌳 BƯỚC 4: KẾT NỐI CON CÁI...');
                let connectCount = 0;
                for (const row of records) {
                    const fid = String(row.fid).trim();
                    const mid = String(row.mid).trim();
                    const childId = String(row.id).trim();

                    if (fid && fid !== '0') {
                        let parentSpouse = spouseMap.get(`${fid}_${mid}`);
                        if (!parentSpouse) {
                            const firstWifeKey = Array.from(spouseMap.keys()).find(k => k.startsWith(`${fid}_`));
                            if (firstWifeKey) parentSpouse = spouseMap.get(firstWifeKey);
                        }

                        const child = personMap.get(childId);
                        if (parentSpouse && child) {
                            await parentChildModel.create({
                                parent: parentSpouse._id,
                                child: child._id,
                                isAdopted: false,
                            });
                            connectCount++;
                        }
                    }
                }

                console.log('--------------------------------------------------');
                console.log(`✅ THÀNH CÔNG RỰC RỠ! ĐÃ NỐI ${connectCount} CON CÁI TỪ CSV.`);
                console.log('--------------------------------------------------');
            }
        } catch (error) {
            console.error('❌ Lỗi khi đọc CSV:', error.message);
            console.log('⚠️ Chuyển sang chế độ NẠP DỮ LIỆU MẪU (Hardcoded)...');
            useHardcoded = true;
        }
    }

    if (useHardcoded) {
        try {
            console.log('🌱 Đang nạp dữ liệu mẫu (Gia phả Lê Đình)...');
            
            // Generation 1 (Ông bà)
            const ongA = await personService.create({
                cccd: '1234567890',
                name: 'Lê Đình A',
                gender: Gender.MALE,
                birth: new Date('1900-01-24'),
                avatar: 'https://www.cartoonize.net/wp-content/uploads/2024/05/avatar-maker-photo-to-cartoon.png',
                isDead: false,
                address: 'Hà Nội',
                desc: 'Là người cha của gia tộc',
            });

            const baX = await personService.create({
                cccd: '1224567890',
                name: 'Đinh Thị X',
                gender: Gender.FEMALE,
                birth: new Date('1900-01-30'),
                avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3rzFZs0tioVeqNH0BKGWxnzfGNevCLpvoXN-vWtjvsjUl5gjNW6lXGyuD7AwJltJgoKk&usqp=CAU',
                isDead: false,
                address: 'Hà Nội',
                desc: 'Vợ đầu của ông A',
            });
            
            // Tạo quan hệ vợ chồng
            await spouseService.create({
                husband: ongA._id as any,
                wife: baX._id as any,
                husbandOrder: 1,
                wifeOrder: 1,
                marriageDate: new Date('1920-01-01'),
            });

            console.log('✅ Đã nạp xong dữ liệu mẫu thành công!');
        } catch (error) {
            console.error('❌ Lỗi khi nạp dữ liệu mẫu:', error);
        }
    }

    await app.close();
}

seed();
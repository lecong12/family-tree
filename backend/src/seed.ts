import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { join } from 'path';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);

    // 1. Lấy Model từ Context
    const personModel = app.get<Model<any>>(getModelToken('Person'));
    const spouseModel = app.get<Model<any>>(getModelToken('Spouse'));
    const parentChildModel = app.get<Model<any>>(getModelToken('ParentChild'));

    const filePath = join(process.cwd(), 'Banchuan.csv');

    console.log('--------------------------------------------------');
    console.log('🧹 BƯỚC 1: XÓA SẠCH DỮ LIỆU CŨ TRƯỚC KHI NẠP MỚI...');
    await personModel.deleteMany({});
    await spouseModel.deleteMany({});
    await parentChildModel.deleteMany({});

    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const records: any[] = parse(fileContent, { 
            columns: true, 
            skip_empty_lines: true, 
            trim: true, 
            bom: true 
        });

        const personMap = new Map(); 
        const spouseMap = new Map(); 

        console.log('🚀 BƯỚC 2: NẠP NHÂN VẬT & GÁN AVATAR HOẠT HÌNH...');
        
        for (const row of records) {
            const id = String(row.id).trim();
            if (!id) continue;

            const gen = parseInt(row.generation) || 1;
            const genderRaw = String(row.gender).trim().toLowerCase();
            
            // Xác định giới tính (Nam: 0, Nữ: 1)
            const isMale = (genderRaw === 'nam' || genderRaw === '0' || genderRaw === 'male');

            // [CẬP NHẬT] Gán link ảnh cố định theo yêu cầu của bạn
            const avatarUrl = isMale 
                ? `https://www.cartoonize.net/wp-content/uploads/2024/05/avatar-maker-photo-to-cartoon.png` 
                : `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3rzFZs0tioVeqNH0BKGWxnzfGNevCLpvoXN-vWtjvsjUl5gjNW6lXGyuD7AwJltJgoKk&usqp=CAU`;

            const pId = new Types.ObjectId();
            
            await personModel.create({
                _id: pId,
                cccd: id.padStart(10, '0'),
                name: row.full_name,
                gender: isMale ? 0 : 1, 
                birth: new Date(1800 + (gen * 25), 0, 1),
                avatar: avatarUrl, // Lưu link hoạt hình vào DB
                isDead: row.is_live === '0',
                address: row.address || "",
                desc: isMale ? `Thế hệ thứ ${gen}` : `Thành viên nữ`,
            });
            
            personMap.set(id, { _id: pId, name: row.full_name });
        }

        console.log('💍 BƯỚC 3: THIẾT LẬP QUAN HỆ VỢ CHỒNG...');
        const husbandTrack = new Map<string, number>();

        for (const row of records) {
            const husbandId = String(row.pid).trim();
            const wifeId = String(row.id).trim();
            const genderRaw = String(row.gender).trim().toLowerCase();
            const isFemale = (genderRaw === 'nữ' || genderRaw === '1' || genderRaw === 'female');

            if (husbandId && husbandId !== '0' && isFemale) {
                const husband = personMap.get(husbandId);
                const wife = personMap.get(wifeId);
                
                if (husband && wife) {
                    let orderToUse = (husbandTrack.get(husbandId) || 0) + 1;
                    
                    const spouse = await spouseModel.create({
                        husband: husband._id,
                        wife: wife._id,
                        husbandOrder: 1,
                        wifeOrder: orderToUse,
                    });

                    // Cập nhật mô tả vai trò vợ
                    await personModel.updateOne(
                        { _id: wife._id },
                        { desc: orderToUse === 1 ? "Chính thất" : `Thứ thất (Vợ ${orderToUse})` }
                    );

                    spouseMap.set(`${husbandId}_${wifeId}`, spouse);
                    husbandTrack.set(husbandId, orderToUse);
                }
            }
        }

        console.log('🌳 BƯỚC 4: KẾT NỐI QUAN HỆ CHA MẸ - CON CÁI...');
        let connectCount = 0;
        for (const row of records) {
            const fid = String(row.fid).trim();
            const mid = String(row.mid).trim();
            const childId = String(row.id).trim();

            if (fid && fid !== '0') {
                let parentSpouse = spouseMap.get(`${fid}_${mid}`);
                
                // Nếu không tìm thấy cặp vợ chồng khớp hoàn toàn, lấy vợ đầu tiên của cha
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
        console.log(`✅ HOÀN TẤT: ĐÃ NẠP ${personMap.size} NGƯỜI VÀ ${connectCount} LIÊN KẾT CON CÁI.`);
        console.log('--------------------------------------------------');

    } catch (error) {
        console.error('❌ LỖI KHI CHẠY SEED:', error.message);
    } finally {
        await app.close();
    }
}

seed();

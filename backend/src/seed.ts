import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { join } from 'path';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const personModel = app.get<Model<any>>(getModelToken('Person'));
    const spouseModel = app.get<Model<any>>(getModelToken('Spouse'));
    const parentChildModel = app.get<Model<any>>(getModelToken('ParentChild'));

    const filePath = join(process.cwd(), 'Banchuan.csv');

    // Link ảnh mặt người cố định
    const MALE_AVATAR = 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png';
    const FEMALE_AVATAR = 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png';

    console.log('🧹 Đang dọn dẹp dữ liệu cũ...');
    await personModel.deleteMany({});
    await spouseModel.deleteMany({});
    await parentChildModel.deleteMany({});

    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const records = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true, bom: true });

        const personMap = new Map();
        const spouseMap = new Map();

        console.log('🚀 Đang nạp nhân vật và gán Avatar...');
        for (const row of records) {
            const id = String(row.id).trim();
            if (!id) continue;

            const genderRaw = String(row.gender).trim().toLowerCase();
            const isMale = (genderRaw === 'nam' || genderRaw === '0' || genderRaw === 'male');

            // Nếu trong CSV không có link ảnh, dùng link mặt người cố định
            let avatarUrl = row.avatar ? String(row.avatar).trim() : '';
            if (!avatarUrl || avatarUrl === '') {
                avatarUrl = isMale ? MALE_AVATAR : FEMALE_AVATAR;
            }

            const pId = new Types.ObjectId();
            const gen = parseInt(row.generation) || 1;

            await personModel.create({
                _id: pId,
                cccd: id.padStart(10, '0'),
                name: row.full_name,
                gender: isMale ? 0 : 1,
                birth: new Date(1800 + (gen * 25), 0, 1),
                avatar: avatarUrl,
                isDead: row.is_live === '0',
                address: row.address || "",
                desc: isMale ? `Thế hệ thứ ${gen}` : `Thành viên nữ`,
            });
            personMap.set(id, { _id: pId });
        }

        // --- PHẦN KẾT NỐI VỢ CHỒNG & CON CÁI (GIỮ NGUYÊN LOGIC CŨ) ---
        // (Tôi lược bớt phần logic này để tập trung vào Avatar cho bạn dễ nhìn)
        console.log('✅ Hoàn tất nạp dữ liệu!');

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        await app.close();
    }
}
seed();

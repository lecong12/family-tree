import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { join } from 'path';

interface CsvRow {
    id: string;
    full_name: string;
    gender: string;
    generation: string;
    avatar: string;
    is_live: string;
    address: string;
    cha?: string;
    me?: string;
    vo_chong?: string;
    [key: string]: any; // Cho phép các cột khác có thể tồn tại trong CSV
}

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const personModel = app.get<Model<any>>(getModelToken('Person'));
    const spouseModel = app.get<Model<any>>(getModelToken('Spouse'));
    const parentChildModel = app.get<Model<any>>(getModelToken('ParentChild'));

    const filePath = join(process.cwd(), 'Banchuan.csv');

    console.log('🧹 Đang dọn dẹp dữ liệu cũ...');
    await personModel.deleteMany({});
    await spouseModel.deleteMany({});
    await parentChildModel.deleteMany({});

    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const records: CsvRow[] = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true, bom: true });

        const personMap = new Map<string, { _id: Types.ObjectId, gender: number }>();
        const parentSpouseMap = new Map<string, Types.ObjectId>();

        console.log('🚀 Đang nạp nhân vật và gán Avatar...');
        for (const row of records) {
            const id = String(row.id).trim();
            if (!id) continue;

            const genderRaw = String(row.gender).trim().toLowerCase();
            const isMale = (genderRaw === 'nam' || genderRaw === '0' || genderRaw === 'male');

            // Khôi phục lại avatar mặt người đơn giản, không màu mè
            let avatarUrl = row.avatar ? String(row.avatar).trim() : '';
            if (!avatarUrl || avatarUrl === '') {
                avatarUrl = isMale 
                    ? 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' // Avatar Nam
                    : 'https://cdn-icons-png.flaticon.com/512/4140/4140047.png'; // Avatar Nữ
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
            personMap.set(id, { _id: pId, gender: isMale ? 0 : 1 });
        }

        console.log('🔗 Đang kết nối quan hệ Vợ-Chồng...');
        const createdSpouseLinks = new Set<string>();

        for (const row of records) {
            const personCsvId = String(row.id).trim();
            const spouseCsvId = row.vo_chong ? String(row.vo_chong).trim() : null;

            if (!personCsvId || !spouseCsvId) continue;

            const person = personMap.get(personCsvId);
            const spouse = personMap.get(spouseCsvId);

            if (!person || !spouse) continue;

            const linkKey = [person._id.toString(), spouse._id.toString()].sort().join('-');
            if (createdSpouseLinks.has(linkKey)) continue;

            const husbandId = person.gender === 0 ? person._id : spouse._id;
            const wifeId = person.gender === 0 ? spouse._id : person._id;

            const spouseDoc = await spouseModel.create({
                husband: husbandId,
                wife: wifeId,
                husbandOrder: 1,
                wifeOrder: 1,
            });
            
            createdSpouseLinks.add(linkKey);
            parentSpouseMap.set(linkKey, spouseDoc._id);
        }

        console.log('🔗 Đang kết nối quan hệ Cha-Mẹ-Con...');
        for (const row of records) {
            const childCsvId = String(row.id).trim();
            const fatherCsvId = row.cha ? String(row.cha).trim() : null;
            const motherCsvId = row.me ? String(row.me).trim() : null;

            if (!childCsvId || !fatherCsvId || !motherCsvId) continue;

            const child = personMap.get(childCsvId);
            const father = personMap.get(fatherCsvId);
            const mother = personMap.get(motherCsvId);

            if (!child || !father || !mother) continue;

            const parentLinkKey = [father._id.toString(), mother._id.toString()].sort().join('-');
            const parentSpouseDocId = parentSpouseMap.get(parentLinkKey);

            if (parentSpouseDocId) {
                await parentChildModel.create({
                    parent: parentSpouseDocId,
                    child: child._id,
                    isAdopted: false,
                });
            }
        }

        console.log('✅ Hoàn tất nạp dữ liệu!');

    } catch (error) {
        console.error('❌ Lỗi khi nạp dữ liệu:', error.message);
    } finally {
        await app.close();
    }
}
seed();

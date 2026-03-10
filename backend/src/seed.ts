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
    pid?: string; // Partner ID (Husband)
    fid?: string; // Father ID
    mid?: string; // Mother ID
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

        const personMap = new Map<string, { _id: Types.ObjectId, name: string }>();

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
            personMap.set(id, { _id: pId, name: row.full_name });
        }

        console.log('🔗 Đang kết nối quan hệ Vợ-Chồng...');
        const spouseMap = new Map<string, { _id: Types.ObjectId }>();
        let spouseConnectCount = 0;

        for (const row of records) {
            const husbandCsvId = row.pid ? String(row.pid).trim() : null;
            const wifeCsvId = String(row.id).trim();
            const genderRaw = String(row.gender).trim().toLowerCase();
            const isFemale = (genderRaw === 'nữ' || genderRaw === '1' || genderRaw === 'female');

            // Logic này dựa trên việc file CSV định nghĩa chồng trong dòng của vợ qua cột 'pid'
            if (husbandCsvId && husbandCsvId !== '0' && isFemale) {
                const husband = personMap.get(husbandCsvId);
                const wife = personMap.get(wifeCsvId);

                if (husband && wife) {
                    const spouseDoc = await spouseModel.create({
                        husband: husband._id,
                        wife: wife._id,
                        // Giả định thứ tự, có thể cần logic phức tạp hơn nếu có đa thê
                        husbandOrder: 1,
                        wifeOrder: 1, 
                    });
                    spouseMap.set(`${husbandCsvId}_${wifeCsvId}`, { _id: spouseDoc._id });
                    spouseConnectCount++;
                } else {
                    const husbandName = husband ? husband.name : 'Không tìm thấy';
                    const wifeName = wife ? wife.name : 'Không tìm thấy';
                    console.warn(`⚠️  [VỢ-CHỒNG] Bỏ qua: Vợ '${wifeName}' (ID: ${wifeCsvId}) và Chồng '${husbandName}' (ID: ${husbandCsvId}) do không tìm thấy đủ thông tin trong map.`);
                }
            }
        }
        console.log(`    -> Đã tạo ${spouseConnectCount} liên kết vợ-chồng.`);

        console.log('🔗 Đang kết nối quan hệ Cha-Mẹ-Con...');
        let childConnectCount = 0;
        for (const row of records) {
            const childCsvId = String(row.id).trim();
            const fatherCsvId = row.fid ? String(row.fid).trim() : null;
            const motherCsvId = row.mid ? String(row.mid).trim() : null;

            // Chỉ kết nối nếu có thông tin cha hoặc mẹ
            if (childCsvId && (fatherCsvId || motherCsvId)) {
                const child = personMap.get(childCsvId);
                if (!child) continue;

                // Tìm bản ghi hôn nhân của cha và mẹ
                const parentSpouse = spouseMap.get(`${fatherCsvId}_${motherCsvId}`);

                if (parentSpouse) {
                    await parentChildModel.create({
                        parent: parentSpouse._id,
                        child: child._id,
                        isAdopted: false,
                    });
                    childConnectCount++;
                } else {
                    const childName = child ? child.name : 'Không tìm thấy';
                    const fatherName = personMap.get(fatherCsvId)?.name || 'Không rõ';
                    const motherName = personMap.get(motherCsvId)?.name || 'Không rõ';
                    console.warn(`⚠️  [CHA-CON] Bỏ qua: Không tìm thấy quan hệ hôn nhân của Cha '${fatherName}' (ID: ${fatherCsvId}) và Mẹ '${motherName}' (ID: ${motherCsvId}) để kết nối cho Con '${childName}' (ID: ${childCsvId}).`);
                }
            }
        }
        console.log(`    -> Đã kết nối ${childConnectCount} người con.`);

        console.log('✅ Hoàn tất nạp dữ liệu!');

    } catch (error) {
        console.error('❌ Lỗi khi nạp dữ liệu:', error.message);
    } finally {
        await app.close();
    }
}
seed();

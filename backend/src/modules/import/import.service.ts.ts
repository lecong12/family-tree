import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import slugify from 'slugify';

@Injectable()
export class DataImportService {
  constructor(
    @InjectModel('Person') private personModel: Model<any>,
    @InjectModel('ParentChild') private parentChildModel: Model<any>,
    @InjectModel('Spouse') private spouseModel: Model<any>,
  ) {}

  async importFamilyData(fileBuffer: Buffer) {
    const rows: any[] = [];
    const stream = Readable.from(fileBuffer).pipe(csv());

    for await (const row of stream) {
      if (row.full_name) rows.push(row);
    }

    // --- BƯỚC 1: DỌN DẸP 3 BẢNG DỮ LIỆU ---
    // Xóa sạch để đảm bảo không bị trùng lặp ID cũ
    await Promise.all([
      this.personModel.deleteMany({}),
      this.parentChildModel.deleteMany({}),
      this.spouseModel.deleteMany({}),
    ]);

    // Map để lưu ID cũ từ CSV và _id mới của MongoDB
    const personMap = new Map<number, Types.ObjectId>();

    // --- BƯỚC 2: XỬ LÝ BẢNG 'PEOPLE' & TẠO DESCRIPTION ---
    const personOps = rows.map((row) => {
      const oldId = parseInt(row.id);
      const _id = new Types.ObjectId();
      personMap.set(oldId, _id);

      // Tìm Cha, Mẹ, Con để viết mô tả (Logic như bạn yêu cầu)
      const father = rows.find(r => parseInt(r.id) === parseInt(row.fid));
      const mother = rows.find(r => parseInt(r.id) === parseInt(row.mid));
      const children = rows.filter(r => 
        (r.fid && parseInt(r.fid) === oldId) || (r.mid && parseInt(r.mid) === oldId)
      );
      const childrenNames = children.map(c => c.full_name).join(", ");

      // Xây dựng nội dung Description
      let description = `Thành viên đời thứ ${row.generation}, thuộc Phái ${row.branch || '0'}. `;
      
      if (father || mother) {
        description += `Là con của ${father ? 'ông ' + father.full_name : 'cha không rõ'}`;
        description += ` và ${mother ? 'bà ' + mother.full_name : 'mẹ không rõ'}. `;
      }

      if (children.length > 0) {
        description += `Sinh hạ được ${children.length} người con: ${childrenNames}.`;
      } else {
        description += `Hiện chưa có thông tin về con cái.`;
      }

      return {
        insertOne: {
          document: {
            _id,
            name: row.full_name,
            gender: row.gender === 'Nam' ? 'MALE' : 'FEMALE',
            generation: parseInt(row.generation),
            branch: row.branch,
            description: description,
            isDead: row.is_live === '0',
            old_id: oldId, // Lưu lại để đối chiếu
            slug: `${slugify(row.full_name, { lower: true, locale: 'vi' })}-${oldId}`,
            createdAt: new Date(),
          }
        }
      };
    });

    // Thực hiện BulkWrite vào bảng People
    await this.personModel.bulkWrite(personOps);

    // --- BƯỚC 3: XỬ LÝ BẢNG 'PARENTCHILDREN' & 'SPOUSES' ---
    const parentChildOps = [];
    const spouseOps = [];

    for (const row of rows) {
      const currentMongoId = personMap.get(parseInt(row.id));
      if (!currentMongoId) continue;

      // Nối bảng ParentChild (Cha)
      if (row.fid && personMap.has(parseInt(row.fid))) {
        parentChildOps.push({
          insertOne: {
            document: {
              parentId: personMap.get(parseInt(row.fid)),
              childId: currentMongoId,
              type: 'FATHER',
            }
          }
        });
      }

      // Nối bảng ParentChild (Mẹ)
      if (row.mid && personMap.has(parseInt(row.mid))) {
        parentChildOps.push({
          insertOne: {
            document: {
              parentId: personMap.get(parseInt(row.mid)),
              childId: currentMongoId,
              type: 'MOTHER',
            }
          }
        });
      }

      // Nối bảng Spouse (Vợ/Chồng)
      if (row.pid && personMap.has(parseInt(row.pid))) {
        const spouseMongoId = personMap.get(parseInt(row.pid));
        // Kiểm tra xem cặp này đã được thêm vào Spouse chưa (để tránh lặp 2 dòng cho 1 cặp)
        const isAlreadyAdded = spouseOps.some(op => 
          (op.insertOne.document.person1Id === spouseMongoId && op.insertOne.document.person2Id === currentMongoId)
        );

        if (!isAlreadyAdded) {
          spouseOps.push({
            insertOne: {
              document: {
                person1Id: currentMongoId,
                person2Id: spouseMongoId,
                createdAt: new Date(),
              }
            }
          });
        }
      }
    }

    // Thực thi BulkWrite cho 2 bảng quan hệ
    if (parentChildOps.length > 0) await this.parentChildModel.bulkWrite(parentChildOps);
    if (spouseOps.length > 0) await this.spouseModel.bulkWrite(spouseOps);

    return { 
      success: true, 
      count: rows.length,
      message: "Đã tái cấu trúc 3 bảng People, ParentChild và Spouse thành công." 
    };
  }
}

import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Person } from './schemas/person.schema';
import { HydratedDocument, Model, Types } from 'mongoose';
import { SpouseService } from '../spouse/spouse.service';
import { ParentChildService } from '../parent-child/parent-child.service';
import { Gender } from '../../constants';
import { parse } from 'csv-parse/sync';

@Injectable()
export class PersonService {
    constructor(
        @InjectModel(Person.name) private readonly personModel: Model<Person>,
        private readonly spouseService: SpouseService,
        private readonly parentChildService: ParentChildService,
    ) {}

    async importFromCsv(fileBuffer: Buffer) {
        const spouseModel = this.personModel.db.model('Spouse');
        const parentChildModel = this.personModel.db.model('ParentChild');

        console.log('--------------------------------------------------');
        console.log('🧹 BƯỚC 1: XÓA SẠCH DỮ LIỆU CŨ...');
        await this.personModel.deleteMany({});
        await spouseModel.deleteMany({});
        await parentChildModel.deleteMany({});

        let records: any[] = [];
        try {
            records = parse(fileBuffer, { columns: true, skip_empty_lines: true, trim: true, bom: true });
        } catch (error) {
            throw new BadRequestException('File CSV bị lỗi định dạng hoặc không đọc được: ' + (error instanceof Error ? error.message : String(error)));
        }

        if (records.length === 0) {
            throw new BadRequestException('File CSV rỗng hoặc không hợp lệ.');
        }

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

            if (fid && fid !== '0') {
                if (!childrenOfParentMap.has(fid)) childrenOfParentMap.set(fid, []);
                childrenOfParentMap.get(fid)!.push(childEntry);
            }
            if (mid && mid !== '0') {
                if (!childrenOfParentMap.has(mid)) childrenOfParentMap.set(mid, []);
                childrenOfParentMap.get(mid)!.push(childEntry);
            }
        }

        console.log(`🚀 BƯỚC 2: NẠP ${records.length} NHÂN VẬT TỪ CSV...`);
        for (const row of records) {
            const id = String(row.id).trim();
            if (!id) continue;

            // Kiểm tra trùng lặp ID trong chính file CSV để tránh lỗi Duplicate Key khi insert
            if (personMap.has(id)) {
                console.warn(`Cảnh báo: ID ${id} bị trùng trong file CSV. Bỏ qua dòng này.`);
                continue;
            }

            const gen = parseInt(row.generation) || 1;
            const genderRaw = String(row.gender).trim().toLowerCase();
            const isMale = (genderRaw === 'nam' || genderRaw === '0' || genderRaw === 'male');

            const avatarUrl = (row.image && row.image.trim() !== '')
                ? row.image.trim()
                : (isMale 
                    ? 'https://www.cartoonize.net/wp-content/uploads/2024/05/avatar-maker-photo-to-cartoon.png'
                    : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3rzFZs0tioVeqNH0BKGWxnzfGNevCLpvoXN-vWtjvsjUl5gjNW6lXGyuD7AwJltJgoKk&usqp=CAU');

            const birthDate = row.birth_date && new Date(row.birth_date).toString() !== 'Invalid Date'
                ? new Date(row.birth_date)
                : new Date(1800 + (gen * 25), 0, 1);
            
            const deathDate = row.death_date && new Date(row.death_date).toString() !== 'Invalid Date'
                ? new Date(row.death_date)
                : null;

            const isDead = row.is_live === '0' || (deathDate !== null && deathDate <= new Date());

            let finalDesc = row.desc?.trim();
            if (!finalDesc) {
                const descParts: string[] = [];
                const fid = String(row.fid).trim();
                const mid = String(row.mid).trim();
                const fatherInfo = personInfoMap.get(fid);
                const motherInfo = personInfoMap.get(mid);

                if (fatherInfo && motherInfo) {
                    descParts.push(`Là con của ông ${fatherInfo.name} và bà ${motherInfo.name}.`);
                } else if (fatherInfo) {
                    descParts.push(`Là con của ông ${fatherInfo.name}.`);
                }

                const childrenList = childrenOfParentMap.get(id);
                if (childrenList && childrenList.length > 0) {
                    childrenList.sort((a, b) => a.order - b.order);
                    const childrenString = childrenList.map((c, i) => `${i + 1}. ${c.name}`).join('; ');
                    descParts.push(`Sinh hạ ${childrenList.length} người con là: ${childrenString}.`);
                }
                finalDesc = descParts.join(' ');
            }

            // Logic CCCD: Ưu tiên lấy từ CSV (cột cccd hoặc cccd_number), nếu không có thì sinh mã 12 số từ ID
            const rawCCCD = row.cccd || row.cccd_number || row.identity_card;
            const cccd = (rawCCCD && String(rawCCCD).trim().length > 0) 
                ? String(rawCCCD).trim() 
                : id.padStart(12, '0');

            const pId = new Types.ObjectId();
            await this.personModel.create({
                _id: pId,
                cccd: cccd,
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

        console.log('💍 BƯỚC 3: THIẾT LẬP VỢ CHỒNG...');
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

                    spouseMap.set(`${husbandId}_${wifeId}`, spouse);
                    husbandTrack.set(husbandId, orderToUse);
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
        console.log(`✅ IMPORT THÀNH CÔNG! ĐÃ NỐI ${connectCount} CON CÁI TỪ CSV.`);
        console.log('--------------------------------------------------');
        return { message: `Import thành công! Đã nạp ${records.length} thành viên.` };
    }

    async create(createPersonDto: CreatePersonDto) {
        if (!createPersonDto.avatar || createPersonDto.avatar.trim() === '') {
            this._ensureAvatar(createPersonDto);
        }

        // Check if CCCD already exists
        const existingPerson = await this.personModel.findOne({ cccd: createPersonDto.cccd }).exec();
        if (existingPerson) {
            throw new ConflictException(`CCCD ${createPersonDto.cccd} đã tồn tại trong hệ thống`);
        }

        try {
            const newPersonDoc = await this.personModel.create(createPersonDto);
            // Chuyển đổi sang object thuần và đảm bảo có avatar trước khi trả về
            const newPerson = newPersonDoc.toObject();
            this._ensureAvatar(newPerson);
            return newPerson;
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException(`CCCD ${createPersonDto.cccd} đã tồn tại trong hệ thống`);
            }
            throw error;
        }
    }

    async findAll() {
        const persons = await this.personModel.find().lean().exec();
        // Đảm bảo mọi người đều có avatar
        for (const person of persons) {
            this._ensureAvatar(person);
        }
        return persons;
    }

    async findOne(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid person ID: ${id}`);
        }

        const person = await this.personModel.findById(id).lean().exec();

        if (!person) {
            throw new NotFoundException(`Person with ID ${id} not found`);
        }

        // Đảm bảo người này luôn có avatar, ngay cả khi trong DB là null hoặc rỗng
        this._ensureAvatar(person);

        return person;
    }

    async update(id: string, updatePersonDto: UpdatePersonDto) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid person ID: ${id}`);
        }

        // Create a mutable payload from the DTO to avoid side effects
        const payload: Partial<UpdatePersonDto> = { ...updatePersonDto };

        // Check if CCCD is being updated and if it already exists
        if (payload.cccd) {
            const existingPerson = await this.personModel
                .findOne({
                    cccd: payload.cccd,
                    _id: { $ne: id },
                })
                .exec();

            if (existingPerson) {
                throw new ConflictException(`CCCD ${payload.cccd} đã tồn tại trong hệ thống`);
            }
        }

        // Chỉ xử lý logic avatar khi người dùng muốn reset (gửi chuỗi rỗng)
        if (payload.avatar === '') {
            const currentPerson = await this.personModel.findById(id).select('gender').lean().exec();
            if (currentPerson) {
                const MALE_DEFAULT = 'https://www.cartoonize.net/wp-content/uploads/2024/05/avatar-maker-photo-to-cartoon.png';
                const FEMALE_DEFAULT = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3rzFZs0tioVeqNH0BKGWxnzfGNevCLpvoXN-vWtjvsjUl5gjNW6lXGyuD7AwJltJgoKk&usqp=CAU';

                const nextGender = payload.gender !== undefined ? payload.gender : currentPerson.gender;
                const isMale = Number(nextGender) === 0 || (nextGender as any) === 'MALE' || nextGender === Gender.MALE;
                
                payload.avatar = isMale ? MALE_DEFAULT : FEMALE_DEFAULT;
            }
        } else if (payload.avatar === undefined || payload.avatar === null) {
            // Nếu không gửi avatar (hoặc null), xóa khỏi payload để Mongoose KHÔNG chạm vào trường này trong DB
            delete payload.avatar;
        }

        try {
            const updatedPersonDoc = await this.personModel.findByIdAndUpdate(id, payload, { new: true }).exec();

            if (!updatedPersonDoc) {
                throw new NotFoundException(`Person with ID ${id} not found`);
            }

            // Convert to plain object to safely modify it before returning
            const updatedPerson = updatedPersonDoc.toObject();

            // Ensure the returned object has a default avatar if the field is empty.
            this._ensureAvatar(updatedPerson);

            return updatedPerson;
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException(`CCCD ${payload.cccd} đã tồn tại trong hệ thống`);
            }
            throw error;
        }
    }

    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid person ID: ${id}`);
        }

        const person = await this.personModel.findById(id).exec();
        if (!person) {
            throw new NotFoundException(`Person with ID ${id} not found`);
        }

        // Delete all spouse relationships where this person is husband or wife
        await this.spouseService.deleteSpousesByPersonId(id);

        // Delete all parent-child relationships where this person is a child
        await this.parentChildService.deleteChildRelationships(id);

        // Delete the person
        await this.personModel.findByIdAndDelete(id).exec();

        return {
            message: `Person with ID ${id} and all related relationships have been successfully deleted`,
        };
    }

    async getGenerationByPerson(personId: string) {
        if (!Types.ObjectId.isValid(personId)) {
            throw new NotFoundException(`Invalid person ID: ${personId}`);
        }

        const idStr = personId.toString();

        const person = await this.personModel.findById(idStr).lean().exec();
        if (!person) {
            throw new NotFoundException(`Person with ID ${idStr} not found`);
        }

        // Đảm bảo người gốc của thế hệ này có avatar
        this._ensureAvatar(person);

        const personInFamily: Record<string, any> = {
            [idStr]: person,
        };

        const spouseRelationships = await this.spouseService.findByPerson(idStr);

        // 1. Lấy ID của tất cả vợ/chồng
        const spouseIds = spouseRelationships.map((rel) =>
            rel.husband.toString() === idStr ? rel.wife.toString() : rel.husband.toString(),
        );

        // 2. Lấy toàn bộ thông tin của các vợ/chồng đó trong 1 query
        if (spouseIds.length > 0) {
            const spousesData = await this.personModel.find({ _id: { $in: spouseIds } }).lean().exec();
            for (const spouse of spousesData) {
                // Đảm bảo vợ/chồng cũng có avatar
                this._ensureAvatar(spouse);
                personInFamily[spouse._id.toString()] = spouse;
            }
        }

        const tree = {
            user: idStr,
            spouses: [],
        };

        // 3. Dựng cấu trúc cây với dữ liệu đầy đủ
        for (const relationship of spouseRelationships) {
            const children = await this.parentChildService.findAllChildIdsByParent(relationship._id.toString());
            if (idStr === relationship.husband.toString()) {
                const wifeId = relationship.wife.toString();
                tree.spouses.push({
                    user: { id: wifeId, spouseOrder: relationship.husbandOrder },
                    spouseOrder: relationship.wifeOrder,
                    marriageDate: relationship.marriageDate,
                    divorceDate: relationship.divorceDate,
                    children: children,
                });
            } else {
                const husbandId = relationship.husband.toString();
                tree.spouses.push({
                    user: { id: husbandId, spouseOrder: relationship.wifeOrder },
                    spouseOrder: relationship.husbandOrder,
                    marriageDate: relationship.marriageDate,
                    divorceDate: relationship.divorceDate,
                    children: children,
                });
            }
        }

        return {
            personData: personInFamily,
            tree: tree,
        };
    }

    async getNGenerations(personId: string, generations: number) {
        if (!Types.ObjectId.isValid(personId)) {
            throw new NotFoundException(`Invalid person ID: ${personId}`);
        }

        const personData: Record<string, any> = {};
        const treeData: any[] = [];
        let idsToProcess = new Set<string>([personId]);
        const processedIds = new Set<string>();

        for (let i = 0; i < generations && idsToProcess.size > 0; i++) {
            const generationResult = [];
            const nextGenerationIds = new Set<string>();

            // Lấy dữ liệu cho tất cả các person trong thế hệ hiện tại
            const generationPromises = Array.from(idsToProcess).map(id => {
                const idStr = id.toString();
                if (processedIds.has(idStr)) return null;
                processedIds.add(idStr);
                return this.getGenerationByPerson(idStr);
            });

            const results = (await Promise.all(generationPromises)).filter(Boolean);

            const processedPeople = new Set<string>(); // People already included in a family unit for this generation.

            for (const subFamily of results) {
                // Hợp nhất personData trước để đảm bảo có đủ thông tin cho tất cả mọi người
                Object.assign(personData, subFamily.personData);

                const userId = subFamily.tree.user;

                // If the main person of this branch has already been included
                // (either as a main person or as a spouse), skip creating a new branch for them.
                if (processedPeople.has(userId)) {
                    continue;
                }

                // This is a new family unit to be displayed.
                generationResult.push(subFamily.tree);

                // Mark the main person and all their spouses as "processed" for this generation
                // to prevent them from creating their own separate branches.
                processedPeople.add(userId);
                for (const spouse of subFamily.tree.spouses) {
                    processedPeople.add(spouse.user.id);
                }
            }

            // After deciding which branches to display, loop through ALL original results
            // to ensure all children are collected for the next generation.
            for (const subFamily of results) {
                subFamily.tree.spouses.forEach(spouse => {
                    spouse.children?.forEach(childId => nextGenerationIds.add(childId.toString()));
                });
            }

            // Sắp xếp các nhánh trong cùng một thế hệ (anh chị em) theo ngày sinh.
            // Logic thông thường của gia phả là người lớn tuổi hơn (anh, chị) sẽ ở bên trái.
            generationResult.sort((a, b) => {
                const personA = personData[a.user];
                const personB = personData[b.user];

                // Bỏ qua sắp xếp nếu thiếu thông tin ngày sinh
                if (!personA?.birth || !personB?.birth) {
                    return 0;
                }

                const birthA = new Date(personA.birth).getTime();
                const birthB = new Date(personB.birth).getTime();

                return birthA - birthB; // Sắp xếp tăng dần theo ngày sinh (người lớn tuổi hơn có ngày sinh nhỏ hơn sẽ đứng trước).
            });

            if (generationResult.length > 0) {
                treeData.push(generationResult);
            }

            // Chuẩn bị cho vòng lặp tiếp theo
            idsToProcess = new Set([...nextGenerationIds].filter(id => !processedIds.has(id)));
        }
        return {
            personData: personData,
            treeData: treeData,
        };
    }

    async searchByName(name: string) {
        let filter: any = {};
        if (name && name.trim().length > 0) {
            // Tìm kiếm gần đúng, không phân biệt hoa thường.
            // Sử dụng regex an toàn hơn bằng cách escape các ký tự đặc biệt nếu cần (tạm thời giữ nguyên logic cơ bản)
            filter = { 
                name: { 
                    $regex: name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
                    $options: 'i' 
                } 
            };
        }
        
        // Nếu name rỗng, filter là {}, trả về 10 người đầu tiên
        const persons = await this.personModel
            .find(filter)
            .select('_id name cccd slug avatar gender') // Chỉ lấy các trường cần thiết
            .limit(10) // Giới hạn 10 kết quả
            .lean() // Sử dụng lean để có kết quả nhanh hơn và dễ chỉnh sửa
            .exec();

        // Đảm bảo mọi người trong kết quả tìm kiếm đều có avatar
        for (const person of persons) {
            this._ensureAvatar(person);
        }
        return persons;
    }

    /**
     * A private helper to ensure a person object has a default avatar if one isn't set.
     * This method mutates the person object.
     * @param person - A person-like object with at least `name` and `gender` properties.
     */
    private _ensureAvatar(person: { name: string; gender: Gender | number; avatar?: string }): void {
        if (!person.avatar || person.avatar.trim() === '' || person.avatar.includes('ui-avatars.com')) {
            const isMale = Number(person.gender) === 0 || (person.gender as any) === 'MALE' || person.gender === Gender.MALE;
            person.avatar = isMale
                ? 'https://www.cartoonize.net/wp-content/uploads/2024/05/avatar-maker-photo-to-cartoon.png'
                : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3rzFZs0tioVeqNH0BKGWxnzfGNevCLpvoXN-vWtjvsjUl5gjNW6lXGyuD7AwJltJgoKk&usqp=CAU';
        }
    }
}

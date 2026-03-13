import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Person } from './schemas/person.schema';
import { HydratedDocument, Model, Types } from 'mongoose';
import { SpouseService } from '../spouse/spouse.service';
import { ParentChildService } from '../parent-child/parent-child.service';
import { Gender } from '../../constants';

@Injectable()
export class PersonService {
    constructor(
        @InjectModel(Person.name) private readonly personModel: Model<Person>,
        private readonly spouseService: SpouseService,
        private readonly parentChildService: ParentChildService,
    ) {}

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

        // If a new avatar URL is NOT provided (it's undefined, null, or empty string),
        // we need to decide whether to set a default avatar.
        if (!payload.avatar) { // This covers undefined, null, and ""
            const currentPerson = await this.personModel.findById(id).select('gender avatar').lean().exec();
            if (currentPerson) {
                const MALE_DEFAULT = 'https://www.cartoonize.net/wp-content/uploads/2024/05/avatar-maker-photo-to-cartoon.png';
                const FEMALE_DEFAULT = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3rzFZs0tioVeqNH0BKGWxnzfGNevCLpvoXN-vWtjvsjUl5gjNW6lXGyuD7AwJltJgoKk&usqp=CAU';

                const nextGender = payload.gender !== undefined ? payload.gender : currentPerson.gender;
                const isMale = Number(nextGender) === 0 || (nextGender as any) === 'MALE' || nextGender === Gender.MALE;
                const correctDefaultAvatar = isMale ? MALE_DEFAULT : FEMALE_DEFAULT;

                // Case 1: User explicitly wants to reset the avatar.
                if (payload.avatar === '') {
                    payload.avatar = correctDefaultAvatar;
                }
                // Case 2: User is updating other fields, so we check if the current avatar needs fixing.
                else { // payload.avatar is undefined or null
                    const currentAvatar = currentPerson.avatar;
                    const isInvalid = !currentAvatar || currentAvatar.trim() === '' || currentAvatar.includes('ui-avatars.com');
                    const isWrongGenderDefault = (isMale && currentAvatar === FEMALE_DEFAULT) || (!isMale && currentAvatar === MALE_DEFAULT);
                    if (isInvalid || isWrongGenderDefault) {
                        payload.avatar = correctDefaultAvatar;
                    }
                }
            }
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

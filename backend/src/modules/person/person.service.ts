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
        console.log(createPersonDto);

        if (!createPersonDto.avatar) {
            const isMale = Number(createPersonDto.gender) === 0 || createPersonDto.gender === 'MALE' || createPersonDto.gender === Gender.MALE;
            createPersonDto.avatar = isMale
                ? `https://ui-avatars.com/api/?name=${encodeURIComponent(createPersonDto.name)}&background=0D8ABC&color=fff&size=128`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(createPersonDto.name)}&background=E91E63&color=fff&size=128`;
        }

        // Check if CCCD already exists
        const existingPerson = await this.personModel.findOne({ cccd: createPersonDto.cccd }).exec();
        if (existingPerson) {
            throw new ConflictException(`CCCD ${createPersonDto.cccd} đã tồn tại trong hệ thống`);
        }

        try {
            const newPerson = await this.personModel.create(createPersonDto);
            return newPerson;
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException(`CCCD ${createPersonDto.cccd} đã tồn tại trong hệ thống`);
            }
            throw error;
        }
    }

    async findAll() {
        return await this.personModel.find().exec();
    }

    async findOne(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid person ID: ${id}`);
        }

        const person = await this.personModel.findById(id).exec();

        if (!person) {
            throw new NotFoundException(`Person with ID ${id} not found`);
        }

        return person;
    }

    async update(id: string, updatePersonDto: UpdatePersonDto) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException(`Invalid person ID: ${id}`);
        }

        // Check if CCCD is being updated and if it already exists
        if (updatePersonDto.cccd) {
            const existingPerson = await this.personModel
                .findOne({
                    cccd: updatePersonDto.cccd,
                    _id: { $ne: id },
                })
                .exec();

            if (existingPerson) {
                throw new ConflictException(`CCCD ${updatePersonDto.cccd} đã tồn tại trong hệ thống`);
            }
        }

        if (updatePersonDto.avatar === "") {
            const person = await this.personModel.findById(id).exec();
            if (person) {
                const name = updatePersonDto.name || person.name;
                const gender = updatePersonDto.gender !== undefined ? updatePersonDto.gender : person.gender;
                const isMale = Number(gender) === 0 || gender === 'MALE' || gender === Gender.MALE;
                updatePersonDto.avatar = isMale
                    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=128`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E91E63&color=fff&size=128`;
            }
        }

        try {
            const updatedPerson = await this.personModel.findByIdAndUpdate(id, updatePersonDto, { new: true }).exec();

            if (!updatedPerson) {
                throw new NotFoundException(`Person with ID ${id} not found`);
            }

            return updatedPerson;
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException(`CCCD ${updatePersonDto.cccd} đã tồn tại trong hệ thống`);
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

        const person = await this.personModel.findById(personId).exec();
        if (!person) {
            throw new NotFoundException(`Person with ID ${personId} not found`);
        }

        const personObject = person.toObject();
        // Create a map to store person objects by their IDs
        let personInFamily: Record<string, any> = {
            [personId]: personObject,
        };
        const spouseRelationships = await this.spouseService.findByPerson(personId);

        const tree = {
            user: personId,
            spouses: [],
        };
        // Get generation 1st is spouse relationships
        for (const relationship of spouseRelationships) {
            const spouseObject = relationship.toJSON();
            const children = await this.parentChildService.findAllChildIdsByParent(relationship._id.toString());
            if (personId === relationship.husband.toString()) {
                const wifeId = (relationship.wife as any)._id.toString();
                personInFamily[wifeId] = spouseObject.wife;
                // console.log(personInFamily);
                tree.spouses.push({
                    user: { id: wifeId, spouseOrder: relationship.husbandOrder },
                    spouseOrder: relationship.wifeOrder,
                    marriageDate: relationship.marriageDate,
                    divorceDate: relationship.divorceDate,
                    children: children,
                });
            } else {
                const husbandId = (relationship.husband as any)._id.toString();
                personInFamily[husbandId] = spouseObject.husband;
                tree.spouses.push({
                    user: { id: husbandId, spouseOrder: relationship.wifeOrder },
                    spouseOrder: relationship.husbandOrder,
                    marriageDate: relationship.marriageDate,
                    divorceDate: relationship.divorceDate,
                    children: children,
                });
            }
        }

        console.log('119', personInFamily);

        return {
            personData: personInFamily,
            tree: tree,
        };
    }

    async getNGenerations(personId: string, generations: number) {
        let personData = {};
        const treeData = [];

        let firstGeneration = await this.getGenerationByPerson(personId);
        personData = firstGeneration.personData;

        treeData.push([firstGeneration.tree]);

        let allPousesInGeneration = firstGeneration.tree.spouses;
        for (let i = 1; i < generations; i++) {
            if (allPousesInGeneration.length > 0) {
                const queryNextGenFn = [];

                for (const spouse of allPousesInGeneration) {
                    if (spouse.children.length > 0) {
                        for (const child of spouse.children) {
                            queryNextGenFn.push(this.getGenerationByPerson(child));
                        }
                    }
                }

                const generationData = await Promise.all(queryNextGenFn);

                const subtree = [];
                allPousesInGeneration = [];
                for (const subFamily of generationData) {
                    personData = { ...personData, ...subFamily.personData };
                    subtree.push([subFamily.tree]);
                    allPousesInGeneration.push(...subFamily.tree.spouses);
                }
                treeData.push(subtree);
            }
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
            .select('_id name cccd slug') // Chỉ lấy các trường cần thiết
            .limit(10) // Giới hạn 10 kết quả
            .exec();
        return persons;
    }
}

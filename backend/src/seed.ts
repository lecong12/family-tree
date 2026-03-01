import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PersonService } from './modules/person/person.service';
import { SpouseService } from './modules/spouse/spouse.service';
import { ParentChildService } from './modules/parent-child/parent-child.service';
import { Gender } from './constants';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const personService = app.get(PersonService);
    const spouseService = app.get(SpouseService);
    const parentChildService = app.get(ParentChildService);

    console.log('🌱 Starting seed...');

    try {
        // Generation 1 (Ông bà)
        console.log('Creating Generation 1...');
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

        const baC = await personService.create({
            cccd: '4253475475',
            name: 'Nguyễn Thị C',
            gender: Gender.FEMALE,
            birth: new Date('1900-01-15'),
            avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3rzFZs0tioVeqNH0BKGWxnzfGNevCLpvoXN-vWtjvsjUl5gjNW6lXGyuD7AwJltJgoKk&usqp=CAU',
            isDead: false,
            address: 'Hà Nội',
            desc: 'Vợ hai của ông A',
        });

        // Tạo quan hệ vợ chồng Generation 1
        console.log('Creating spouse relationships for Generation 1...');
        const spouseAX = await spouseService.create({
            husband: ongA._id as any,
            wife: baX._id as any,
            husbandOrder: 1,
            wifeOrder: 1,
            marriageDate: new Date('1920-01-01'),
        });

        const spouseAC = await spouseService.create({
            husband: ongA._id as any,
            wife: baC._id as any,
            husbandOrder: 2,
            wifeOrder: 1,
            marriageDate: new Date('1925-01-01'),
        });

        // Generation 2 (Con cái)
        console.log('Creating Generation 2...');
        const leThiAX = await personService.create({
            cccd: '56757457765',
            name: 'Lê Thị AX',
            gender: Gender.FEMALE,
            birth: new Date('1920-01-25'),
            avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3rzFZs0tioVeqNH0BKGWxnzfGNevCLpvoXN-vWtjvsjUl5gjNW6lXGyuD7AwJltJgoKk&usqp=CAU',
            isDead: false,
            address: 'Hà Nội',
            desc: 'Con gái đầu của ông A và bà X',
        });

        const leDinhYX = await personService.create({
            cccd: '3454566334',
            name: 'Lê Đình YX',
            gender: Gender.MALE,
            birth: new Date('1922-03-15'),
            avatar: 'https://www.cartoonize.net/wp-content/uploads/2024/05/avatar-maker-photo-to-cartoon.png',
            isDead: false,
            address: 'Hà Nội',
            desc: 'Con trai thứ hai của ông A và bà X',
        });

        const leDinhXX = await personService.create({
            cccd: '4564636456',
            name: 'Lê Đình XX',
            gender: Gender.MALE,
            birth: new Date('1926-05-10'),
            avatar: 'https://www.cartoonize.net/wp-content/uploads/2024/05/avatar-maker-photo-to-cartoon.png',
            isDead: false,
            address: 'Hà Nội',
            desc: 'Con trai của ông A và bà C',
        });

        // Tạo quan hệ cha mẹ - con
        console.log('Creating parent-child relationships...');
        await parentChildService.create({
            parent: spouseAX._id as any,
            child: leThiAX._id as any,
            isAdopted: false,
        });

        await parentChildService.create({
            parent: spouseAX._id as any,
            child: leDinhYX._id as any,
            isAdopted: false,
        });

        await parentChildService.create({
            parent: spouseAC._id as any,
            child: leDinhXX._id as any,
            isAdopted: false,
        });

        // Thêm vợ/chồng cho thế hệ 2
        console.log('Creating spouses for Generation 2...');
        const tranVanB = await personService.create({
            cccd: '7788990011',
            name: 'Trần Văn B',
            gender: Gender.MALE,
            birth: new Date('1918-06-20'),
            avatar: 'https://www.cartoonize.net/wp-content/uploads/2024/05/avatar-maker-photo-to-cartoon.png',
            isDead: false,
            address: 'Hà Nội',
            desc: 'Chồng của Lê Thị AX',
        });

        const phamThiD = await personService.create({
            cccd: '8899001122',
            name: 'Phạm Thị D',
            gender: Gender.FEMALE,
            birth: new Date('1924-08-15'),
            avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3rzFZs0tioVeqNH0BKGWxnzfGNevCLpvoXN-vWtjvsjUl5gjNW6lXGyuD7AwJltJgoKk&usqp=CAU',
            isDead: false,
            address: 'Hà Nội',
            desc: 'Vợ của Lê Đình XX',
        });

        const spouseAXB = await spouseService.create({
            husband: tranVanB._id as any,
            wife: leThiAX._id as any,
            husbandOrder: 1,
            wifeOrder: 1,
            marriageDate: new Date('1940-05-20'),
        });

        const spouseXXD = await spouseService.create({
            husband: leDinhXX._id as any,
            wife: phamThiD._id as any,
            husbandOrder: 1,
            wifeOrder: 1,
            marriageDate: new Date('1945-10-10'),
        });

        // Generation 3 (Cháu)
        console.log('Creating Generation 3...');
        const tranVanE = await personService.create({
            cccd: '9900112233',
            name: 'Trần Văn E',
            gender: Gender.MALE,
            birth: new Date('1941-03-15'),
            avatar: 'https://www.cartoonize.net/wp-content/uploads/2024/05/avatar-maker-photo-to-cartoon.png',
            isDead: false,
            address: 'Hà Nội',
            desc: 'Con trai của Trần Văn B và Lê Thị AX',
        });

        const tranThiF = await personService.create({
            cccd: '0011223344',
            name: 'Trần Thị F',
            gender: Gender.FEMALE,
            birth: new Date('1943-07-20'),
            avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3rzFZs0tioVeqNH0BKGWxnzfGNevCLpvoXN-vWtjvsjUl5gjNW6lXGyuD7AwJltJgoKk&usqp=CAU',
            isDead: false,
            address: 'Hà Nội',
            desc: 'Con gái của Trần Văn B và Lê Thị AX',
        });

        const leDinhG = await personService.create({
            cccd: '1122334455',
            name: 'Lê Đình G',
            gender: Gender.MALE,
            birth: new Date('1946-11-05'),
            avatar: 'https://www.cartoonize.net/wp-content/uploads/2024/05/avatar-maker-photo-to-cartoon.png',
            isDead: false,
            address: 'Hà Nội',
            desc: 'Con trai của Lê Đình XX và Phạm Thị D',
        });

        await parentChildService.create({
            parent: spouseAXB._id as any,
            child: tranVanE._id as any,
            isAdopted: false,
        });

        await parentChildService.create({
            parent: spouseAXB._id as any,
            child: tranThiF._id as any,
            isAdopted: false,
        });

        await parentChildService.create({
            parent: spouseXXD._id as any,
            child: leDinhG._id as any,
            isAdopted: false,
        });

        console.log('✅ Seed completed successfully!');
        console.log(`
📊 Summary:
- Persons created: 10
- Spouse relationships: 4
- Parent-child relationships: 6
- Generations: 3
        `);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        throw error;
    } finally {
        await app.close();
    }
}

seed();

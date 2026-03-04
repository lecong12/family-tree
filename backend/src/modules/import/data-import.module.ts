import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DataImportService } from './import.service';
import { DataImportController as AdminImportController } from './import.controller';
import { PersonSchema } from '../person/schemas/person.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Person', schema: PersonSchema }]),
    // Thêm các schema ParentChild và Spouse tương tự ở đây
  ],
  controllers: [AdminImportController],
  providers: [DataImportService],
})
export class DataImportModule {}
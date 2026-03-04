import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DataImportService } from './data-import.service';
import { AdminImportController } from './data-import.controller';
import { PersonSchema } from '../person/schemas/person.schema'; // Kiểm tra lại đường dẫn schema của bạn

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Person', schema: PersonSchema }]),
    // Thêm các schema ParentChild và Spouse tương tự ở đây
  ],
  controllers: [AdminImportController],
  providers: [DataImportService],
})
export class DataImportModule {}
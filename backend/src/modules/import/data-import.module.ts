import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DataImportService } from './import.service';
import { DataImportController as AdminImportController } from './import.controller';
import { PersonSchema } from '../person/schemas/person.schema';
// Giả định bạn đã có các schema này, hãy import chúng từ đúng đường dẫn
import { ParentChildSchema } from 'src/schema/ParentChild.schema';
import { SpouseSchema } from 'src/schema/Spouse.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Person', schema: PersonSchema }]),
    MongooseModule.forFeature([{ name: 'ParentChild', schema: ParentChildSchema }]),
    MongooseModule.forFeature([{ name: 'Spouse', schema: SpouseSchema }]),
  ],
  controllers: [AdminImportController],
  providers: [DataImportService],
})
export class DataImportModule {}
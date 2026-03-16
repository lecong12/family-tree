import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PersonModule } from './modules/person/person.module';

@Module({
  imports: [PersonModule], // Import PersonModule để AdminController có thể inject PersonService
  controllers: [AdminController],
  providers: [],
})
export class AdminModule {}
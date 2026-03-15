import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PersonService } from './modules/person/person.service';

@Controller('admin') // -> Sẽ tạo prefix /api/v1/admin
export class AdminController {
  constructor(private readonly personService: PersonService) {}

  @Post('import/csv') // -> Sẽ tạo route /api/v1/admin/import/csv
  @UseInterceptors(FileInterceptor('file')) // 'file' phải khớp với key trong FormData của frontend
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    console.log('Backend đã nhận được file:', file.originalname);
    return this.personService.importFromCsv(file.buffer);
  }
}
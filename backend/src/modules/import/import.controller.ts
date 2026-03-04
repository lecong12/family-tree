import { 
  Controller, 
  Post, 
  UploadedFile, 
  BadRequestException,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataImportService } from './import.service';

@Controller('api/v1/admin/import')
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}
  @Post('csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Vui lòng chọn file CSV');
    return await this.dataImportService.importFamilyData(file.buffer);
  }
}
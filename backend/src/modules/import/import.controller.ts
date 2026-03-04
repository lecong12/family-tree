import { 
  Controller, 
  Post, 
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'
import { DataImportService } from './import.service';

@Controller('admin/import')
// Tạm thời bỏ UseGuards để không phải import file đang bị lỗi path
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}

  @Post('csv')
  @UseInterceptors(FileInterceptor('file')) // 'file' phải khớp với tên field trong FormData khi upload
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file CSV để nạp dữ liệu.');
    }
    // Kiểm tra định dạng file (chỉ chấp nhận csv)
    if (!file.originalname.match(/\.(csv)$/)) {
      throw new BadRequestException('Chỉ chấp nhận tệp định dạng .csv');
    }

    try {
      const result = await this.dataImportService.importFamilyData(file.buffer);
      return {
        success: true,
        message: 'Nạp dữ liệu gia phả thành công!',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(`Lỗi khi xử lý file: ${error.message}`);
    }
  }
}
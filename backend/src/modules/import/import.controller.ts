import { 
  Controller, 
  Post, 
  UploadedFile, 
  UseGuards, 
  BadRequestException,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'
import { DataImportService } from './import.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';     // Nếu bạn có dùng phân quyền Role
import { UserRoles } from '../../constants';

@Controller('admin/import')
@UseGuards(JwtAuthGuard, RolesGuard) // Bảo vệ API bằng JWT và kiểm tra quyền
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}

  @Post('csv')
  @Roles(UserRoles.ADMIN)
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
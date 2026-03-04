import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('admin') // -> Sẽ tạo prefix /api/v1/admin
export class AdminController {
  @Post('import/csv') // -> Sẽ tạo route /api/v1/admin/import/csv
  @UseInterceptors(FileInterceptor('file')) // 'file' phải khớp với key trong FormData của frontend
  importCsv(@UploadedFile() file: Express.Multer.File) {
    console.log('Backend đã nhận được file:', file.originalname);
    // Tại đây, bạn sẽ thêm logic để đọc và xử lý file CSV
    return { message: `File ${file.originalname} đã được nhận.` };
  }
}
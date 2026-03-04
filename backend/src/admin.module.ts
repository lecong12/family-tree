import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';

@Module({
  controllers: [AdminController],
  providers: [], // Thêm AdminService vào đây nếu bạn tạo service để xử lý logic
})
export class AdminModule {}
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  // Endpoint này được frontend dùng để kiểm tra nhanh trạng thái.
  // Nó được cấu hình để bỏ qua prefix 'api/v1' và trả lời tại đường dẫn gốc '/'.
  @Get() 
  healthCheck() {
    return { status: 'ok', message: 'Family Tree API is running!' };
  }

  // Thêm endpoint này để xử lý trường hợp frontend kiểm tra tại '/api/v1'.
  // Điều này giúp health check của frontend luôn thành công.
  @Get('api/v1')
  prefixedHealthCheck() { return this.healthCheck(); }
}

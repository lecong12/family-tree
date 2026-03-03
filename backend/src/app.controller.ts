import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck() {
    // This endpoint is used by the frontend for a quick status check.
    return { status: 'ok', message: 'Family Tree API is running!' };
  }
}

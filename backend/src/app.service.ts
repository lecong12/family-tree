import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello! Family Tree API is running. Go to <a href="/api/docs">/api/docs</a> to see the API.';
  }
}

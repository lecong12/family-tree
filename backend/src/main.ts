import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // SỬA LỖI: Đặt cấu hình CORS lên đầu tiên.
    // Điều này đảm bảo mọi yêu cầu (bao gồm cả yêu cầu 'OPTIONS' phức tạp khi upload file)
    // đều được xử lý đúng quy tắc CORS trước khi đi vào các logic khác.
    // Đây là giải pháp cho lỗi "lỗi mạng" (Failed to fetch) khi frontend gọi API.
    app.enableCors({
        origin: [
            'https://family-tree-frontend-mu.vercel.app', // Domain production của Frontend
            'http://localhost:3000', // Domain khi chạy Frontend ở máy local
        ],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT') || 9999;

    app.useGlobalPipes(
        new ValidationPipe({
            //! setup global validation pipe
            whitelist: true, //TODO: remove any other fields that are not in the DTO
            forbidNonWhitelisted: true, //TODO: throw an error when any other fields that are not in the DTO
        }),
    );
    app.setGlobalPrefix('api/v1', {
        exclude: [
            { path: '/', method: RequestMethod.GET },
            { path: 'api/v1', method: RequestMethod.GET }, // Exclude the health check
        ],
    });

    // Swagger setup
    const config = new DocumentBuilder()
        .setTitle('Family Tree API')
        .setDescription('API documentation for Family Tree application')
        .setVersion('1.0')
        .addBearerAuth() // Thêm nút Authorize để test JWT token trên Swagger
        .build();
    const document = SwaggerModule.createDocument(app as any, config);
    SwaggerModule.setup('api/docs', app as any, document);

    await app.listen(port);
    console.log(`🚀 Backend application is running on: http://localhost:${port}`);
}
bootstrap();

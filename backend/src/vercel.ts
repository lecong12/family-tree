import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';

let cachedServer: any;

async function bootstrap() {
    if (!cachedServer) {
        const server = express();

        const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

        // 1. Enable CORS ngay lập tức để tránh lỗi chặn truy cập từ Frontend
        app.enableCors({
            origin: true,
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            credentials: true,
        });

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
            }),
        );
        
        // Exclude root path '/' from prefix to avoid 404 on health checks if needed
        app.setGlobalPrefix('api/v1', {
            exclude: [{ path: '/', method: RequestMethod.GET }],
        });

        const config = new DocumentBuilder()
            .setTitle('Family Tree API')
            .setDescription('API documentation for Family Tree application')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, config);
        // Đặt Swagger tại /api/docs. Lưu ý: Vercel rewrite /api/docs -> backend.
        SwaggerModule.setup('api/docs', app, document);

        await app.init();
        cachedServer = server;
    }
    return cachedServer;
}

export default async function (req: any, res: any) {
    try {
        const server = await bootstrap();
        server(req, res);
    } catch (error) {
        console.error('❌ NestJS Bootstrap Error:', error);
        // 2. Thêm Header CORS thủ công cho response lỗi để Frontend đọc được nội dung lỗi
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
        res.status(500).send({
            message: 'Server Initialization Error',
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
    }
}
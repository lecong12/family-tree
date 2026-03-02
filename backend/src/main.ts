import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    // Route kiểm tra nhanh server tại /api/v1 (cho môi trường Local)
    app.getHttpAdapter().getInstance().get('/api/v1', (req: any, res: any) => {
        res.json({ status: 'ok', message: 'Family Tree API is running!' });
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT');

    app.useGlobalPipes(
        new ValidationPipe({
            //! setup global validation pipe
            whitelist: true, //TODO: remove any other fields that are not in the DTO
            forbidNonWhitelisted: true, //TODO: throw an error when any other fields that are not in the DTO
        }),
    );
    app.setGlobalPrefix('api/v1', {
        exclude: [{ path: '/', method: RequestMethod.GET }],
    });

    //Config Cors
    const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    app.enableCors({
        origin: [frontendUrl, 'https://family-tree-frontend-git-main-lecong12s-projects.vercel.app'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
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

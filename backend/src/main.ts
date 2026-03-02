import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
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
        exclude: [{ path: 'api', method: RequestMethod.GET }]
    });

    //Config Cors
    app.enableCors({
        origin: true, // Cho phép tất cả origin trong giai đoạn development/test. Khi production ổn định nên set cụ thể lại.
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
}
bootstrap();

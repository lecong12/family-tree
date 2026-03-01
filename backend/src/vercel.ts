import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';

const server = express();

async function bootstrap() {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );
    app.setGlobalPrefix('api/v1');

    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    const config = new DocumentBuilder()
        .setTitle('Family Tree API')
        .setDescription('API documentation for Family Tree application')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
}

let isInitialized = false;

export default async function (req: any, res: any) {
    if (!isInitialized) {
        try {
            await bootstrap();
            isInitialized = true;
        } catch (error) {
            console.error('❌ NestJS Bootstrap Error:', error);
            res.status(500).send({
                message: 'Server Initialization Error',
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            return;
        }
    }
    server(req, res);
}
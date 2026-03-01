import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as express from 'express';

const server = express();
let appPromise: Promise<any>;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  // Enable CORS to prevent "White Screen" on Frontend
  app.enableCors({
    origin: '*', // In production, replace '*' with your frontend domain (e.g., https://your-app.vercel.app)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Set global prefix to 'api' to match Frontend configuration
  app.setGlobalPrefix('api');

  await app.init();
  return app;
}

// Export the handler for Vercel Serverless Function
export default async (req, res) => {
  if (!appPromise) {
    appPromise = bootstrap();
  }
  await appPromise;
  server(req, res);
};
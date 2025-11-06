import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create Nest application context without HTTP server
  await NestFactory.createApplicationContext(AppModule);
  // The Bull processors will be initialized via decorators
  // Keep process alive
}

void bootstrap();

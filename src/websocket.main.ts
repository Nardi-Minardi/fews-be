import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.WS_PORT || 3014);
  await app.listen(port, '0.0.0.0');
  // WebsocketGateway is mounted under /ws namespace
  // This process exposes only the websocket, but API routes also exist unless separated; in compose, use a dedicated image/cmd.
}

void bootstrap();

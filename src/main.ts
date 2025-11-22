import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Naikkan limit body request jadi 50 MB
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Logger
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // Global CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Authorization',
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Access-Control-Request-Method',
    ],
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Setup OpenAPI config
  const config = new DocumentBuilder()
    .setTitle('FFEWFMS-BE API Documentation')
    .setDescription(
      `
      # FFEWFMS-BE API Documentation
      `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'Bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Serve OpenAPI JSON for Scalar at /api/v1/api-json
  app.getHttpAdapter().get('/api/v1/api-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(document));
  });

  // ✅ Scalar UI Documentation
  app.getHttpAdapter().get('/api/v1/docs', (req, res) => {
    const html = `
    <!doctype html>
    <html>
      <head>
        <title>FFEWFMS-BE API Documentation</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <script
          id="api-reference"
          data-url="/api/v1/api-json"
          data-configuration='{
            "theme": "kepler",
            "layout": "modern",
            "customCss": ".scalar-app { font-family: Inter, sans-serif; --scalar-color-1: #b6921dff; --scalar-color-2: #c98c1bff; }"
          }'></script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest"></script>
      </body>
    </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  const port = Number(process.env.PORT);
  await app.listen(port, '0.0.0.0');
  console.log(
    `Application is running on: http://localhost:${port} (WS at /ws)`,
  );
}
void bootstrap();

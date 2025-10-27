import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('AHU PPNS API')
    .setDescription('API documentation for AHU PPNS application')
    .setVersion('1.0')
    .addBearerAuth()
    // penting → supaya Scalar/Swagger tahu base URL
    .addServer('https://portal-ahu.bht.co.id/api/v1/ppns')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI resmi → /api/v1/ppns/docs-swagger
  SwaggerModule.setup('docs-swagger', app, document);

  // Serve raw OpenAPI JSON di /api/v1/ppns/api-json
  app.getHttpAdapter().get('/api-json', (req, res) => {
    res.json(document);
  });

  // Scalar UI → /api/v1/ppns/docs
  app.getHttpAdapter().get('/docs', (req, res) => {
    const html = `
    <!doctype html>
    <html>
      <head>
        <title>AHU PPNS API Documentation</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>body { margin: 0; padding: 0; }</style>
      </head>
      <body>
        <script
          id="api-reference"
          data-url="/api/v1/ppns/api-json"
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

  await app.listen(process.env.PORT || 3013, '0.0.0.0');
}
void bootstrap();

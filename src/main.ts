import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  app.enableCors({
    origin: true, // TODO: development only
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

  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
    } else {
      next();
    }
  });

  // Setup OpenAPI config
  const config = new DocumentBuilder()
    .setTitle('AHU PPNS API')
    .setDescription('API documentation for AHU PPNS application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Serve OpenAPI JSON for Scalar
  app.use('/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(JSON.stringify(document, null, 2));
  });

  // ✅ Setup Scalar UI Documentation dengan HTML manual
  app.use('/docs', (req, res) => {
    const html = `
    <!doctype html>
    <html>
      <head>
        <title>AHU PPNS API Documentation</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <script
          id="api-reference"
          data-url="/openapi.json"
          data-configuration='{
            "theme": "kepler",
            "layout": "modern",
            "customCss": ".scalar-app { font-family: Inter, sans-serif; --scalar-color-1: #d39232ff; --scalar-color-2: #db8d26ff; }"
          }'></script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest"></script>
      </body>
    </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  console.log('✅ Scalar UI documentation available at /docs');

  // Start server on port 3011
  await app.listen(process.env.PORT || 3013, '0.0.0.0');
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3013}`,
  );
}
void bootstrap();

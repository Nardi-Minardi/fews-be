import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Logger
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // Global CORS
  app.enableCors({
    origin: true, // TODO: batasi di production
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
    .setTitle('FEWS Multi-Monitor Dashboard API')
    .setDescription(
      `
      # FEWS (Flood Early Warning System) API

      ## 🔐 Authentication
      Sistem menggunakan JWT Bearer Token authentication. 

      ### Default Test Accounts:
      - **Admin**: username \`admin\`, password \`admin123\`
      - **Operator**: username \`operator_jabar\`, password \`operator123\`  
      - **User**: username \`user_bandung\`, password \`user123\`

      ### How to authenticate:
      1. Call POST /auth/login dengan credentials
      2. Copy \`access_token\` dari response
      3. Click "Authorize" button di atas dan paste token
      4. Format: \`Bearer your_access_token_here\`

      ## 📊 Role-Based Access:
      - **Admin**: Full access ke semua endpoints
      - **Operator**: Read/write dashboard & sensors, read users  
      - **User**: Read-only access ke dashboard & sensors

      ## 🌊 WebSocket Real-time:
      - Connect ke \`ws://localhost:${process.env.PORT}/ws\`
      - Real-time sync antar multiple monitors
      - Auto sensor updates setiap 30 detik
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
      'JWT-auth',
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
        <title>FEWS Documentation</title>
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
    `Application is running on: http://localhost:${port}`,
  );
}
void bootstrap();

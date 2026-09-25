import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { RequestMethod, ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { loadConfig } from "@imizi/config";
import { HttpExceptionFilter } from "./common/http-exception.filter";

async function bootstrap() {
  const config = loadConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false, rawBody: true });
  app.use(helmet());
  app.enableCors({
    origin: [
      process.env.APP_URL ?? "http://localhost:3000",
      process.env.ADMIN_URL ?? "http://localhost:3002",
      "http://localhost:8081",
    ],
    credentials: true,
  });
  app.setGlobalPrefix(config.apiPrefix.replace(/^\//, ""), {
    exclude: [
      { path: "health", method: RequestMethod.GET },
      { path: "ready", method: RequestMethod.GET },
      { path: "live", method: RequestMethod.GET },
      { path: "metrics", method: RequestMethod.GET },
    ],
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const swagger = new DocumentBuilder()
    .setTitle("Imizi API")
    .setDescription("Real estate marketplace, booking, payments, maps, messaging, and property operations.")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swagger), {
    useGlobalPrefix: false,
  });

  await app.listen(config.port);
}

bootstrap();

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ZodError } from "zod";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly log = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const requestId = (req.headers?.["x-request-id"] as string) ?? "unknown";

    if (exception instanceof ZodError) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Request failed validation",
        requestId,
        details: exception.flatten(),
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      return res.status(status).json({
        code: status === 401 ? "UNAUTHENTICATED" : status === 403 ? "FORBIDDEN" : "HTTP_ERROR",
        message: typeof body === "string" ? body : (body as { message?: string }).message ?? exception.message,
        requestId,
      });
    }

    this.log.error(exception);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: "INTERNAL",
      message: "Unexpected error",
      requestId,
    });
  }
}

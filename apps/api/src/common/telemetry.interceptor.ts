import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { randomBytes } from "crypto";
import { Observable, finalize } from "rxjs";

function hex(bytes:number){return randomBytes(bytes).toString("hex");}
function ns(date:number){return String(Math.round(date*1_000_000));}

@Injectable()
export class TelemetryInterceptor implements NestInterceptor{
  intercept(context:ExecutionContext,next:CallHandler):Observable<unknown>{
    const started=performance.now();
    const req=context.switchToHttp().getRequest();
    const res=context.switchToHttp().getResponse();
    const traceparent=String(req.headers?.traceparent??"");
    const traceId=/^[0-9a-f]{32}-[0-9a-f]{16}-/.test(traceparent)?traceparent.slice(0,32):hex(16);
    const spanId=hex(8);
    const endpoint=process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    return next.handle().pipe(finalize(()=>{
      res.setHeader?.("trace-id",traceId);
      if(!endpoint)return;
      const durationMs=performance.now()-started;
      const now=Date.now();
      const startNs=ns(now-durationMs);
      const endNs=ns(now);
      void fetch(endpoint.replace(//$/,"")+"/v1/traces",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({resourceSpans:[{resource:{attributes:[
          {key:"service.name",value:{stringValue:process.env.OTEL_SERVICE_NAME??"imizi-api"}},
          {key:"deployment.environment",value:{stringValue:process.env.NODE_ENV??"development"}},
        ]},scopeSpans:[{scope:{name:"imizi-api",version:"1.0.0"},spans:[{
          traceId,spanId,name:String(req.method)+" "+String(req.route?.path??req.url),kind:2,
          startTimeUnixNano:startNs,endTimeUnixNano:endNs,
          attributes:[
            {key:"http.method",value:{stringValue:String(req.method)}},
            {key:"http.target",value:{stringValue:String(req.originalUrl??req.url)}},
            {key:"http.status_code",value:{intValue:Number(res.statusCode??200)}},
            {key:"http.duration_ms",value:{doubleValue:durationMs}},
            {key:"request.id",value:{stringValue:String(req.headers?.["x-request-id"]??"")}},
          ],
        }]}]}]}),
        signal:AbortSignal.timeout(2000),
      }).catch(()=>{});
    }));
  }
}

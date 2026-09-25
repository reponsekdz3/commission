import { loadConfig } from "@imizi/config";

export async function reportSentry(error:unknown,context:Record<string,unknown>={}){
  const dsn=loadConfig().sentryDsn;
  if(!dsn)return;
  try{
    const url=new URL(dsn);
    const publicKey=url.username;
    const project=url.pathname.replace(/^\//,"");
    const endpoint="https://"+url.host+"/api/"+project+"/store/?sentry_version=7&sentry_key="+encodeURIComponent(publicKey)+"&sentry_client=imizi-api";
    const exception=error instanceof Error?{type:error.name,value:error.message,stacktrace:{frames:[]}}:{type:"Error",value:String(error)};
    await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
      event_id:crypto.randomUUID().replace(/-/g,""),
      timestamp:Date.now()/1000,
      platform:"node",level:"error",
      exception:{values:[exception]},
      tags:{service:"imizi-api",environment:process.env.NODE_ENV??"development"},
      extra:context,
    }),signal:AbortSignal.timeout(2500)});
  }catch{}
}

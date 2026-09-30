const http = require("http");
const crypto = require("crypto");

const KEY = "imizi", SECRET = "imizi_secret", HOST = "localhost", PORT = 9000, REGION = "us-east-1";

function sha256(d){ return crypto.createHash("sha256").update(d).digest("hex"); }
function hmac(k,d){ return crypto.createHmac("sha256",k).update(d).digest(); }

function signedReq(method, bucket, qs, body){
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g,"").slice(0,15)+"Z";
  const ds = amzDate.slice(0,8);
  const ph = sha256(body);
  const host = HOST+":"+PORT;
  const ch = "host:"+host+"\nx-amz-content-sha256:"+ph+"\nx-amz-date:"+amzDate+"\n";
  const sh = "host;x-amz-content-sha256;x-amz-date";
  const path = "/"+bucket+(qs?"?"+qs:"");
  const cr = method+"\n/"+bucket+"\n"+(qs||"")+"\n"+ch+"\n"+sh+"\n"+ph;
  const scope = ds+"/"+REGION+"/s3/aws4_request";
  const sts = "AWS4-HMAC-SHA256\n"+amzDate+"\n"+scope+"\n"+sha256(cr);
  const sk = hmac(hmac(hmac(hmac("AWS4"+SECRET,ds),REGION),"s3"),"aws4_request");
  const sig = hmac(sk,sts).toString("hex");
  return {
    path, method, body,
    headers:{
      "Host":host,"x-amz-date":amzDate,"x-amz-content-sha256":ph,
      "Authorization":"AWS4-HMAC-SHA256 Credential="+KEY+"/"+scope+", SignedHeaders="+sh+", Signature="+sig,
      "Content-Length":Buffer.byteLength(body)
    }
  };
}

function req(method, bucket, qs, body){
  return new Promise((res, rej) => {
    const r = signedReq(method, bucket, qs, body);
    const q = http.request({hostname:HOST,port:PORT,path:r.path,method:r.method,headers:r.headers}, resp => {
      let d=""; resp.on("data",c=>d+=c); resp.on("end",()=>res({status:resp.statusCode,body:d}));
    });
    q.on("error",rej); q.end(r.body);
  });
}

async function main(){
  for(const b of ["imizi-public","imizi-private"]){
    const r = await req("PUT",b,"","");
    if(r.status===200||r.status===409) console.log("Bucket "+b+": "+(r.status===409?"exists":"created"));
    else { console.error("FAILED "+b+": "+r.status+" "+r.body); process.exit(1); }
  }
  const policy = JSON.stringify({Version:"2012-10-17",Statement:[{Effect:"Allow",Principal:"*",Action:"s3:GetObject",Resource:"arn:aws:s3:::imizi-public/*"}]});
  const pr = await req("PUT","imizi-public","policy",policy);
  console.log("Policy: HTTP "+(pr.status===204||pr.status===200?"OK":pr.status+" "+pr.body));
  console.log("MinIO buckets ready.");
}
main().catch(e=>{console.error(e.message);process.exit(1);});

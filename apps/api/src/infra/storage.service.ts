import { BadRequestException, Injectable } from "@nestjs/common";
import { createHash, createHmac } from "crypto";
import { loadConfig } from "@imizi/config";

function awsEncode(value:string) {
  return encodeURIComponent(value).replace(/[!'()*]/g,(c)=>"%"+c.charCodeAt(0).toString(16).toUpperCase());
}
function canonicalPath(key:string) {
  return key.split("/").map((part)=>awsEncode(part)).join("/");
}
function hmac(key:Buffer|string,data:string) {
  return createHmac("sha256",key).update(data).digest();
}

@Injectable()
export class StorageService {
  private readonly config=loadConfig();

  private assertConfigured() {
    if(!this.config.s3Endpoint||!this.config.s3AccessKey||!this.config.s3SecretKey) {
      throw new BadRequestException("S3-compatible storage is not configured");
    }
  }

  presignedPut(key:string,contentType:string,expiresSeconds=900) {
    this.assertConfigured();
    if(key.includes("..")) throw new BadRequestException("Invalid storage key");
    const endpoint=new URL(this.config.s3Endpoint!);
    const bucket=key.startsWith("private/") ? this.config.s3BucketPrivate : this.config.s3BucketPublic;
    const objectKey=key.replace(/^private\//,"").replace(/^public\//,"");
    const host=endpoint.host;
    const path="/"+canonicalPath(bucket+"/"+objectKey);
    const now=new Date();
    const amzDate=now.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
    const shortDate=amzDate.slice(0,8);
    const credentialScope=shortDate+"/"+this.config.s3Region+"/s3/aws4_request";
    const credential=this.config.s3AccessKey+"/"+credentialScope;
    const query:Record<string,string>={
      "X-Amz-Algorithm":"AWS4-HMAC-SHA256",
      "X-Amz-Credential":credential,
      "X-Amz-Date":amzDate,
      "X-Amz-Expires":String(expiresSeconds),
      "X-Amz-SignedHeaders":"host",
    };
    const queryString=Object.keys(query).sort().map((k)=>awsEncode(k)+"="+awsEncode(query[k])).join("&");
    const canonicalHeaders="host:"+host+"\n";
    const canonicalRequest=["PUT",path,queryString,canonicalHeaders,"host","UNSIGNED-PAYLOAD"].join("\n");
    const stringToSign=["AWS4-HMAC-SHA256",amzDate,credentialScope,createHash("sha256").update(canonicalRequest).digest("hex")].join("\n");
    const kDate=hmac("AWS4"+this.config.s3SecretKey,shortDate);
    const kRegion=hmac(kDate,this.config.s3Region);
    const kService=hmac(kRegion,"s3");
    const kSigning=hmac(kService,"aws4_request");
    query["X-Amz-Signature"]=createHmac("sha256",kSigning).update(stringToSign).digest("hex");
    const finalQuery=Object.keys(query).sort().map((k)=>awsEncode(k)+"="+awsEncode(query[k])).join("&");
    return {uploadUrl:new URL(path+"?"+finalQuery,endpoint).toString(),bucket,key:objectKey,headers:{"Content-Type":contentType},expiresIn:expiresSeconds};
  }

  publicUrl(bucket:string,key:string) {
    if(this.config.cdnBaseUrl) return this.config.cdnBaseUrl.replace(/\/$/,"")+"/"+key.split("/").map(encodeURIComponent).join("/");
    return new URL("/"+canonicalPath(bucket+"/"+key),this.config.s3Endpoint ?? "http://localhost:9000").toString();
  }
}

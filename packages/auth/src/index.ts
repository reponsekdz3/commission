import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { ROLES, type Role } from "@imizi/types";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Decode(input:string):Buffer{
  const normalized=input.replace(/=+$/,"").replace(/\s+/g,"").toUpperCase();
  let bits=0,value=0;const out:number[]=[];
  for(const ch of normalized){const idx=ALPHABET.indexOf(ch);if(idx<0)throw new Error("Invalid base32 secret");value=(value<<5)|idx;bits+=5;if(bits>=8){bits-=8;out.push((value>>bits)&0xff);}}
  return Buffer.from(out);
}
export function generateTotpSecret(length=20):string{
  const bytes=randomBytes(length);let output="";
  for(let i=0;i<bytes.length;i+=5){const chunk=bytes.subarray(i,i+5);let buffer=0;for(const b of chunk)buffer=(buffer<<8)|b;const available=chunk.length*8;const groups=Math.ceil(available/5);for(let g=0;g<groups;g++){const shift=Math.max(0,available-5*(g+1));output+=ALPHABET[(buffer>>shift)&31];}}
  return output.slice(0,Math.ceil(length*8/5));
}
export function totp(secret:string,timestamp=Date.now(),stepSeconds=30,digits=6):string{
  const key=base32Decode(secret);const counter=Math.floor(timestamp/1000/stepSeconds);const bytes=Buffer.alloc(8);bytes.writeBigUInt64BE(BigInt(counter));
  const digest=createHmac("sha1",key).update(bytes).digest();const offset=digest[digest.length-1]&0x0f;const binary=((digest[offset]&0x7f)<<24)|(digest[offset+1]<<16)|(digest[offset+2]<<8)|digest[offset+3];
  return String(binary%(10**digits)).padStart(digits,"0");
}
export function verifyTotp(secret:string,code:string,window=1):boolean{
  const normalized=code.trim();if(!/^\d{6}$/.test(normalized))return false;
  for(let drift=-window;drift<=window;drift++){const expected=totp(secret,Date.now()+drift*30_000);const a=Buffer.from(expected),b=Buffer.from(normalized);if(a.length===b.length&&timingSafeEqual(a,b))return true;}
  return false;
}
export function otpauthUrl(secret:string,account:string,issuer="Imizi"){
  const label=encodeURIComponent(issuer+":"+account);
  return "otpauth://totp/"+label+"?secret="+encodeURIComponent(secret)+"&issuer="+encodeURIComponent(issuer)+"&algorithm=SHA1&digits=6&period=30";
}
export { ROLES, type Role };

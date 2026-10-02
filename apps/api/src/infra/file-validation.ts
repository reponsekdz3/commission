export function matchesMagic(buffer:Buffer,contentType:string):boolean{
  const type=contentType.split(";")[0].trim().toLowerCase();
  if(type==="image/jpeg")return buffer.length>=3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff;
  if(type==="image/png")return buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if(type==="image/webp")return buffer.length>=12&&buffer.toString("ascii",0,4)==="RIFF"&&buffer.toString("ascii",8,12)==="WEBP";
  if(type==="image/gif")return buffer.toString("ascii",0,6)==="GIF87a"||buffer.toString("ascii",0,6)==="GIF89a";
  if(type==="application/pdf")return buffer.toString("ascii",0,5)==="%PDF-";
  if(type==="video/mp4"||type==="video/quicktime")return buffer.length>=12&&buffer.toString("ascii",4,8)==="ftyp";
  if(type==="video/webm")return buffer.length>=4&&buffer.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));
  if(type==="audio/mpeg")return buffer.toString("ascii",0,3)==="ID3"||(buffer.length>=2&&(buffer[0]===0xff)&&((buffer[1]&0xe0)===0xe0));
  if(type==="audio/wav"||type==="audio/x-wav")return buffer.length>=12&&buffer.toString("ascii",0,4)==="RIFF"&&buffer.toString("ascii",8,12)==="WAVE";
  if(type==="text/plain")return !buffer.subarray(0,Math.min(buffer.length,4096)).some(b=>b===0);
  return false;
}

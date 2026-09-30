const http = require("http");
const crypto = require("crypto");

const ACCESS_KEY = "imizi";
const SECRET_KEY = "imizi_secret";
const ENDPOINT = "localhost";
const PORT = 9000;
const REGION = "us-east-1";

function sha256hex(data) { return crypto.createHash("sha256").update(data).digest("hex"); }
function hmacSha256(key, data) { return crypto.createHmac("sha256", key).update(data).digest(); }

function sign(method, bucket, path, body = "") {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g,"").slice(0,15)+"Z";
  const dateStamp = amzDate.slice(0,8);
  const host = `${ENDPOINT}:${PORT}`;
  const payloadHash = sha256hex(body);
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalUri = "/" + bucket + path;
  const canonicalRequest = `${method}\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credScope = `${dateStamp}/${REGION}/s3/aws4_request`;
  const strToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credScope}\n${sha256hex(canonicalRequest)}`;
  const sigKey = hmacSha256(hmacSha256(hmacSha256(hmacSha256("AWS4"+SECRET_KEY, dateStamp), REGION), "s3"), "aws4_request");
  const sig = hmacSha256(sigKey, strToSign).toString("hex");
  return {
    "Authorization": `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
    "Host": host
  };
}

function request(method, bucket, path, body = "") {
  return new Promise((resolve, reject) => {
    const headers = sign(method, bucket, path, body);
    if (body) headers["Content-Length"] = Buffer.byteLength(body);
    const opts = { hostname: ENDPOINT, port: PORT, path: "/"+bucket+path, method, headers };
    const req = http.request(opts, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.end(body);
  });
}

async function main() {
  for (const bucket of ["imizi-public", "imizi-private"]) {
    const r = await request("PUT", bucket, "");
    if (r.status === 200 || r.status === 409) console.log(`Bucket ${bucket}: ${r.status === 409 ? "already exists" : "created"}`);
    else { console.error(`Failed to create ${bucket}: ${r.status} ${r.body}`); process.exit(1); }
  }
  // Set public read policy on imizi-public
  const policy = JSON.stringify({ Version:"2012-10-17", Statement:[{ Effect:"Allow", Principal:"*", Action:"s3:GetObject", Resource:"arn:aws:s3:::imizi-public/*" }] });
  const pr = await request("PUT", "imizi-public", "?policy", policy);
  if (pr.status === 204 || pr.status === 200) console.log("Set public read policy");
  else console.log("Policy set:", pr.status, pr.body);
  console.log("MinIO buckets ready.");
}
main().catch(e => { console.error(e.message); process.exit(1); });

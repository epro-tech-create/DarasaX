import "server-only";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const R2_PREFIX = "r2:";

function config() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const Bucket = process.env.R2_BUCKET_NAME;
  if (!endpoint || !accessKeyId || !secretAccessKey || !Bucket)
    throw new Error("File storage is not configured. Contact your administrator.");
  return { Bucket, client: new S3Client({ region: "auto", endpoint,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" }) };
}

export function materialKey(path: string, stream: string, id: string) {
  const key = path.slice(R2_PREFIX.length);
  if (!path.startsWith(R2_PREFIX) || !key.startsWith(`${stream}/${id}/`) || key.split("/").some(p => !p || p === "." || p === ".."))
    throw new Error("Invalid material file location.");
  return key;
}

export async function uploadUrl(key: string, contentType: string, size: number) {
  const { client, Bucket } = config();
  return getSignedUrl(client, new PutObjectCommand({ Bucket, Key: key,
    ContentType: contentType, ContentLength: size }), {
    expiresIn: 3600, signableHeaders: new Set(["content-type", "content-length"]),
  });
}

export async function readUrl(key: string, filename: string, download = false) {
  const { client, Bucket } = config();
  const safeName = filename.replace(/[\r\n"\\]/g, "_");
  return getSignedUrl(client, new GetObjectCommand({ Bucket, Key: key,
    ResponseContentDisposition: `${download ? "attachment" : "inline"}; filename="download"; filename*=UTF-8''${encodeURIComponent(safeName).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16)}`)}`,
  }), { expiresIn: 60 });
}

export async function removeObject(key: string) {
  const { client, Bucket } = config();
  await client.send(new DeleteObjectCommand({ Bucket, Key: key }));
}

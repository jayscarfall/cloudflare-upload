import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import mime from "mime";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Configuration with environment variable support
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = "sf2-assets";
const R2_PUBLIC_DOMAIN = undefined;
const UPLOAD_DIR = "./dist";
const PREFIX = "jay-test/";

// ---- client ----
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ---- helpers ----
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function relKey(fullPath) {
  const rel = path
    .relative(path.resolve(UPLOAD_DIR), fullPath)
    .replaceAll("\\", "/");
  return `${PREFIX}${rel}`;
}

async function putWithRetry(params, maxRetries = 3) {
  let attempt = 0;
  // simple exponential backoff
  while (true) {
    try {
      return await s3.send(new PutObjectCommand(params));
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) throw err;
      const delay = 300 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function uploadFile(fullPath) {
  const Key = relKey(fullPath);
  const Body = fs.createReadStream(fullPath);
  const ContentType =
    mime.getType(path.extname(fullPath)) || "application/octet-stream";

  await putWithRetry({
    Bucket: R2_BUCKET,
    Key,
    Body,
    ContentType,
    // Cache-Control is important for static assets; tweak as needed:
    CacheControl: "public, max-age=31536000, immutable",
  });

  const url = R2_PUBLIC_DOMAIN
    ? `https://${R2_PUBLIC_DOMAIN}/${Key}`
    : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${Key}`;

  return { Key, url };
}

async function run() {
  const root = path.resolve(UPLOAD_DIR);
  if (!fs.existsSync(root)) {
    console.error(`Upload directory not found: ${root}`);
    process.exit(1);
  }

  const files = walk(root);
  if (files.length === 0) {
    console.log("No files found to upload.");
    return;
  }
  console.log(
    `Found ${files.length} files. Uploading to r2://${R2_BUCKET}/${PREFIX}`
  );

  // simple concurrency pool
  const CONCURRENCY = 8;
  let i = 0,
    ok = 0,
    fail = 0;

  async function worker() {
    while (i < files.length) {
      const idx = i++;
      const f = files[idx];
      try {
        const { Key, url } = await uploadFile(f);
        ok++;
        console.log(
          `[${ok}/${files.length}] uploaded: ${Key}${
            R2_PUBLIC_DOMAIN ? ` -> ${url}` : ""
          }`
        );
      } catch (e) {
        fail++;
        console.error(`FAILED ${f}:`, e?.message || e);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`Done. Success: ${ok}, Failed: ${fail}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

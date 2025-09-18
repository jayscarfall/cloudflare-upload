import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Configuration with environment variable support
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = "sf2-assets";
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

async function deleteFilesInPath(prefix) {
  try {
    console.log(`Deleting existing files in path: ${prefix}`);

    // List all objects with the given prefix
    const listParams = {
      Bucket: R2_BUCKET,
      Prefix: prefix,
    };

    const listCommand = new ListObjectsV2Command(listParams);
    const listResponse = await s3.send(listCommand);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log("No existing files found to delete.");
      return;
    }

    console.log(`Found ${listResponse.Contents.length} files to delete.`);

    // Delete each object
    const deletePromises = listResponse.Contents.map(async (object) => {
      const deleteParams = {
        Bucket: R2_BUCKET,
        Key: object.Key,
      };

      try {
        await s3.send(new DeleteObjectCommand(deleteParams));
        console.log(`Deleted: ${object.Key}`);
        return { success: true, key: object.Key };
      } catch (error) {
        console.error(`Failed to delete ${object.Key}:`, error.message);
        return { success: false, key: object.Key, error: error.message };
      }
    });

    const results = await Promise.all(deletePromises);
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`Delete completed. Success: ${successful}, Failed: ${failed}`);
  } catch (error) {
    console.error("Error during deletion:", error.message);
    throw error;
  }
}

// Run delete
deleteFilesInPath(PREFIX).catch((error) => {
  console.error("Delete operation failed:", error);
  process.exit(1);
});

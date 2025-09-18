# Cloudflare R2 Upload Script

A Node.js script for uploading files to Cloudflare R2 storage with support for Cache Reserve optimization.

## Features

- ✅ **ES Module Support** - Modern JavaScript with import/export syntax
- ✅ **Batch Upload** - Upload multiple files concurrently
- ✅ **Retry Logic** - Automatic retry with exponential backoff
- ✅ **Cache Reserve Ready** - Optimized for Cloudflare Cache Reserve
- ✅ **MIME Type Detection** - Automatic content type detection
- ✅ **Progress Tracking** - Real-time upload progress
- ✅ **Error Handling** - Comprehensive error reporting

## Prerequisites

- Node.js v14+ (ES modules support)
- Cloudflare R2 account and credentials
- Cloudflare Cache Reserve enabled (optional, for optimal performance)

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual credentials
nano .env
```

## Configuration

### Method 1: Environment Variables (Recommended)

Create a `.env` file in the project root:

```bash
# .env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
```

### Method 2: Direct Configuration

Edit the configuration variables in `index.js`:

```javascript
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "your-account-id";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "your-access-key-id";
const R2_SECRET_ACCESS_KEY =
  process.env.R2_SECRET_ACCESS_KEY || "your-secret-access-key";
```

### Getting Cloudflare R2 Credentials

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **R2 Object Storage** > **Manage R2 API tokens**
3. Create a new API token with R2 permissions
4. Copy the Account ID, Access Key ID, and Secret Access Key

## Usage

1. Place your files in the `./dist` directory (or change `UPLOAD_DIR` in your `.env` file)
2. Run the script with your desired operation:

```bash
# Upload only (no deletion)
npm run upload
# or
node upload.js

# Delete files from R2 bucket only
npm run delete
# or
node delete.js

# Delete existing files and then upload new ones
npm run clean-upload
```

### Example Output

```
Found 3 files. Uploading to r2://my-bucket/Dev/Android/
[1/3] uploaded: Dev/Android/image1.jpg
[2/3] uploaded: Dev/Android/image2.png
[3/3] uploaded: Dev/Android/document.pdf
Done. Success: 3, Failed: 0
```

## Cache Reserve Optimization

This script is optimized for Cloudflare Cache Reserve with:

- **Content-Length Header** - Required for Cache Reserve eligibility
- **Long TTL** - 1-year cache duration (`max-age=31536000`)
- **Immutable Assets** - Prevents unnecessary revalidation
- **Proper MIME Types** - Ensures correct content handling

### Cache Reserve Requirements

For files to be eligible for Cache Reserve, they must:

- ✅ Be cacheable
- ✅ Have TTL ≥ 10 hours (this script uses 1 year)
- ✅ Include Content-Length header (automatically added)
- ✅ Not be image transformations

## Configuration Options

| Variable               | Description                | Default  |
| ---------------------- | -------------------------- | -------- |
| `R2_ACCOUNT_ID`        | Your Cloudflare account ID | Required |
| `R2_ACCESS_KEY_ID`     | R2 API access key          | Required |
| `R2_SECRET_ACCESS_KEY` | R2 API secret key          | Required |

## Advanced Usage

### Environment Variables

You can use environment variables instead of hardcoded values:

```javascript
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
```

### Custom Concurrency

Modify the `CONCURRENCY` variable to adjust upload speed:

```javascript
const CONCURRENCY = 16; // Increase for faster uploads
```

### Custom Cache Headers

Modify cache behavior in the `uploadFile` function:

```javascript
CacheControl: "public, max-age=31536000, immutable",
```

## File Structure

```
cloudflare-upload/
├── upload.js         # Upload-only script
├── delete.js         # Delete-only script
├── package.json      # Dependencies and metadata
├── .gitignore        # Git ignore rules
├── README.md         # This file
├── .env.example      # Environment variables template
├── .env              # Your environment variables (not tracked)
└── dist/             # Upload directory (your files go here)
```

## Error Handling

The script includes:

- **Retry Logic** - 3 attempts with exponential backoff
- **Concurrent Uploads** - 8 parallel uploads by default
- **Progress Tracking** - Real-time success/failure counts
- **Detailed Logging** - Clear error messages and progress updates

## Troubleshooting

### Common Issues

1. **"require is not defined"** - Make sure you're using Node.js v14+ and the script uses ES modules
2. **"Access Denied"** - Check your R2 credentials and bucket permissions
3. **"Bucket not found"** - Verify the bucket name and account ID
4. **Files not in Cache Reserve** - Ensure Cache Reserve is enabled in your Cloudflare dashboard

### Debug Mode

Add logging to see detailed request information:

```javascript
console.log("Uploading:", {
  Bucket: R2_BUCKET,
  Key,
  ContentType,
  ContentLength,
});
```

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues related to:

- **Cloudflare R2** - Check [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- **Cache Reserve** - See [Cache Reserve Guide](https://developers.cloudflare.com/cache/advanced-configuration/cache-reserve/)
- **This Script** - Open an issue in this repository

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';

interface StorageOptions {
  file: Buffer | Uint8Array | NodeJS.ReadableStream;
  fileName: string;
  contentType: string;
  bucket?: string;
}

interface StorageResult {
  url: string;
  key: string;
  size: number;
}

class StorageService {
  private static client: S3Client;

  private static hasR2Config() {
    return Boolean(
      process.env.R2_ENDPOINT &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET
    );
  }

  private static getPublicBaseUrl() {
    const vercelUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined;
    const baseUrl =
      process.env.PUBLIC_APP_URL ||
      process.env.PUBLIC_URL ||
      process.env.NEXTAUTH_URL ||
      vercelUrl ||
      `http://localhost:${process.env.PORT || 3002}`;

    return baseUrl.replace(/\/$/, '');
  }

  private static getLocalUploadRoot() {
    return path.join(process.cwd(), 'uploads');
  }

  static initialize() {
    if (!StorageService.hasR2Config()) {
      throw new Error('R2 env vars not set.');
    }

    StorageService.client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: false, // R2 uses virtual-hosted style
    });
  }

  static async storeFile(options: StorageOptions): Promise<StorageResult> {
    const sanitizedFileName = options.fileName.replace(/\\/g, '/').replace(/[^a-zA-Z0-9._/-]/g, '_');
    const body = Buffer.isBuffer(options.file)
      ? options.file
      : options.file instanceof Uint8Array
        ? Buffer.from(options.file)
        : null;

    if (!body) {
      throw new Error('Local storage only supports buffer uploads.');
    }

    if (!StorageService.hasR2Config()) {
      const relativeKey = `${Date.now()}-${sanitizedFileName}`.replace(/^\/+/, '');
      const localPath = path.join(StorageService.getLocalUploadRoot(), relativeKey);
      await mkdir(path.dirname(localPath), { recursive: true });
      await writeFile(localPath, body);

      return {
        url: `${StorageService.getPublicBaseUrl()}/uploads/${relativeKey.replace(/\\/g, '/')}`,
        key: `local/${relativeKey.replace(/\\/g, '/')}`,
        size: body.length,
      };
    }

    if (!StorageService.client) {
      StorageService.initialize();
    }

    const key = `uploads/${Date.now()}-${sanitizedFileName}`;
    const bucket = process.env.R2_BUCKET!;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: options.contentType,
      CacheControl: 'public, max-age=31536000', // 1 year
    });

    try {
      await StorageService.client.send(command);

      // Get public URL (R2 public bucket)
      const publicUrl = `https://${bucket}.${process.env.R2_PUBLIC_HOSTNAME || process.env.R2_ENDPOINT!.split('//')[1].split('/')[0]}/${key}`;

      return {
        url: publicUrl,
        key,
        size: body.length,
      };
    } catch (error: any) {
      console.error('R2 upload error:', error);
      throw new Error('Failed to store file in R2');
    }
  }

  static async deleteFile(key: string): Promise<boolean> {
    if (key.startsWith('local/')) {
      try {
        const localPath = path.join(StorageService.getLocalUploadRoot(), key.replace(/^local\//, ''));
        await unlink(localPath);
        return true;
      } catch (error: any) {
        console.error('Local delete error:', error);
        return false;
      }
    }

    if (!StorageService.client) {
      StorageService.initialize();
    }

    const bucket = process.env.R2_BUCKET!;
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    try {
      await StorageService.client.send(command);
      return true;
    } catch (error: any) {
      console.error('R2 delete error:', error);
      return false;
    }
  }

  static async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (key.startsWith('local/')) {
      return `${StorageService.getPublicBaseUrl()}/uploads/${key.replace(/^local\//, '')}`;
    }

    if (!StorageService.client) {
      StorageService.initialize();
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
    });

    const url = await getSignedUrl(StorageService.client, command, { expiresIn });
    return url;
  }
}

export default StorageService;


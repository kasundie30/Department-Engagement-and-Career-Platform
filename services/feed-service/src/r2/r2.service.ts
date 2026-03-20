import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

/**
 * Cloudflare R2 storage service (S3-compatible).
 * Required env vars:
 *   R2_ACCOUNT_ID       — Cloudflare account ID
 *   R2_ACCESS_KEY_ID    — R2 API token access key
 *   R2_SECRET_ACCESS_KEY — R2 API token secret key
 *   R2_BUCKET_NAME      — R2 bucket name
 *   R2_PUBLIC_URL       — Public URL prefix, e.g. https://pub-xxx.r2.dev
 */
@Injectable()
export class R2Service {
    private readonly logger = new Logger(R2Service.name);
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly publicUrl: string;

    constructor() {
        const accountId = process.env.R2_ACCOUNT_ID || '';
        this.bucket = process.env.R2_BUCKET_NAME || 'miniproject';
        this.publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

        this.client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
            },
        });
    }

    async statObject(objectName: string): Promise<{ exists: boolean; size: number; contentType: string }> {
        try {
            const result = await this.client.send(
                new HeadObjectCommand({ Bucket: this.bucket, Key: objectName }),
            );
            return {
                exists: true,
                size: result.ContentLength ?? 0,
                contentType: result.ContentType ?? '',
            };
        } catch {
            return { exists: false, size: 0, contentType: '' };
        }
    }

    async uploadFile(buffer: Buffer, mimetype: string): Promise<string> {
        const ext = mimetype.split('/')[1] || 'bin';
        const objectName = `posts/${uuidv4()}.${ext}`;
        try {
            await this.client.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: objectName,
                    Body: buffer,
                    ContentType: mimetype,
                }),
            );
            return this.publicUrl
                ? `${this.publicUrl}/${objectName}`
                : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${this.bucket}/${objectName}`;
        } catch (e) {
            this.logger.error(`[feed-service] R2 upload failed: ${e.message}`);
            throw new ServiceUnavailableException('Image storage is temporarily unavailable');
        }
    }
}

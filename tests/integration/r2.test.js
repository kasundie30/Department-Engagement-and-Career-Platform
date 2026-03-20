/**
 * Integration Test: Cloudflare R2 Object Storage
 *
 * Verifies that the Cloudflare R2 bucket is accessible using the S3-compatible API.
 * Loads credentials from services/feed-service/.env
 * Does NOT require any local services to be running.
 *
 * What it tests:
 *  1. All R2 env vars are present (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)
 *  2. S3Client can list objects in the bucket
 *  3. A small test object can be uploaded and then deleted
 */
const { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const { loadEnv } = require('../utils/env-loader');

const envPath = path.resolve(__dirname, '../../services/feed-service/.env');

describe('Cloudflare R2 Integration Tests', () => {
  let env;
  let s3Client;

  beforeAll(() => {
    env = loadEnv(envPath);
    console.log(`R2 Account ID: ${env.R2_ACCOUNT_ID}`);
    console.log(`R2 Bucket: ${env.R2_BUCKET_NAME}`);
    console.log(`R2 Public URL: ${env.R2_PUBLIC_URL}`);

    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  });

  test('All required R2 environment variables are set in feed-service .env', () => {
    expect(env.R2_ACCOUNT_ID).toBeTruthy();
    expect(env.R2_ACCESS_KEY_ID).toBeTruthy();
    expect(env.R2_SECRET_ACCESS_KEY).toBeTruthy();
    expect(env.R2_BUCKET_NAME).toBeTruthy();
    expect(env.R2_PUBLIC_URL).toBeTruthy();

    expect(env.R2_BUCKET_NAME).toBe('decp-co528');
    expect(env.R2_PUBLIC_URL).toContain(env.R2_ACCOUNT_ID);

    console.log('✅ All R2 env vars present and valid');
  });

  test('R2 env vars are also set in research-service .env', () => {
    const researchEnv = loadEnv(path.resolve(__dirname, '../../services/research-service/.env'));
    expect(researchEnv.R2_ACCOUNT_ID).toBe(env.R2_ACCOUNT_ID);
    expect(researchEnv.R2_ACCESS_KEY_ID).toBe(env.R2_ACCESS_KEY_ID);
    expect(researchEnv.R2_BUCKET_NAME).toBe(env.R2_BUCKET_NAME);
    console.log('✅ research-service R2 env vars match feed-service');
  });

  test('Can list objects in the R2 bucket (bucket is accessible)', async () => {
    const command = new ListObjectsV2Command({
      Bucket: env.R2_BUCKET_NAME,
      MaxKeys: 5,
    });

    const response = await s3Client.send(command);

    expect(response.$metadata.httpStatusCode).toBe(200);
    expect(response.Name).toBe(env.R2_BUCKET_NAME);
    expect(Array.isArray(response.Contents || [])).toBe(true);

    const count = response.Contents?.length || 0;
    console.log(`✅ R2 bucket "${env.R2_BUCKET_NAME}" accessible: ${count} object(s) listed`);
  });

  test('Can upload a small test object and delete it (write permissions work)', async () => {
    const testKey = `test/integration-test-${Date.now()}.txt`;
    const testContent = Buffer.from(`DECP integration test at ${new Date().toISOString()}`);

    // Upload
    const putCommand = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    });
    const putResponse = await s3Client.send(putCommand);
    expect(putResponse.$metadata.httpStatusCode).toBe(200);
    console.log(`  ✅ Uploaded test object: ${testKey}`);

    // Delete
    const delCommand = new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: testKey,
    });
    const delResponse = await s3Client.send(delCommand);
    expect(delResponse.$metadata.httpStatusCode).toBe(204);
    console.log(`  ✅ Deleted test object: ${testKey}`);

    console.log('✅ R2 upload + delete round-trip successful');
  });
});

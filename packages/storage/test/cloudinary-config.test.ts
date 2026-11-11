import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { CloudinaryStorageAdapter } from '../dist/index.js';

describe('CloudinaryStorageAdapter Configuration Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.CLOUDINARY_URL;
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('1. should successfully initialize with a valid CLOUDINARY_URL passed in config', () => {
    const adapter = new CloudinaryStorageAdapter({
      cloudinaryUrl: 'cloudinary://123456789012345:mySecretKey@sample_cloud',
    });

    assert.strictEqual(adapter.getCloudName(), 'sample_cloud');
    assert.strictEqual(process.env.CLOUDINARY_URL, 'cloudinary://123456789012345:mySecretKey@sample_cloud');
  });

  it('2. should successfully initialize with process.env.CLOUDINARY_URL', () => {
    process.env.CLOUDINARY_URL = 'cloudinary://987654321098765:anotherSecret@env_cloud';
    const adapter = new CloudinaryStorageAdapter();

    assert.strictEqual(adapter.getCloudName(), 'env_cloud');
  });

  it('3. should sanitize accidental angle brackets from placeholder copy-pasting', () => {
    const adapter = new CloudinaryStorageAdapter({
      cloudinaryUrl: 'cloudinary://<458138942789388>:<VnzNeUaMtkSZqQiQeU051l5oqr4>@lggovb15',
    });

    assert.strictEqual(adapter.getCloudName(), 'lggovb15');
    assert.strictEqual(process.env.CLOUDINARY_URL, 'cloudinary://458138942789388:VnzNeUaMtkSZqQiQeU051l5oqr4@lggovb15');
  });

  it('4. should throw a clear descriptive error when CLOUDINARY_URL is missing', () => {
    assert.throws(
      () => new CloudinaryStorageAdapter(),
      /CLOUDINARY_URL is missing/i,
    );
  });

  it('5. should throw a clear error when CLOUDINARY_URL does not start with cloudinary://', () => {
    assert.throws(
      () => new CloudinaryStorageAdapter({ cloudinaryUrl: 'https://api.cloudinary.com/v1_1/mycloud' }),
      /must begin with "cloudinary:\/\/"/i,
    );
  });

  it('6. should reject "Root" as an invalid cloud name', () => {
    assert.throws(
      () => new CloudinaryStorageAdapter({ cloudinaryUrl: 'cloudinary://1234567890:secret@Root' }),
      /"Root" is an invalid cloud_name/i,
    );

    assert.throws(
      () => new CloudinaryStorageAdapter({ cloudinaryUrl: 'cloudinary://1234567890:secret@root' }),
      /"Root" is an invalid cloud_name/i,
    );
  });

  it('7. should throw a clear error when api_key or api_secret is missing from the URL', () => {
    assert.throws(
      () => new CloudinaryStorageAdapter({ cloudinaryUrl: 'cloudinary://@my_cloud' }),
      /missing api_key or api_secret/i,
    );

    assert.throws(
      () => new CloudinaryStorageAdapter({ cloudinaryUrl: 'cloudinary://onlyKey@my_cloud' }),
      /missing api_key or api_secret/i,
    );
  });

  it('8. should cleanly purge legacy environment variables so they cannot override CLOUDINARY_URL', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'Root';
    process.env.CLOUDINARY_API_KEY = 'legacyKey';
    process.env.CLOUDINARY_API_SECRET = 'legacySecret';
    process.env.CLOUDINARY_URL = 'cloudinary://111222333444555:correctSecret@legitimate_cloud';

    const adapter = new CloudinaryStorageAdapter();

    assert.strictEqual(adapter.getCloudName(), 'legitimate_cloud');
    assert.strictEqual(process.env.CLOUDINARY_CLOUD_NAME, undefined);
    assert.strictEqual(process.env.CLOUDINARY_API_KEY, undefined);
    assert.strictEqual(process.env.CLOUDINARY_API_SECRET, undefined);
  });

  it('9. should generate signed temporary download URL correctly with configured credentials', async () => {
    const adapter = new CloudinaryStorageAdapter({
      cloudinaryUrl: 'cloudinary://458138942789388:VnzNeUaMtkSZqQiQeU051l5oqr4@lggovb15',
    });

    const signedUrl = await adapter.getSignedUrl('documents/test-material.pdf', 300);
    assert.ok(signedUrl.includes('lggovb15'));
    assert.ok(signedUrl.includes('signature='));
    assert.ok(signedUrl.includes('api.cloudinary.com/v1_1/lggovb15/raw/download'));
  });
});

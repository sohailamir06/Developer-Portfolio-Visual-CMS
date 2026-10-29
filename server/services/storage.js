import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { imageSize } from 'image-size';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { badRequest } from '../utils/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.resolve(env.MEDIA_LOCAL_DIR || path.resolve(__dirname, '../uploads'));

// Allowed types, identified by their file signature rather than the client-declared MIME type.
// SVG is intentionally excluded because it can carry scripts.
const SIGNATURES = [
  { mime: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/gif', ext: 'gif', test: (b) => b.subarray(0, 4).toString('ascii') === 'GIF8' },
  { mime: 'image/webp', ext: 'webp', test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
  { mime: 'image/avif', ext: 'avif', test: (b) => b.subarray(4, 12).toString('ascii') === 'ftypavif' },
  { mime: 'application/pdf', ext: 'pdf', test: (b) => b.subarray(0, 5).toString('ascii') === '%PDF-' },
];

export const ALLOWED_MIME = SIGNATURES.map((s) => s.mime);

export function detectFileType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  return SIGNATURES.find((s) => s.test(buffer)) || null;
}

if (env.MEDIA_PROVIDER === 'cloudinary') {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function readDimensions(buffer, mime) {
  if (!mime.startsWith('image/')) return {};
  try {
    const { width, height } = imageSize(buffer);
    return { width, height };
  } catch {
    return {};
  }
}

const localProvider = {
  async save(file, type) {
    const now = new Date();
    const dir = path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
    const name = `${crypto.randomBytes(12).toString('hex')}.${type.ext}`;
    await fs.mkdir(path.join(UPLOAD_DIR, dir), { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, dir, name), file.buffer, { flag: 'wx' });
    const key = `${dir}/${name}`.replace(/\\/g, '/');
    return { storageKey: key, url: `/uploads/${key}` };
  },
  async remove(media) {
    const target = path.resolve(UPLOAD_DIR, media.storageKey);
    if (!target.startsWith(UPLOAD_DIR + path.sep)) return; // never delete outside the upload directory
    await fs.rm(target, { force: true });
  },
};

const cloudinaryProvider = {
  save(file, type) {
    const resourceType = type.mime === 'application/pdf' ? 'raw' : 'image';
    return new Promise((resolve, reject) => {
      // Signed server-side upload: the API secret never leaves the server.
      const stream = cloudinary.uploader.upload_stream(
        { folder: env.CLOUDINARY_FOLDER, resource_type: resourceType, use_filename: false, unique_filename: true },
        (err, result) => {
          if (err) return reject(Object.assign(new Error(`Cloudinary upload failed: ${err.message}`), { status: 502 }));
          resolve({ storageKey: `${resourceType}:${result.public_id}`, url: result.secure_url });
        },
      );
      stream.end(file.buffer);
    });
  },
  async remove(media) {
    const [resourceType, publicId] = media.storageKey.split(/:(.+)/);
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  },
};

const providers = { local: localProvider, cloudinary: cloudinaryProvider };

export const activeProvider = () => env.MEDIA_PROVIDER;

export async function storeUpload(file) {
  const type = detectFileType(file.buffer);
  if (!type) throw badRequest('Unsupported file type. Upload a JPEG, PNG, GIF, WebP, AVIF image or a PDF.');
  const saved = await providers[env.MEDIA_PROVIDER].save(file, type);
  return {
    ...saved,
    provider: env.MEDIA_PROVIDER,
    mimeType: type.mime,
    size: file.size,
    ...readDimensions(file.buffer, type.mime),
  };
}

export async function deleteStoredFile(media) {
  await providers[media.provider]?.remove(media);
}

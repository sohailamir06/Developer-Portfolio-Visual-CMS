import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const bool = z
  .union([z.boolean(), z.string()])
  .transform((v) => v === true || v === 'true' || v === '1');

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(5050),
    MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//, 'must be a mongodb:// or mongodb+srv:// URI'),
    MONGODB_TEST_URI: optionalString,
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    ADMIN_URL: optionalString,
    SESSION_SECRET: z.string().min(32, 'must be at least 32 characters'),
    SESSION_TTL_HOURS: z.coerce.number().positive().default(12),
    MEDIA_PROVIDER: z.enum(['local', 'cloudinary']).default('local'),
    MEDIA_MAX_FILE_MB: z.coerce.number().positive().max(50).default(5),
    MEDIA_LOCAL_DIR: optionalString,
    CLOUDINARY_CLOUD_NAME: optionalString,
    CLOUDINARY_API_KEY: optionalString,
    CLOUDINARY_API_SECRET: optionalString,
    CLOUDINARY_FOLDER: z.string().default('portfolio'),
    SMTP_HOST: optionalString,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: bool.default(false),
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    CONTACT_NOTIFY_TO: optionalString,
    CONTACT_NOTIFY_FROM: optionalString,
    RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().positive().default(10),
    RATE_LIMIT_CONTACT_MAX: z.coerce.number().int().positive().default(5),
    TRUST_PROXY: bool.default(false),
  })
  .superRefine((env, ctx) => {
    if (env.MEDIA_PROVIDER === 'cloudinary') {
      for (const key of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
        if (!env[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'required when MEDIA_PROVIDER=cloudinary' });
      }
    }
  });

const raw = { ...process.env };
if (raw.NODE_ENV === 'test' && raw.MONGODB_TEST_URI) raw.MONGODB_URI = raw.MONGODB_TEST_URI;

const parsed = schema.safeParse(raw);
if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
  // Fail fast: the server must not boot with an invalid configuration.
  console.error(`\nInvalid environment configuration (see .env.example):\n${lines.join('\n')}\n`);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  clientOrigins: parsed.data.CLIENT_URL.split(',').map((s) => s.trim().replace(/\/$/, '')),
  isProd: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  smtpEnabled: Boolean(parsed.data.SMTP_HOST && parsed.data.CONTACT_NOTIFY_TO),
};

export const siteUrl = env.clientOrigins[0];

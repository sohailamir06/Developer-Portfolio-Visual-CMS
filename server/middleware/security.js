import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/** Recursively drop keys that could be interpreted as MongoDB operators or paths. */
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object' && !(value instanceof Buffer)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.') || k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      out[k] = clean(v);
    }
    return out;
  }
  return value;
}

export function mongoSanitize(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  // Express 5 exposes req.query as a getter, so redefine it with the cleaned copy.
  Object.defineProperty(req, 'query', { value: clean({ ...req.query }), writable: true, configurable: true });
  next();
}

const limiterMessage = (message) => ({
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: { message } }),
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.RATE_LIMIT_LOGIN_MAX,
  skipSuccessfulRequests: true,
  ...limiterMessage('Too many login attempts. Please wait 15 minutes and try again.'),
});

export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.RATE_LIMIT_CONTACT_MAX,
  ...limiterMessage('Too many messages sent. Please try again later.'),
});

// Analytics pings: generous, but stops one client inflating the numbers.
export const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  ...limiterMessage('Too many requests.'),
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  ...limiterMessage('Too many requests. Please slow down.'),
});

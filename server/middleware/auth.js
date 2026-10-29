import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { forbidden, unauthorized } from '../utils/errors.js';

export const SESSION_COOKIE = 'pf_session';

export const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'lax',
  path: '/',
  maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
});

/** The CSRF token lives inside the signed session and is handed to the SPA via /api/auth/me (kept in memory only). */
export function issueSession(res, user) {
  const csrf = crypto.randomBytes(24).toString('hex');
  const token = jwt.sign({ sub: user.id, role: user.role, csrf }, env.SESSION_SECRET, {
    expiresIn: `${env.SESSION_TTL_HOURS}h`,
  });
  res.cookie(SESSION_COOKIE, token, cookieOptions());
  return csrf;
}

export function clearSession(res) {
  const { maxAge: _maxAge, ...opts } = cookieOptions();
  res.clearCookie(SESSION_COOKIE, opts);
}

export async function requireAuth(req, _res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) throw unauthorized();
  let payload;
  try {
    payload = jwt.verify(token, env.SESSION_SECRET);
  } catch {
    throw unauthorized('Your session has expired. Please sign in again.');
  }
  const user = await User.findById(payload.sub);
  if (!user || user.status !== 'active') throw unauthorized('Account is not active');
  req.user = user;
  req.session = payload;
  next();
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireCsrf(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const header = String(req.get('x-csrf-token') || '');
  const expected = String(req.session?.csrf || '');
  const ok =
    header.length === expected.length &&
    expected.length > 0 &&
    crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  if (!ok) throw forbidden('Invalid or missing CSRF token. Refresh the page and try again.');
  next();
}

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user?.role)) throw forbidden();
    next();
  };

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import DailyStat from '../models/DailyStat.js';
import { env } from '../config/env.js';
import { SESSION_COOKIE } from '../middleware/auth.js';

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|monitor|curl|wget|python-requests/i;
const today = (d = new Date()) => d.toISOString().slice(0, 10);

const isSignedIn = (req) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return false;
  try {
    jwt.verify(token, env.SESSION_SECRET);
    return true;
  } catch {
    return false;
  }
};

/** Public: count one page view or CV download. Always answers 204 so it never affects the visitor. */
export async function track(req, res) {
  const { kind, path } = req.body;
  const ua = String(req.get('user-agent') || '');
  // Skip bots, people who opted out (Do Not Track / GPC) and the site owner's own visits.
  const optedOut = req.get('dnt') === '1' || req.get('sec-gpc') === '1';
  if (!BOT_RE.test(ua) && !optedOut && !isSignedIn(req)) {
    await DailyStat.updateOne({ day: today(), kind, path }, { $inc: { count: 1 } }, { upsert: true });
  }
  res.status(204).end();
}

/** Admin: daily views, totals vs the previous period, top pages. */
export async function summary(req, res) {
  const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const prevStart = new Date(start);
  prevStart.setUTCDate(prevStart.getUTCDate() - days);

  const rows = await DailyStat.find({ day: mongoose.trusted({ $gte: today(prevStart) }) }).lean();
  const inRange = rows.filter((r) => r.day >= today(start));
  const prev = rows.filter((r) => r.day < today(start));
  const sum = (list, kind) => list.filter((r) => r.kind === kind).reduce((n, r) => n + r.count, 0);

  const series = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = today(d);
    series.push({
      date: key,
      views: inRange.filter((r) => r.day === key && r.kind === 'view').reduce((n, r) => n + r.count, 0),
      resumeDownloads: inRange.filter((r) => r.day === key && r.kind === 'resume').reduce((n, r) => n + r.count, 0),
    });
  }

  const byPath = new Map();
  for (const r of inRange.filter((x) => x.kind === 'view')) byPath.set(r.path, (byPath.get(r.path) || 0) + r.count);
  const topPages = [...byPath.entries()].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 8);

  res.json({
    days,
    series,
    totals: { views: sum(inRange, 'view'), resumeDownloads: sum(inRange, 'resume') },
    previous: { views: sum(prev, 'view'), resumeDownloads: sum(prev, 'resume') },
    topPages,
  });
}

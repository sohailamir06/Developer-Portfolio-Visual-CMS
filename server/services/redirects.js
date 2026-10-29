import Redirect from '../models/Redirect.js';

/**
 * Called when a public URL changes. Points the old path at the new one, re-targets any
 * existing redirects that pointed at the old path (avoids chains) and removes a redirect
 * that would now shadow the new live path.
 */
export async function recordPathChange(oldPath, newPath) {
  if (!oldPath || oldPath === newPath) return;
  await Redirect.deleteOne({ from: newPath });
  await Redirect.updateMany({ to: oldPath }, { $set: { to: newPath } });
  await Redirect.findOneAndUpdate(
    { from: oldPath },
    { $set: { to: newPath, statusCode: 301, auto: true } },
    { upsert: true },
  );
}

export async function resolveRedirect(path) {
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path;
  const hit = await Redirect.findOneAndUpdate({ from: clean }, { $inc: { hits: 1 } }, { new: true }).lean();
  return hit ? { to: hit.to, statusCode: hit.statusCode } : null;
}

export const pagePath = (slug) => (slug === 'home' ? '/' : `/${slug}`);
export const projectPath = (slug) => `/projects/${slug}`;

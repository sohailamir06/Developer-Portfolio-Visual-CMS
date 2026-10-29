import mongoose from 'mongoose';
import Revision from '../models/Revision.js';

const KEEP_PER_DOCUMENT = 50;

/** Store an immutable snapshot of content and prune very old history. */
export async function recordRevision({ contentType, contentId, snapshot, author, action = 'publish', note = '' }) {
  const last = await Revision.findOne({ contentType, contentId }).sort({ version: -1 }).select('version').lean();
  const version = (last?.version || 0) + 1;
  const rev = await Revision.create({
    contentType,
    contentId,
    version,
    action,
    note,
    author,
    snapshot: JSON.parse(JSON.stringify(snapshot)),
  });

  const stale = await Revision.find({ contentType, contentId })
    .sort({ version: -1 })
    .skip(KEEP_PER_DOCUMENT)
    .select('_id')
    .lean();
  if (stale.length) await Revision.deleteMany({ _id: mongoose.trusted({ $in: stale.map((r) => r._id) }) });
  return rev;
}

export function listRevisions(contentType, contentId) {
  return Revision.find({ contentType, contentId })
    .sort({ version: -1 })
    .select('-snapshot')
    .populate('author', 'name email')
    .lean();
}

import mongoose from 'mongoose';

// Privacy-friendly analytics: only an aggregated counter per day, event kind and path.
// No IP addresses, cookies, user agents or other personal data are stored.
const dailyStatSchema = new mongoose.Schema(
  {
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // UTC date
    kind: { type: String, required: true, enum: ['view', 'resume'] },
    path: { type: String, required: true, maxlength: 200 },
    count: { type: Number, default: 0 },
  },
  { versionKey: false },
);

dailyStatSchema.index({ day: 1, kind: 1, path: 1 }, { unique: true });

export default mongoose.model('DailyStat', dailyStatSchema);

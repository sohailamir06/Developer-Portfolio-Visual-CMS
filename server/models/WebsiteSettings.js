import mongoose from 'mongoose';

// Singleton document (key: "site"). Its shape is enforced by validators/settings.js;
// stored as a flexible sub-document so new options don't need a migration.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'site', unique: true, immutable: true },
    siteTitle: { type: String, required: true },
    tagline: { type: String, default: '' },
    logo: { type: mongoose.Schema.Types.Mixed, default: {} },
    favicon: { type: String, default: '' },
    theme: { type: mongoose.Schema.Types.Mixed, default: {} },
    contact: { type: mongoose.Schema.Types.Mixed, default: {} },
    social: { type: [mongoose.Schema.Types.Mixed], default: [] },
    header: { type: mongoose.Schema.Types.Mixed, default: {} },
    footer: { type: mongoose.Schema.Types.Mixed, default: {} },
    seo: { type: mongoose.Schema.Types.Mixed, default: {} },
    resume: { type: mongoose.Schema.Types.Mixed, default: {} },
    version: { type: Number, default: 0 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, minimize: false },
);

export default mongoose.model('WebsiteSettings', settingsSchema);

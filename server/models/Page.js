import mongoose from 'mongoose';
import { seoFields, SLUG_RE } from './shared.js';

export const PAGE_TYPES = ['home', 'about', 'projects', 'skills', 'experience', 'contact', 'resume', 'custom'];

// Sections are validated by the zod registry in /sections before they are stored.
const sectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    visible: { type: Boolean, default: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    style: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false, minimize: false },
);

const contentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    seo: { type: seoFields, default: () => ({}) },
    sections: { type: [sectionSchema], default: [] },
  },
  { _id: false, minimize: false },
);

const pageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: SLUG_RE },
    pageType: { type: String, enum: PAGE_TYPES, default: 'custom' },
    // Draft and published content are stored separately: saving a draft never touches `published`.
    draft: { type: contentSchema, required: true },
    published: { type: contentSchema, default: null },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    hasUnpublishedChanges: { type: Boolean, default: true },
    version: { type: Number, default: 0 },
    publishedAt: Date,
    draftSavedAt: Date,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, minimize: false },
);

pageSchema.index({ status: 1, slug: 1 });

export default mongoose.model('Page', pageSchema);

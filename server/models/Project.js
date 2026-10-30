import mongoose from 'mongoose';
import { imageFields, seoFields, SLUG_RE } from './shared.js';

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: SLUG_RE },
    summary: { type: String, default: '', maxlength: 500 },
    content: { type: String, default: '' },
    featuredImage: { type: imageFields, default: () => ({}) },
    gallery: { type: [imageFields], default: [] },
    technologies: { type: [String], default: [] },
    category: { type: String, default: '', trim: true, maxlength: 60 },
    role: { type: String, default: '', trim: true, maxlength: 120 }, // e.g. “Team lead — frontend”
    year: { type: String, default: '', trim: true, maxlength: 20 },
    highlights: { type: [String], default: [] }, // key results, e.g. “Cut load time by 40%”
    demoUrl: { type: String, default: '' },
    repoUrl: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    order: { type: Number, default: 0 },
    seo: { type: seoFields, default: () => ({}) },
    publishedAt: Date,
  },
  { timestamps: true },
);

projectSchema.index({ status: 1, order: 1 });
projectSchema.index({ status: 1, featured: 1 });

export default mongoose.model('Project', projectSchema);

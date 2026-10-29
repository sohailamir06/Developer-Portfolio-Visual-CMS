import mongoose from 'mongoose';

export const seoFields = new mongoose.Schema(
  {
    title: { type: String, default: '', maxlength: 120 },
    description: { type: String, default: '', maxlength: 320 },
    image: { type: String, default: '' },
    canonical: { type: String, default: '' },
    noindex: { type: Boolean, default: false },
  },
  { _id: false },
);

export const imageFields = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    alt: { type: String, default: '', maxlength: 300 },
    caption: { type: String, default: '', maxlength: 300 },
  },
  { _id: false },
);

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

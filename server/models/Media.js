import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, maxlength: 255 },
    provider: { type: String, enum: ['local', 'cloudinary'], required: true },
    storageKey: { type: String, required: true }, // local relative path or Cloudinary public_id
    url: { type: String, required: true },
    alt: { type: String, default: '', maxlength: 300 },
    caption: { type: String, default: '', maxlength: 300 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    width: Number,
    height: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

mediaSchema.index({ originalName: 'text', alt: 'text', caption: 'text' });
mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ url: 1 }, { unique: true });

export default mongoose.model('Media', mediaSchema);

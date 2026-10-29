import mongoose from 'mongoose';

const revisionSchema = new mongoose.Schema(
  {
    contentType: { type: String, required: true, enum: ['page', 'project', 'settings', 'navigation'] },
    contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    version: { type: Number, required: true },
    action: { type: String, enum: ['publish', 'update', 'restore'], default: 'publish' },
    note: { type: String, default: '', maxlength: 200 },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false }, minimize: false },
);

revisionSchema.index({ contentType: 1, contentId: 1, version: -1 }, { unique: true });

export default mongoose.model('Revision', revisionSchema);

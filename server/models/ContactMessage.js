import mongoose from 'mongoose';

export const MESSAGE_STATUSES = ['new', 'read', 'replied', 'archived', 'spam'];

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    subject: { type: String, default: '', trim: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 5000 },
    status: { type: String, enum: MESSAGE_STATUSES, default: 'new' },
    ipHash: { type: String, select: false },
    userAgent: { type: String, maxlength: 300 },
    notified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

contactMessageSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('ContactMessage', contactMessageSchema);

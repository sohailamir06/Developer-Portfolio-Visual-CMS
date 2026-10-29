import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, required: true, trim: true, maxlength: 60, default: 'Other' },
    // Either a Lucide icon name (e.g. "Database") or an image URL.
    icon: { type: String, default: '', maxlength: 2048 },
    proficiencyLabel: { type: String, default: '', maxlength: 40 },
    proficiency: { type: Number, min: 0, max: 100, default: null },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

skillSchema.index({ visible: 1, category: 1, order: 1 });
skillSchema.index({ name: 1, category: 1 }, { unique: true });

export default mongoose.model('Skill', skillSchema);

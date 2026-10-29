import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true, maxlength: 60 },
    url: { type: String, required: true, maxlength: 2048 },
    newTab: { type: Boolean, default: false },
    parentId: { type: String, default: null },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { _id: false },
);

const navigationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, enum: ['main', 'footer'] },
    items: { type: [itemSchema], default: [] },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export default mongoose.model('Navigation', navigationSchema);

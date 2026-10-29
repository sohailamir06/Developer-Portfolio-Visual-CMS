import mongoose from 'mongoose';

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true, maxlength: 150 },
    companyUrl: { type: String, default: '' },
    position: { type: String, required: true, trim: true, maxlength: 150 },
    location: { type: String, default: '', maxlength: 120 },
    employmentType: { type: String, default: '', maxlength: 60 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    current: { type: Boolean, default: false },
    description: { type: String, default: '' },
    responsibilities: { type: [String], default: [] },
    technologies: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

experienceSchema.index({ visible: 1, order: 1 });

export default mongoose.model('Experience', experienceSchema);

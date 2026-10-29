import mongoose from 'mongoose';

const redirectSchema = new mongoose.Schema(
  {
    from: { type: String, required: true, unique: true, trim: true, match: /^\/[^\s]*$/ },
    to: { type: String, required: true, trim: true },
    statusCode: { type: Number, enum: [301, 302], default: 301 },
    auto: { type: Boolean, default: false }, // created automatically when a slug changed
    hits: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model('Redirect', redirectSchema);

import mongoose from 'mongoose';

const albumSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    privacy: { type: String, enum: ['public', 'friends', 'private', 'custom'], default: 'public', index: true },
    coverUrl: { type: String },
    // system albums like profile/cover
    isSystem: { type: Boolean, default: false, index: true },
    systemType: { type: String, enum: ['profile', 'cover', null], default: null },
  },
  { timestamps: true }
);

albumSchema.index({ user: 1, name: 1 }, { unique: true });

export const Album = mongoose.model('Album', albumSchema);


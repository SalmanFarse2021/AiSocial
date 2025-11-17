import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    media: {
      url: { type: String, required: true },
      width: Number,
      height: Number,
      format: String,
      type: { type: String, enum: ['image', 'video'], default: 'image' },
    },
    expiresAt: { type: Date, required: true },
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: { type: String }, // store emoji string like '❤️', '😂', '🔥'
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Auto-clean stories after they expire
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ user: 1, createdAt: -1 });
storySchema.index({ 'reactions.user': 1 });

export const Story = mongoose.model('Story', storySchema);

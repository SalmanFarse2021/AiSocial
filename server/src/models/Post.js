import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['post', 'reel'], default: 'post', index: true },
    caption: { type: String, default: '' },
    media: [
      {
        url: { type: String, required: true },
        width: Number,
        height: Number,
        format: String,
        type: { type: String, enum: ['image', 'video', 'embed'], default: 'image' },
        duration: Number,
      },
    ],
    poll: {
      question: { type: String, trim: true },
      allowMultiple: { type: Boolean, default: false },
      options: [
        {
          text: { type: String, trim: true },
          voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        },
      ],
    },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentsCount: { type: Number, default: 0 },
    // privacy and audience
    privacy: { type: String, enum: ['public', 'friends', 'private', 'custom'], default: 'public', index: true },
    // reactions (one per user)
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: { type: String, enum: ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'] },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // tagging and location
    taggedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
    location: {
      name: { type: String },
      point: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number] }, // [lng, lat]
      },
    },
    feeling: { type: String },
    activity: { type: String },
    // sharing
    sharedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    // pinning
    pinned: { type: Boolean, default: false },
    pinnedAt: { type: Date },
    // optional album association for photo organization
    album: { type: mongoose.Schema.Types.ObjectId, ref: 'Album', index: true },
    scheduledAt: { type: Date, default: null },
    status: { type: String, enum: ['scheduled', 'published'], default: 'published' },
  },
  { timestamps: true }
);

postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ 'location.point': '2dsphere' });

postSchema.virtual('likes').get(function likes() {
  return Array.isArray(this.likedBy) ? this.likedBy.length : 0;
});

export const Post = mongoose.model('Post', postSchema);

import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', index: true, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 1000 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    repliesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });

export const Comment = mongoose.model('Comment', commentSchema);


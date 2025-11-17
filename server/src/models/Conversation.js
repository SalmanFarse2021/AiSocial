import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
    },
    // For direct chats: array of 2 user IDs, for groups: multiple user IDs
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Group chat only
    name: String,
    description: String,
    avatar: String,
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: Date,
    isArchived: {
      type: Boolean,
      default: false,
    },
    // Track who muted the conversation
    mutedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// Index for efficient queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);

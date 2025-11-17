import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'voice', 'image', 'file'],
      default: 'text',
    },
    attachment: {
      type: {
        type: String,
        enum: ['voice', 'image', 'file'],
      },
      url: String,
      name: String,
      size: Number,
      duration: Number, // For voice messages (in seconds)
    },
    // Track message read status per user
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Message reactions (emoji + user who reacted)
    reactions: [
      {
        emoji: String,
        users: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
    ],
    // For edit history
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    editHistory: [
      {
        content: String,
        editedAt: Date,
      },
    ],
    // For soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    // Reply to another message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    // Shared post
    sharedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for efficient conversation message queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, isDeleted: 1 });

export const Message = mongoose.model('Message', messageSchema);

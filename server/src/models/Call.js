import mongoose from 'mongoose';

const callSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    callType: {
      type: String,
      enum: ['audio', 'video'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'answered', 'rejected', 'missed', 'ended'],
      default: 'pending',
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
callSchema.index({ caller: 1, createdAt: -1 });
callSchema.index({ receiver: 1, createdAt: -1 });

const Call = mongoose.model('Call', callSchema);

export default Call;

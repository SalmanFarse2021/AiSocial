import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, trim: true },
    nickname: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String, index: true },
    facebookId: { type: String, index: true },
    profilePic: { type: String },
    coverPhoto: { type: String },
    bio: { type: String, default: '' },
    about: { type: String },
    gender: { type: String },
    pronouns: { type: String },
    birthday: { type: Date },
    relationshipStatus: { type: String },
    languages: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    website: { type: String },
    followers: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    following: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    friends: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    friendRequestsSent: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    friendRequestsReceived: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    friendLists: {
      close: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
      family: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
      restricted: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    },
    // Optional location for nearby suggestions
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] }, // [lng, lat]
    },
    city: { type: String },
    currentCity: { type: String },
    hometown: { type: String },
    country: { type: String },
    phone: { type: String },
    socialLinks: { type: [{ label: String, url: String }], default: [] },
    work: { type: [{ role: String, company: String, startDate: Date, endDate: Date, current: Boolean, description: String }], default: [] },
    education: { type: [{ school: String, degree: String, field: String, startDate: Date, endDate: Date, description: String }], default: [] },
    family: { type: [{ name: String, relation: String, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }], default: [] },
    favoriteQuotes: { type: String },
    lifeEvents: { type: [{ title: String, type: String, date: Date, description: String }], default: [] },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });

// Ensure invalid location shapes are not saved
userSchema.pre('save', function sanitizeLocation(next) {
  if (this.location && (!Array.isArray(this.location.coordinates) || this.location.coordinates.length !== 2)) {
    this.location = undefined;
  }
  next();
});

export const User = mongoose.model('User', userSchema);

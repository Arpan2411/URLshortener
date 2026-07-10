// src/models/Url.js
const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
      validate: {
        validator: function(v) {
          // Basic URL validation
          const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
          return urlRegex.test(v);
        },
        message: props => `${props.value} is not a valid URL!`
      }
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      minlength: 7,
      maxlength: 7,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastAccessedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Optional: Track who created it (for future user authentication)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Optional: Add expiry date
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster lookups
urlSchema.index({ originalUrl: 1, isActive: 1 });

// Virtual for short URL
urlSchema.virtual('shortUrl').get(function() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/${this.shortCode}`;
});

// Instance method to increment clicks
urlSchema.methods.incrementClicks = async function() {
  this.clicks += 1;
  this.lastAccessedAt = new Date();
  return this.save();
};

// Static method to find by short code
urlSchema.statics.findByShortCode = function(shortCode) {
  return this.findOne({ shortCode, isActive: true });
};

// Static method to find by original URL
urlSchema.statics.findByOriginalUrl = function(originalUrl) {
  return this.findOne({ originalUrl, isActive: true });
};

// Ensure virtuals are included in JSON output
urlSchema.set('toJSON', { virtuals: true });
urlSchema.set('toObject', { virtuals: true });

const Url = mongoose.model('Url', urlSchema);

module.exports = Url;
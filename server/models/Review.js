const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // A driver can review only once per booking
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    spot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Spot',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please add a rating between 1 and 5'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Please add a comment'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to calculate average rating and total reviews for a Spot
reviewSchema.statics.getAverageRating = async function (spotId) {
  const stats = await this.aggregate([
    {
      $match: { spot: spotId },
    },
    {
      $group: {
        _id: '$spot',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  try {
    if (stats.length > 0) {
      await mongoose.model('Spot').findByIdAndUpdate(spotId, {
        rating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
      });
    } else {
      await mongoose.model('Spot').findByIdAndUpdate(spotId, {
        rating: 0,
        totalReviews: 0,
      });
    }
  } catch (err) {
    console.error(`Error updating spot ratings: ${err}`);
  }
};

// Call getAverageRating after review creation
reviewSchema.post('save', async function () {
  await this.constructor.getAverageRating(this.spot);
});

// Call getAverageRating after review deletion
reviewSchema.post('deleteOne', { document: true, query: false }, async function () {
  await this.constructor.getAverageRating(this.spot);
});

// Recalculate average rating after a review is updated via findOneAndUpdate
reviewSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    await doc.constructor.getAverageRating(doc.spot);
  }
});

// Recalculate average rating after a review is deleted via findOneAndDelete
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.getAverageRating(doc.spot);
  }
});

module.exports = mongoose.model('Review', reviewSchema);

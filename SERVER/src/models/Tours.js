const mongoose = require("mongoose");
const tourSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    duration: { type: String, required: true },
    departureLocation: { type: String, required: true },

    images: {
      type: [String],
      required: true,
      default: [],
    },
    gallery: [String],
    partner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    highlights: [String],
    itinerary: [
      {
        day: String,
        meals: String,
        content: String,
        image: String,
      },
    ],
    departures: [
      {
        date: String,
        returnDate: String,
        dayOfWeek: String,
        transport: String,
        adultPrice: Number,
        childPrice: Number,
        babyPrice: Number,
        surcharge: { type: Number, default: 0 },
        maxslots: { type: Number, default: 20 },
        availableslots: { type: Number, default: 20 },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    rejectReason: {
      type: String,
      default: "",
    },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    embeddingVector: { type: [Number], select: false },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Tour", tourSchema);

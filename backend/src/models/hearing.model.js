const mongoose = require('mongoose');

const hearingSchema = new mongoose.Schema(
  {
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Linked case reference is mandatory'],
      index: true,
    },
    courtName: {
      type: String,
      required: [true, 'Court name is mandatory'],
      trim: true,
    },
    courtroom: {
      type: String,
      required: [true, 'Courtroom or bench number is required'],
      trim: true,
    },
    judgeName: {
      type: String,
      required: [true, 'Presiding judge name is required'],
      trim: true,
    },
    hearingDate: {
      type: Date,
      required: [true, 'Hearing date is mandatory'],
      index: true,
    },
    hearingTime: {
      type: String,
      required: [true, 'Hearing scheduled time is required'],
      trim: true,
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of court hearing is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['SCHEDULED', 'ADJOURNED', 'COMPLETED', 'CANCELLED'],
        message: 'Invalid hearing status',
      },
      default: 'SCHEDULED',
      index: true,
    },
    summary: {
      type: String,
      trim: true,
      default: '',
    },
    nextHearingDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

hearingSchema.index({ hearingDate: 1, status: 1 });

const Hearing = mongoose.model('Hearing', hearingSchema);

module.exports = Hearing;

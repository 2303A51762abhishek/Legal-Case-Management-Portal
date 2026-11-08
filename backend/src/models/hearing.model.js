const mongoose = require('mongoose');

const hearingSchema = new mongoose.Schema(
  {
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Linked case reference is mandatory'],
      index: true,
    },
    caseReference: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    courtName: {
      type: String,
      required: [true, 'Court name is mandatory'],
      trim: true,
      index: true,
    },
    courtroom: {
      type: String,
      required: [true, 'Courtroom or bench number is required'],
      trim: true,
      index: true,
    },
    judgeName: {
      type: String,
      required: [true, 'Presiding judge name is required'],
      trim: true,
      index: true,
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
    durationMinutes: {
      type: Number,
      default: 60, // Standard 1-hour court slot
      min: [15, 'Minimum hearing duration is 15 minutes'],
      max: [480, 'Maximum hearing duration is 8 hours'],
    },
    startDateTime: {
      type: Date,
      index: true,
    },
    endDateTime: {
      type: Date,
      index: true,
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
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    nextHearingDate: {
      type: Date,
      default: null,
    },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for conflict queries and cause list ordering
hearingSchema.index({ courtName: 1, courtroom: 1, startDateTime: 1 });
hearingSchema.index({ judgeName: 1, startDateTime: 1 });
hearingSchema.index({ hearingDate: 1, status: 1 });

const Hearing = mongoose.model('Hearing', hearingSchema);

module.exports = Hearing;

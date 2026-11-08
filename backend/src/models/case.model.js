const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema(
  {
    caseReference: {
      type: String,
      required: [true, 'Case reference number is mandatory'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Case title is mandatory'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    caseType: {
      type: String,
      required: [true, 'Case type/category is mandatory'],
      trim: true,
    },
    courtName: {
      type: String,
      required: [true, 'Court name is mandatory'],
      trim: true,
    },
    courtroom: {
      type: String,
      trim: true,
      default: '',
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Associated client reference is mandatory'],
      index: true,
    },
    assignedLawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned advocate/lawyer is mandatory'],
      index: true,
    },
    filingDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Case description / cause of action is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          'FILED',
          'UNDER_REVIEW',
          'HEARING_IN_PROGRESS',
          'JUDGMENT_RESERVED',
          'CLOSED',
          'APPEALED',
        ],
        message: 'Invalid case status value',
      },
      default: 'FILED',
      index: true,
    },
    stage: {
      type: String,
      trim: true,
      default: 'Filing & Initial Scrutiny',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 10,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
  },
  {
    timestamps: true,
  }
);

// Search index on title and case reference
caseSchema.index({ caseReference: 1, status: 1 });
caseSchema.index({ assignedLawyer: 1, status: 1 });

const Case = mongoose.model('Case', caseSchema);

module.exports = Case;

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient is mandatory'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is mandatory'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is mandatory'],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'HEARING_ALERT',
        'DEADLINE_ALERT',
        'CASE_UPDATE',
        'TASK_ASSIGNMENT',
        'GENERAL',
      ],
      default: 'GENERAL',
      index: true,
    },
    relatedCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      default: null,
    },
    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    relatedHearing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hearing',
      default: null,
    },
    fingerprint: {
      type: String,
      default: null,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

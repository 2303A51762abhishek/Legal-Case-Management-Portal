const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is mandatory'],
      trim: true,
      maxlength: [150, 'Task title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      default: null,
      index: true,
    },
    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task assignee is mandatory'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Task deadline date is mandatory'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'],
        message: 'Invalid task status',
      },
      default: 'PENDING',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ assignedUser: 1, status: 1 });
taskSchema.index({ deadline: 1, status: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

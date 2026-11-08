const mongoose = require('mongoose');
const { Task, Case, User, Client, Notification } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @desc    Create a new task with assignment notification
 * @route   POST /api/tasks
 * @access  Protected (ADMIN, LAWYER, CLERK)
 */
const createTask = async (req, res) => {
  try {
    const {
      title,
      description = '',
      case: caseId,
      assignedUser,
      priority = 'MEDIUM',
      deadline,
      isClientVisible = false,
    } = req.body;

    // 1. Mandatory Input Validation
    if (!title || !deadline || !assignedUser) {
      return sendError(res, 'Task title, deadline, and assigned user are mandatory.', 400);
    }

    if (!isValidId(assignedUser)) {
      return sendError(res, 'Invalid assigned user ID format.', 400);
    }

    // Litigant clients are strictly prohibited from creating tasks
    if (req.user.role === 'CLIENT') {
      return sendError(res, 'Forbidden. Litigant clients cannot create or assign tasks.', 403);
    }

    // Verify assigned user exists
    const assignee = await User.findById(assignedUser);
    if (!assignee) {
      return sendError(res, 'Assigned user does not exist.', 404);
    }

    // If linked to a case, verify existence and lawyer assignment
    let targetCase = null;
    if (caseId) {
      if (!isValidId(caseId)) {
        return sendError(res, 'Invalid case ID format.', 400);
      }
      targetCase = await Case.findById(caseId);
      if (!targetCase) {
        return sendError(res, 'Specified legal case does not exist.', 404);
      }

      if (req.user.role === 'LAWYER') {
        if (targetCase.assignedLawyer.toString() !== req.user.id) {
          return sendError(res, 'Access denied. You can only assign tasks for your assigned cases.', 403);
        }
      }
    }

    const parsedDeadline = new Date(deadline);
    if (isNaN(parsedDeadline.getTime())) {
      return sendError(res, 'Invalid deadline date format.', 400);
    }

    // Determine initial status based on deadline
    const initialStatus = parsedDeadline < new Date() ? 'OVERDUE' : 'PENDING';

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      case: targetCase ? targetCase._id : null,
      assignedUser: assignee._id,
      createdBy: req.user.id,
      priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority) ? priority : 'MEDIUM',
      deadline: parsedDeadline,
      status: initialStatus,
      isClientVisible: Boolean(isClientVisible),
      isDeleted: false,
    });

    // Populate for response
    await task.populate([
      { path: 'assignedUser', select: 'name email role' },
      { path: 'createdBy', select: 'name email role' },
      { path: 'case', select: 'caseReference title courtName' },
    ]);

    // Dispatch assignment notification
    const caseRefText = targetCase ? ` for case ${targetCase.caseReference}` : '';
    await Notification.create({
      recipient: assignee._id,
      title: `New Task Assigned: ${task.title}`,
      message: `${req.user.name} assigned you a task${caseRefText}. Deadline: ${parsedDeadline.toISOString().split('T')[0]}, Priority: ${task.priority}.`,
      type: 'TASK_ASSIGNMENT',
      relatedCase: targetCase ? targetCase._id : null,
      relatedTask: task._id,
    });

    return sendSuccess(res, task, 'Task created and assigned successfully', 201);
  } catch (error) {
    console.error('Error creating task:', error);
    return sendError(res, error.message || 'Internal server error creating task', 500);
  }
};

/**
 * @desc    Get all tasks with filtering, search, and dynamic overdue tracking
 * @route   GET /api/tasks
 * @access  Protected (All Roles with Scoping)
 */
const getTasks = async (req, res) => {
  try {
    const { status, priority, caseId, assignedUser, search, overdue } = req.query;
    const now = new Date();

    const query = { isDeleted: false };

    // 1. Role-Based Scoping
    if (req.user.role === 'CLIENT') {
      // Find client profile linked to this user account
      const clientProfile = await Client.findOne({ userAccount: req.user.id });
      if (!clientProfile) {
        return sendSuccess(res, { tasks: [], stats: { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0, urgent: 0 } });
      }
      // Get all cases owned by client
      const clientCases = await Case.find({ client: clientProfile._id }).select('_id');
      const caseIds = clientCases.map((c) => c._id);

      // Clients only see tasks for their cases WHERE isClientVisible is true
      query.case = { $in: caseIds };
      query.isClientVisible = true;
    } else if (req.user.role === 'LAWYER') {
      // Lawyers see tasks assigned to them OR tasks on cases they are handling
      const lawyerCases = await Case.find({ assignedLawyer: req.user.id }).select('_id');
      const caseIds = lawyerCases.map((c) => c._id);

      query.$or = [{ assignedUser: req.user.id }, { case: { $in: caseIds } }];
    }
    // ADMIN and CLERK can see all tasks

    // 2. Query Filters
    if (status) {
      query.status = status.toUpperCase();
    }

    if (priority) {
      query.priority = priority.toUpperCase();
    }

    if (caseId && isValidId(caseId)) {
      query.case = caseId;
    }

    if (assignedUser && isValidId(assignedUser)) {
      query.assignedUser = assignedUser;
    }

    if (overdue === 'true') {
      query.status = { $ne: 'COMPLETED' };
      query.deadline = { $lt: now };
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ title: searchRegex }, { description: searchRegex }],
      });
    }

    const tasks = await Task.find(query)
      .populate('assignedUser', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('case', 'caseReference title courtName')
      .sort({ deadline: 1, createdAt: -1 });

    // 3. Mark Dynamic Overdue State & Gather Aggregate Statistics
    let pendingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let overdueCount = 0;
    let urgentCount = 0;

    const processedTasks = tasks.map((t) => {
      const doc = t.toObject();
      const isPastDeadline = doc.deadline && new Date(doc.deadline) < now;

      if (doc.status !== 'COMPLETED' && isPastDeadline) {
        doc.status = 'OVERDUE';
        doc.isOverdue = true;
      } else {
        doc.isOverdue = false;
      }

      if (doc.status === 'PENDING') pendingCount++;
      else if (doc.status === 'IN_PROGRESS') inProgressCount++;
      else if (doc.status === 'COMPLETED') completedCount++;
      else if (doc.status === 'OVERDUE') overdueCount++;

      if (doc.priority === 'URGENT' && doc.status !== 'COMPLETED') urgentCount++;

      return doc;
    });

    const stats = {
      total: processedTasks.length,
      pending: pendingCount,
      inProgress: inProgressCount,
      completed: completedCount,
      overdue: overdueCount,
      urgent: urgentCount,
    };

    return sendSuccess(res, { tasks: processedTasks, stats }, 'Tasks retrieved successfully', 200);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return sendError(res, error.message || 'Internal server error fetching tasks', 500);
  }
};

/**
 * @desc    Get single task details
 * @route   GET /api/tasks/:id
 * @access  Protected
 */
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid task ID format.', 400);
    }

    const task = await Task.findOne({ _id: id, isDeleted: false })
      .populate('assignedUser', 'name email role')
      .populate('createdBy', 'name email role')
      .populate('case', 'caseReference title courtName client assignedLawyer');

    if (!task) {
      return sendError(res, 'Task not found.', 404);
    }

    // Client verification: must be linked case and client-visible
    if (req.user.role === 'CLIENT') {
      if (!task.isClientVisible) {
        return sendError(res, 'Access denied. This internal task is not accessible to clients.', 403);
      }
      const clientProfile = await Client.findOne({ userAccount: req.user.id });
      if (!clientProfile || task.case?.client?.toString() !== clientProfile._id.toString()) {
        return sendError(res, 'Access denied. You do not have permission to view this task.', 403);
      }
    }

    return sendSuccess(res, task, 'Task details retrieved successfully', 200);
  } catch (error) {
    console.error('Error fetching task details:', error);
    return sendError(res, error.message || 'Internal server error fetching task', 500);
  }
};

/**
 * @desc    Update task details
 * @route   PUT /api/tasks/:id
 * @access  Protected (ADMIN, LAWYER, CLERK)
 */
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid task ID format.', 400);
    }

    if (req.user.role === 'CLIENT') {
      return sendError(res, 'Forbidden. Litigant clients cannot modify tasks.', 403);
    }

    const task = await Task.findOne({ _id: id, isDeleted: false });
    if (!task) {
      return sendError(res, 'Task not found.', 404);
    }

    // Role verification
    if (req.user.role === 'LAWYER') {
      const isAssignee = task.assignedUser.toString() === req.user.id;
      const isCreator = task.createdBy?.toString() === req.user.id;
      if (!isAssignee && !isCreator) {
        return sendError(res, 'Access denied. You can only update tasks assigned to or created by you.', 403);
      }
    }

    const {
      title,
      description,
      priority,
      deadline,
      assignedUser,
      isClientVisible,
      status,
    } = req.body;

    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority.toUpperCase())) {
      task.priority = priority.toUpperCase();
    }
    if (deadline) {
      const parsedDeadline = new Date(deadline);
      if (!isNaN(parsedDeadline.getTime())) {
        task.deadline = parsedDeadline;
      }
    }
    if (assignedUser && isValidId(assignedUser)) {
      task.assignedUser = assignedUser;
    }
    if (isClientVisible !== undefined) {
      task.isClientVisible = Boolean(isClientVisible);
    }
    if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].includes(status.toUpperCase())) {
      task.status = status.toUpperCase();
      if (task.status === 'COMPLETED') {
        task.completedAt = new Date();
      } else {
        task.completedAt = null;
      }
    }

    await task.save();

    await task.populate([
      { path: 'assignedUser', select: 'name email role' },
      { path: 'createdBy', select: 'name email role' },
      { path: 'case', select: 'caseReference title' },
    ]);

    return sendSuccess(res, task, 'Task updated successfully', 200);
  } catch (error) {
    console.error('Error updating task:', error);
    return sendError(res, error.message || 'Internal server error updating task', 500);
  }
};

/**
 * @desc    Fast status transition (e.g. Mark Completed / In Progress)
 * @route   PATCH /api/tasks/:id/status
 * @access  Protected (ADMIN, LAWYER, CLERK)
 */
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidId(id)) {
      return sendError(res, 'Invalid task ID format.', 400);
    }

    if (!status || !['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].includes(status.toUpperCase())) {
      return sendError(res, 'Please provide a valid status: PENDING, IN_PROGRESS, COMPLETED, or OVERDUE.', 400);
    }

    if (req.user.role === 'CLIENT') {
      return sendError(res, 'Forbidden. Litigant clients cannot modify task statuses.', 403);
    }

    const task = await Task.findOne({ _id: id, isDeleted: false });
    if (!task) {
      return sendError(res, 'Task not found.', 404);
    }

    task.status = status.toUpperCase();
    if (task.status === 'COMPLETED') {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }

    await task.save();

    await task.populate([
      { path: 'assignedUser', select: 'name email role' },
      { path: 'case', select: 'caseReference title' },
    ]);

    return sendSuccess(res, task, `Task marked as ${task.status}`, 200);
  } catch (error) {
    console.error('Error updating task status:', error);
    return sendError(res, error.message || 'Internal server error updating status', 500);
  }
};

/**
 * @desc    Soft-delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Protected (ADMIN, LAWYER, CLERK)
 */
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid task ID format.', 400);
    }

    if (req.user.role === 'CLIENT') {
      return sendError(res, 'Forbidden. Litigant clients cannot delete tasks.', 403);
    }

    const task = await Task.findOne({ _id: id, isDeleted: false });
    if (!task) {
      return sendError(res, 'Task not found.', 404);
    }

    if (req.user.role === 'LAWYER' && task.createdBy?.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'Access denied. You can only delete tasks created by you.', 403);
    }

    task.isDeleted = true;
    await task.save();

    return sendSuccess(res, { id: task._id }, 'Task removed successfully', 200);
  } catch (error) {
    console.error('Error deleting task:', error);
    return sendError(res, error.message || 'Internal server error deleting task', 500);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
};

const mongoose = require('mongoose');
const { Notification } = require('../models');
const { scanAndDispatchReminders } = require('../services/reminder.service');
const { sendSuccess, sendError } = require('../utils/response');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @desc    Get user notifications with unread count and filters
 * @route   GET /api/notifications
 * @access  Protected
 */
const getNotifications = async (req, res) => {
  try {
    const { unreadOnly, type } = req.query;

    const query = { recipient: req.user.id };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    if (type) {
      query.type = type.toUpperCase();
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('relatedCase', 'caseReference title courtName')
        .populate('relatedTask', 'title priority deadline status')
        .sort({ createdAt: -1 })
        .limit(50),
      Notification.countDocuments({ recipient: req.user.id, isRead: false }),
    ]);

    return sendSuccess(
      res,
      { notifications, unreadCount },
      'Notifications retrieved successfully',
      200
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return sendError(res, error.message || 'Internal server error fetching notifications', 500);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Protected
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return sendError(res, 'Invalid notification ID format.', 400);
    }

    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user.id,
    });

    if (!notification) {
      return sendError(res, 'Notification not found or access denied.', 404);
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });

    return sendSuccess(
      res,
      { notification, unreadCount },
      'Notification marked as read',
      200
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return sendError(res, error.message || 'Internal server error updating notification', 500);
  }
};

/**
 * @desc    Mark all unread notifications as read for current user
 * @route   PATCH /api/notifications/read-all
 * @access  Protected
 */
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return sendSuccess(
      res,
      { modifiedCount: result.modifiedCount, unreadCount: 0 },
      `Marked ${result.modifiedCount} notifications as read`,
      200
    );
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return sendError(res, error.message || 'Internal server error updating notifications', 500);
  }
};

/**
 * @desc    Trigger on-demand reminder scan
 * @route   POST /api/notifications/scan
 * @access  Protected (ADMIN)
 */
const triggerScan = async (req, res) => {
  try {
    const result = await scanAndDispatchReminders();
    return sendSuccess(res, result, 'Reminder and deadline scan completed', 200);
  } catch (error) {
    console.error('Error triggering scan:', error);
    return sendError(res, error.message || 'Internal server error triggering scan', 500);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  triggerScan,
};

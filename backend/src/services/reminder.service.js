const { Hearing, Task, Notification, Case, Client, User } = require('../models');

/**
 * Helper to format date strings for unique fingerprints
 */
const formatDateKey = (date) => {
  if (!date) return 'none';
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

/**
 * Scans upcoming court hearings, approaching task deadlines, and overdue items,
 * generating deduplicated notifications.
 * @returns {Promise<{ hearingAlerts: number, deadlineAlerts: number, overdueUpdated: number }>}
 */
const scanAndDispatchReminders = async () => {
  const now = new Date();
  const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  let hearingAlerts = 0;
  let deadlineAlerts = 0;
  let overdueUpdated = 0;

  try {
    // -----------------------------------------------------------------
    // 1. Upcoming Court Hearings within 48 Hours
    // -----------------------------------------------------------------
    const upcomingHearings = await Hearing.find({
      hearingDate: { $gte: now, $lte: next48Hours },
      status: 'SCHEDULED',
    }).populate({
      path: 'case',
      populate: [
        { path: 'assignedLawyer', select: '_id name email' },
        { path: 'client', select: '_id name email userAccount' },
      ],
    });

    for (const hearing of upcomingHearings) {
      if (!hearing.case) continue;

      const hearingDateStr = formatDateKey(hearing.hearingDate);

      // A. Alert Assigned Lawyer
      if (hearing.case.assignedLawyer) {
        const lawyerFingerprint = `REMINDER_HEARING_${hearing._id}_LAWYER_${hearing.case.assignedLawyer._id}_${hearingDateStr}`;
        const existingNotif = await Notification.findOne({ fingerprint: lawyerFingerprint });

        if (!existingNotif) {
          await Notification.create({
            recipient: hearing.case.assignedLawyer._id,
            title: `Hearing in 48 Hours: ${hearing.caseReference}`,
            message: `Scheduled at ${hearing.courtName} (${hearing.courtroom}) on ${hearing.hearingDate.toISOString().split('T')[0]} at ${hearing.hearingTime}. Purpose: ${hearing.purpose}`,
            type: 'HEARING_ALERT',
            relatedCase: hearing.case._id,
            relatedHearing: hearing._id,
            fingerprint: lawyerFingerprint,
          });
          hearingAlerts++;
        }
      }

      // B. Alert Client (if linked to a registered User account)
      const clientUserId = hearing.case.client?.userAccount;
      if (clientUserId) {
        const clientFingerprint = `REMINDER_HEARING_${hearing._id}_CLIENT_${clientUserId}_${hearingDateStr}`;
        const existingNotif = await Notification.findOne({ fingerprint: clientFingerprint });

        if (!existingNotif) {
          await Notification.create({
            recipient: clientUserId,
            title: `Court Hearing Scheduled: ${hearing.caseReference}`,
            message: `Your court appearance/hearing is set for ${hearing.hearingDate.toISOString().split('T')[0]} at ${hearing.hearingTime} in ${hearing.courtroom}, ${hearing.courtName}.`,
            type: 'HEARING_ALERT',
            relatedCase: hearing.case._id,
            relatedHearing: hearing._id,
            fingerprint: clientFingerprint,
          });
          hearingAlerts++;
        }
      }
    }

    // -----------------------------------------------------------------
    // 2. Approaching Task Deadlines within 24 Hours
    // -----------------------------------------------------------------
    const approachingTasks = await Task.find({
      deadline: { $gte: now, $lte: next24Hours },
      status: { $in: ['PENDING', 'IN_PROGRESS'] },
      isDeleted: false,
    }).populate('case', 'caseReference title');

    for (const task of approachingTasks) {
      const deadlineStr = formatDateKey(task.deadline);
      const taskFingerprint = `REMINDER_TASK_DEADLINE_${task._id}_${task.assignedUser}_${deadlineStr}`;

      const existingNotif = await Notification.findOne({ fingerprint: taskFingerprint });
      if (!existingNotif) {
        const caseRef = task.case ? `[${task.case.caseReference}] ` : '';
        await Notification.create({
          recipient: task.assignedUser,
          title: `Deadline Approaching: ${task.title}`,
          message: `${caseRef}Task is due within 24 hours (Deadline: ${task.deadline.toISOString().split('T')[0]}). Priority: ${task.priority}.`,
          type: 'DEADLINE_ALERT',
          relatedCase: task.case?._id || null,
          relatedTask: task._id,
          fingerprint: taskFingerprint,
        });
        deadlineAlerts++;
      }
    }

    // -----------------------------------------------------------------
    // 3. Automatically Identify & Mark Overdue Tasks
    // -----------------------------------------------------------------
    const overdueTasks = await Task.find({
      deadline: { $lt: now },
      status: { $in: ['PENDING', 'IN_PROGRESS'] },
      isDeleted: false,
    }).populate('case', 'caseReference title');

    for (const task of overdueTasks) {
      task.status = 'OVERDUE';
      await task.save();
      overdueUpdated++;

      const overdueFingerprint = `TASK_OVERDUE_ALERT_${task._id}_${task.assignedUser}`;
      const existingNotif = await Notification.findOne({ fingerprint: overdueFingerprint });

      if (!existingNotif) {
        const caseRef = task.case ? `[${task.case.caseReference}] ` : '';
        await Notification.create({
          recipient: task.assignedUser,
          title: `Overdue Task Alert: ${task.title}`,
          message: `${caseRef}Task is now overdue (Deadline was ${task.deadline.toISOString().split('T')[0]}). Please complete or request an extension.`,
          type: 'DEADLINE_ALERT',
          relatedCase: task.case?._id || null,
          relatedTask: task._id,
          fingerprint: overdueFingerprint,
        });
      }
    }

    return { hearingAlerts, deadlineAlerts, overdueUpdated };
  } catch (error) {
    console.error('Error during reminder scan:', error.message);
    return { hearingAlerts, deadlineAlerts, overdueUpdated, error: error.message };
  }
};

/**
 * Initializes recurring background reminder timer (cron-like interval)
 */
let reminderIntervalTimer = null;

const startScheduledReminderCron = (intervalMs = 10 * 60 * 1000) => {
  if (reminderIntervalTimer) {
    clearInterval(reminderIntervalTimer);
  }

  // Initial trigger
  scanAndDispatchReminders();

  // Periodic recurring check
  reminderIntervalTimer = setInterval(() => {
    scanAndDispatchReminders();
  }, intervalMs);

  console.log(`⏱️ Reminder & Overdue Scanner started (interval: ${intervalMs / 1000 / 60}m)`);
};

const stopScheduledReminderCron = () => {
  if (reminderIntervalTimer) {
    clearInterval(reminderIntervalTimer);
    reminderIntervalTimer = null;
  }
};

module.exports = {
  scanAndDispatchReminders,
  startScheduledReminderCron,
  stopScheduledReminderCron,
};

const { Notification } = require('../models');

/**
 * Creates in-app reminders and notifications for upcoming court appearances
 */
const notifyHearingScheduled = async ({ hearing, legalCase }) => {
  try {
    const notifications = [];
    const title = `Court Hearing Scheduled: ${legalCase.caseReference}`;
    const dateFormatted = new Date(hearing.hearingDate).toLocaleDateString();
    const message = `A hearing has been scheduled before ${hearing.courtName} (${hearing.courtroom}) on ${dateFormatted} at ${hearing.hearingTime}. Purpose: ${hearing.purpose}.`;

    // 1. Notify Assigned Lawyer
    if (legalCase.assignedLawyer) {
      notifications.push({
        recipient: legalCase.assignedLawyer,
        title,
        message,
        type: 'HEARING_ALERT',
        relatedCase: legalCase._id,
      });
    }

    // 2. Notify Litigant Client if linked user account exists
    if (legalCase.client && legalCase.client.userAccount) {
      notifications.push({
        recipient: legalCase.client.userAccount,
        title,
        message: `Your court appearance for case ${legalCase.caseReference} is scheduled on ${dateFormatted} at ${hearing.hearingTime}.`,
        type: 'HEARING_ALERT',
        relatedCase: legalCase._id,
      });
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.warn('Notification creation notice (non-fatal):', error.message);
  }
};

module.exports = {
  notifyHearingScheduled,
};

const { Hearing } = require('../models');

/**
 * Normalizes date and time strings into precise JavaScript Date objects
 * Handles '10:30 AM', '02:15 PM', '14:30', etc.
 */
const parseDateTime = (dateInput, timeStr, durationMinutes = 60) => {
  const baseDate = new Date(dateInput);
  if (isNaN(baseDate.getTime())) {
    throw new Error('Invalid hearing date format.');
  }

  // Parse time
  const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
  const match = String(timeStr).match(timeRegex);

  let hours = 10;
  let minutes = 0;

  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridiem = match[3] ? match[3].toUpperCase() : null;

    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  const startDateTime = new Date(baseDate);
  startDateTime.setHours(hours, minutes, 0, 0);

  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

  return { startDateTime, endDateTime };
};

/**
 * Checks for courtroom or presiding judge scheduling overlaps
 * Overlap condition: (existing.start < new.end && existing.end > new.start)
 * Excludes CANCELLED and COMPLETED hearings.
 */
const checkHearingConflicts = async ({
  courtName,
  courtroom,
  judgeName,
  hearingDate,
  hearingTime,
  durationMinutes = 60,
  excludeHearingId = null,
}) => {
  const { startDateTime, endDateTime } = parseDateTime(
    hearingDate,
    hearingTime,
    durationMinutes
  );

  const baseOverlapFilter = {
    status: { $nin: ['CANCELLED', 'COMPLETED'] },
    startDateTime: { $lt: endDateTime },
    endDateTime: { $gt: startDateTime },
  };

  if (excludeHearingId) {
    baseOverlapFilter._id = { $ne: excludeHearingId };
  }

  // 1. Check Courtroom Conflict (Same Court & Courtroom)
  const courtroomConflict = await Hearing.findOne({
    ...baseOverlapFilter,
    courtName: { $regex: new RegExp(`^${courtName.trim()}$`, 'i') },
    courtroom: { $regex: new RegExp(`^${courtroom.trim()}$`, 'i') },
  })
    .populate('case', 'caseReference title')
    .lean();

  if (courtroomConflict) {
    const ref = courtroomConflict.caseReference || courtroomConflict.case?.caseReference || 'Existing Case';
    return {
      hasConflict: true,
      conflictType: 'COURTROOM',
      message: `Scheduling Conflict: ${courtroom} at ${courtName} is already booked for case ${ref} between ${courtroomConflict.hearingTime} and completion.`,
      conflictingHearing: courtroomConflict,
      startDateTime,
      endDateTime,
    };
  }

  // 2. Check Judge Conflict (Same Judge presiding in any courtroom)
  const judgeConflict = await Hearing.findOne({
    ...baseOverlapFilter,
    judgeName: { $regex: new RegExp(`^${judgeName.trim()}$`, 'i') },
  })
    .populate('case', 'caseReference title')
    .lean();

  if (judgeConflict) {
    const ref = judgeConflict.caseReference || judgeConflict.case?.caseReference || 'Existing Case';
    return {
      hasConflict: true,
      conflictType: 'JUDGE',
      message: `Scheduling Conflict: Presiding judge ${judgeName} is already scheduled to preside over case ${ref} at this time slot.`,
      conflictingHearing: judgeConflict,
      startDateTime,
      endDateTime,
    };
  }

  return {
    hasConflict: false,
    startDateTime,
    endDateTime,
  };
};

module.exports = {
  parseDateTime,
  checkHearingConflicts,
};

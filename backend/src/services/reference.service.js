const { Case } = require('../models');

/**
 * Generates a unique Case Reference Number in the format: LCMS-YYYY-XXXX
 * Example: LCMS-2026-0105
 */
const generateCaseReference = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `LCMS-${currentYear}-`;

  // Find the highest sequence number for the current year
  const latestCase = await Case.findOne({
    caseReference: new RegExp(`^${prefix}\\d{4}$`),
  })
    .sort({ caseReference: -1 })
    .select('caseReference')
    .lean();

  let nextSequence = 1;

  if (latestCase && latestCase.caseReference) {
    const parts = latestCase.caseReference.split('-');
    if (parts.length === 3) {
      const parsedSeq = parseInt(parts[2], 10);
      if (!isNaN(parsedSeq)) {
        nextSequence = parsedSeq + 1;
      }
    }
  }

  // Format with 4 digits zero-padding
  let candidateReference = `${prefix}${String(nextSequence).padStart(4, '0')}`;

  // Collision prevention loop
  let isUnique = false;
  while (!isUnique) {
    const exists = await Case.findOne({ caseReference: candidateReference });
    if (!exists) {
      isUnique = true;
    } else {
      nextSequence += 1;
      candidateReference = `${prefix}${String(nextSequence).padStart(4, '0')}`;
    }
  }

  return candidateReference;
};

module.exports = {
  generateCaseReference,
};

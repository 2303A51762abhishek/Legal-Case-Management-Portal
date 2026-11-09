/**
 * RFC 4180 Compliant CSV Export Utility
 * JurisFlow Legal Case and Court Hearing Management Portal
 *
 * Ensures:
 * 1. Proper escaping of quotes (" -> "")
 * 2. Mandatory quoting for fields containing commas, quotes, newlines, or special characters
 * 3. CRLF (\r\n) standard row termination
 * 4. UTF-8 Byte Order Mark (\uFEFF) for universal spreadsheet compatibility
 * 5. Explicit Content-Length and non-chunked response completion to prevent truncation
 */

/**
 * Escapes a single cell value according to RFC 4180 specification
 * @param {any} val - Raw cell value
 * @returns {string} Escaped and quoted CSV cell
 */
const escapeCSV = (val) => {
  if (val === null || val === undefined) {
    return '""';
  }
  const str = String(val);
  // Double up any existing quotation marks
  const escaped = str.replace(/"/g, '""');
  // Always wrap in double quotes to guarantee safe handling of commas, #, ?, \n, \r
  return `"${escaped}"`;
};

/**
 * Generates an RFC 4180 compliant CSV string from headers and data rows
 * @param {string[]} headers - Array of column header titles
 * @param {Array<Array<any>>} rows - 2D array of row values
 * @returns {string} Complete UTF-8 CSV string with BOM
 */
const generateCSV = (headers, rows) => {
  const headerLine = headers.map(escapeCSV).join(',');
  const rowLines = rows.map((row) => row.map(escapeCSV).join(','));

  // Prepend UTF-8 BOM (\uFEFF) and join using CRLF (\r\n), with a trailing CRLF
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n') + '\r\n';
};

/**
 * Sends a complete CSV file response to an Express client
 * Guarantees that the response is never closed prematurely and Content-Length matches
 * @param {import('express').Response} res - Express response object
 * @param {string} filename - Attachment filename
 * @param {string} csvString - Full CSV string
 */
const sendCSVResponse = (res, filename, csvString) => {
  const buffer = Buffer.from(csvString, 'utf8');

  // Set explicit RFC 4180 / HTTP download headers
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Send the full buffer atomically and end the response
  res.status(200);
  res.end(buffer);
};

module.exports = {
  escapeCSV,
  generateCSV,
  sendCSVResponse,
};

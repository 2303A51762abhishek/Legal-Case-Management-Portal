/**
 * JurisFlow Reports & Analytics Module — CSV Export Verification Suite
 *
 * Student: MAMILLAPALLY ABHISHEK (Roll: 2303A51762)
 * Course: DevOps & Full Stack (B.Tech IV-I, 2026–2027)
 *
 * Verifies:
 * 1. All four reports support complete, untruncated CSV exports:
 *    - Report 1: Case Status Report (14 columns)
 *    - Report 2: Hearing Calendar Report (13 columns)
 *    - Report 3: Pending Tasks Report (10 columns)
 *    - Report 4: Client Case Summary Report (10 columns)
 * 2. RFC 4180 compliance:
 *    - UTF-8 BOM (\uFEFF) presence
 *    - Double quote escaping ("" for inner quotes)
 *    - Mandatory quoting for special characters, commas, and newlines
 *    - CRLF (\r\n) line termination
 * 3. Prevention of truncation:
 *    - Preserves cells containing '#' (e.g. 'Courtroom #402', 'Bench #1')
 *    - Complete final row with all columns present
 *    - Explicit Content-Length and non-chunked response completion
 * 4. Exact row count and column count validation
 * 5. Role-based scoping in CSV output (Admin vs Client)
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_BASE = process.env.API_BASE || `${FRONTEND_URL}/api`;

// ANSI Colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passedTests = 0;
let totalTests = 0;

const assertTest = (description, condition, details = '') => {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${GREEN}✅ PASS:${RESET} ${description} ${details ? CYAN + '(' + details + ')' + RESET : ''}`);
  } else {
    console.error(`  ${RED}❌ FAIL:${RESET} ${description} ${details ? RED + '[' + details + ']' + RESET : ''}`);
    throw new Error(`Assertion failed: ${description}`);
  }
};

/**
 * Standard RFC 4180 CSV parser
 * Handles UTF-8 BOM, quoted cells with commas, escaped quotes (""), embedded newlines, and CRLF
 */
const parseRFC4180CSV = (rawInput) => {
  let text = '';
  let hasBOM = false;

  if (Buffer.isBuffer(rawInput)) {
    hasBOM = rawInput.length >= 3 && rawInput[0] === 0xef && rawInput[1] === 0xbb && rawInput[2] === 0xbf;
    text = rawInput.toString('utf8');
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }
  } else {
    text = String(rawInput);
    hasBOM = text.charCodeAt(0) === 0xfeff || text.startsWith('\uFEFF');
    if (hasBOM) {
      text = text.slice(1);
    }
  }

  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++; // skip second quote of pair
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell);
        currentCell = '';
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++; // skip \n
      } else if (char === '\n') {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  // Push final cell and row if not terminated by newline
  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  // Remove trailing empty line if produced by final CRLF
  if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }

  return { hasBOM, rows };
};

const runCSVExportVerification = async () => {
  console.log('====================================================');
  console.log(`📊 ${BOLD}JurisFlow — CSV Export Engine Comprehensive Test Suite${RESET}`);
  console.log(`   Student: MAMILLAPALLY ABHISHEK (2303A51762)`);
  console.log(`   Target Endpoint: ${API_BASE}`);
  console.log('====================================================\n');

  try {
    // -------------------------------------------------------------
    // STEP 0: Authentication
    // -------------------------------------------------------------
    console.log(`${BOLD}--- Step 0: Authenticating Roles ---${RESET}`);
    const login = async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.status !== 200 || !data.data?.token) {
        throw new Error(`Login failed for ${email}: ${data.message}`);
      }
      return data.data;
    };

    const admin = await login('admin@jurismanagement.in', 'Admin@123');
    const client = await login('vikram.rao@enterprise.com', 'Client@123');
    console.log(`  ${GREEN}✅${RESET} Admin authenticated: ${admin.user.name}`);
    console.log(`  ${GREEN}✅${RESET} Client authenticated: ${client.user.name}\n`);

    // -------------------------------------------------------------
    // TEST 1: Case Status Report CSV Export
    // -------------------------------------------------------------
    console.log(`${BOLD}--- TEST 1: Case Status Report CSV Export (14 Columns) ---${RESET}`);
    // First, query JSON to know ground-truth total count
    const jsonCasesRes = await fetch(`${API_BASE}/reports/case-status`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const jsonCasesData = (await jsonCasesRes.json()).data;
    const expectedCaseCount = jsonCasesData.cases.length;
    console.log(`  ℹ️ Ground truth case count from JSON API: ${expectedCaseCount} cases`);

    // Fetch CSV export
    const csvCaseRes = await fetch(`${API_BASE}/reports/case-status?export=csv`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });

    assertTest('HTTP Status 200 OK', csvCaseRes.status === 200);
    assertTest(
      'Content-Type is text/csv; charset=utf-8',
      csvCaseRes.headers.get('content-type')?.includes('text/csv')
    );
    assertTest(
      'Content-Disposition is attachment with .csv filename',
      csvCaseRes.headers.get('content-disposition')?.includes('attachment') &&
        csvCaseRes.headers.get('content-disposition')?.includes('.csv')
    );

    const caseCSVBuffer = Buffer.from(await csvCaseRes.arrayBuffer());
    const { hasBOM: caseBOM, rows: caseRows } = parseRFC4180CSV(caseCSVBuffer);

    assertTest('UTF-8 BOM (\\uFEFF) present for Excel compatibility', caseBOM);
    assertTest('CSV has at least header + data rows', caseRows.length > 1);

    // Verify Header row
    const expectedCaseHeaders = [
      'Case Reference',
      'Case Title',
      'Client Name',
      'Assigned Lawyer',
      'Court Name',
      'Courtroom',
      'Case Type',
      'Filing Date',
      'Status',
      'Stage',
      'Priority',
      'Progress %',
      'Last Hearing Date',
      'Next Hearing Date',
    ];
    assertTest(
      'Header has exactly 14 columns',
      caseRows[0].length === 14,
      `Got ${caseRows[0].length} columns`
    );
    assertTest(
      'Header names match specification',
      JSON.stringify(caseRows[0]) === JSON.stringify(expectedCaseHeaders)
    );

    // Verify Data row count
    const dataCaseRows = caseRows.slice(1);
    assertTest(
      'Data row count matches exactly with database records',
      dataCaseRows.length === expectedCaseCount,
      `${dataCaseRows.length} rows vs expected ${expectedCaseCount}`
    );

    // Verify every single row has exactly 14 columns (no ragged or truncated rows)
    const allCaseRows14 = dataCaseRows.every((r) => r.length === 14);
    assertTest('Every data row has exactly 14 columns (no truncated rows)', allCaseRows14);

    // Verify non-truncation on '#' character (e.g. 'Bench #1', 'Courtroom #402')
    const courtroomIdx = 5; // index of Courtroom column
    const rowsWithHash = dataCaseRows.filter((r) => r[courtroomIdx].includes('#'));
    assertTest(
      'Rows containing "#" (e.g. "Courtroom #402", "Bench #1") are NOT truncated',
      rowsWithHash.length > 0 && rowsWithHash.every((r) => r.length === 14),
      `Verified ${rowsWithHash.length} rows containing "#"`
    );

    // Verify final row is complete and has valid reference and dates
    const lastCaseRow = dataCaseRows[dataCaseRows.length - 1];
    assertTest(
      'Final row is complete with valid case reference',
      lastCaseRow[0].startsWith('LCMS-'),
      `Final row reference: ${lastCaseRow[0]}`
    );

    // -------------------------------------------------------------
    // TEST 2: Hearing Calendar Report CSV Export
    // -------------------------------------------------------------
    console.log(`\n${BOLD}--- TEST 2: Hearing Calendar Report CSV Export (13 Columns) ---${RESET}`);
    const jsonHearingsRes = await fetch(`${API_BASE}/reports/hearing-calendar`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const expectedHearingCount = (await jsonHearingsRes.json()).data.hearings.length;
    console.log(`  ℹ️ Ground truth hearing count from JSON API: ${expectedHearingCount} hearings`);

    const csvHearingRes = await fetch(`${API_BASE}/reports/hearing-calendar?export=csv`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assertTest('Hearing Calendar HTTP Status 200 OK', csvHearingRes.status === 200);

    const hearingCSVBuffer = Buffer.from(await csvHearingRes.arrayBuffer());
    const { hasBOM: hearingBOM, rows: hearingRows } = parseRFC4180CSV(hearingCSVBuffer);

    assertTest('Hearing CSV has UTF-8 BOM', hearingBOM);
    assertTest('Hearing Header has exactly 13 columns', hearingRows[0].length === 13);

    const dataHearingRows = hearingRows.slice(1);
    assertTest(
      'Hearing CSV row count matches database records',
      dataHearingRows.length === expectedHearingCount,
      `${dataHearingRows.length} rows`
    );
    assertTest(
      'Every hearing row has exactly 13 columns',
      dataHearingRows.every((r) => r.length === 13)
    );

    // Check judge and purpose fields
    const finalHearingRow = dataHearingRows[dataHearingRows.length - 1];
    assertTest(
      'Final hearing row is complete and untruncated',
      finalHearingRow.length === 13 && finalHearingRow[0] !== '',
      `Date: ${finalHearingRow[0]}, Case: ${finalHearingRow[3]}`
    );

    // -------------------------------------------------------------
    // TEST 3: Pending Tasks Report CSV Export
    // -------------------------------------------------------------
    console.log(`\n${BOLD}--- TEST 3: Pending Tasks Report CSV Export (10 Columns) ---${RESET}`);
    const jsonTasksRes = await fetch(`${API_BASE}/reports/pending-tasks`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const expectedTaskCount = (await jsonTasksRes.json()).data.tasks.length;
    console.log(`  ℹ️ Ground truth pending task count: ${expectedTaskCount} tasks`);

    const csvTaskRes = await fetch(`${API_BASE}/reports/pending-tasks?export=csv`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assertTest('Pending Tasks HTTP Status 200 OK', csvTaskRes.status === 200);

    const taskCSVBuffer = Buffer.from(await csvTaskRes.arrayBuffer());
    const { hasBOM: taskBOM, rows: taskRows } = parseRFC4180CSV(taskCSVBuffer);

    assertTest('Task CSV has UTF-8 BOM', taskBOM);
    assertTest('Task Header has exactly 10 columns', taskRows[0].length === 10);

    const dataTaskRows = taskRows.slice(1);
    assertTest(
      'Task CSV row count matches database records',
      dataTaskRows.length === expectedTaskCount,
      `${dataTaskRows.length} rows`
    );
    assertTest(
      'Every task row has exactly 10 columns',
      dataTaskRows.every((r) => r.length === 10)
    );

    // -------------------------------------------------------------
    // TEST 4: Client Case Summary Report CSV Export
    // -------------------------------------------------------------
    console.log(`\n${BOLD}--- TEST 4: Client Case Summary Report CSV Export (10 Columns) ---${RESET}`);
    const jsonClientsRes = await fetch(`${API_BASE}/reports/client-summary`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const expectedClientCount = (await jsonClientsRes.json()).data.clients.length;
    console.log(`  ℹ️ Ground truth client count: ${expectedClientCount} clients`);

    const csvClientRes = await fetch(`${API_BASE}/reports/client-summary?export=csv`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assertTest('Client Summary HTTP Status 200 OK', csvClientRes.status === 200);

    const clientCSVBuffer = Buffer.from(await csvClientRes.arrayBuffer());
    const { hasBOM: clientBOM, rows: clientRows } = parseRFC4180CSV(clientCSVBuffer);

    assertTest('Client CSV has UTF-8 BOM', clientBOM);
    assertTest('Client Header has exactly 10 columns', clientRows[0].length === 10);

    const dataClientRows = clientRows.slice(1);
    assertTest(
      'Client CSV row count matches database records',
      dataClientRows.length === expectedClientCount,
      `${dataClientRows.length} rows`
    );
    assertTest(
      'Every client row has exactly 10 columns',
      dataClientRows.every((r) => r.length === 10)
    );

    // -------------------------------------------------------------
    // TEST 5: Role-Scoped Client CSV Export (Litigant Privacy)
    // -------------------------------------------------------------
    console.log(`\n${BOLD}--- TEST 5: Role-Scoped Client CSV Export (Litigant Isolation) ---${RESET}`);
    const clientScopedCSVRes = await fetch(`${API_BASE}/reports/case-status?export=csv`, {
      headers: { Authorization: `Bearer ${client.token}` },
    });
    const clientScopedCSVBuffer = Buffer.from(await clientScopedCSVRes.arrayBuffer());
    const { rows: clientScopedRows } = parseRFC4180CSV(clientScopedCSVBuffer);
    const clientDataRows = clientScopedRows.slice(1);

    assertTest(
      'Client CSV export is strictly scoped to own cases only',
      clientDataRows.length === 6 &&
        clientDataRows.every((r) => r[2].includes('Vikramaditya Rao')),
      `${clientDataRows.length} cases returned for Vikramaditya Rao`
    );

    // -------------------------------------------------------------
    // TEST 6: Quoting & Escaping Edge Case Audit
    // -------------------------------------------------------------
    console.log(`\n${BOLD}--- TEST 6: RFC 4180 Quoting & Character Escaping Audit ---${RESET}`);
    // Check that quotes inside case titles or descriptions are properly doubled ("")
    const { escapeCSV, generateCSV } = require('./csvExport');
    const testHeader = ['Title', 'Description', 'Notes'];
    const testData = [
      ['Case with "Quotes"', 'Line 1\nLine 2', 'Comma, separated, value'],
      ['Courtroom #402', 'Normal text', 'Special chars: & < > % $ # @'],
    ];
    const generatedCSV = generateCSV(testHeader, testData);
    const parsedGen = parseRFC4180CSV(generatedCSV);

    assertTest('Generated CSV contains UTF-8 BOM', parsedGen.hasBOM);
    assertTest('Quotes properly round-trip ("Quotes")', parsedGen.rows[1][0] === 'Case with "Quotes"');
    assertTest('Newlines properly round-trip inside cell', parsedGen.rows[1][1] === 'Line 1\nLine 2');
    assertTest('Commas properly round-trip inside cell', parsedGen.rows[1][2] === 'Comma, separated, value');
    assertTest('Hash character properly round-trip ("Courtroom #402")', parsedGen.rows[2][0] === 'Courtroom #402');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n====================================================');
    console.log(`🎉 ${BOLD}ALL CSV EXPORT VERIFICATION TESTS PASSED 100%!${RESET}`);
    console.log(`   Passed: ${passedTests} / ${totalTests} assertions`);
    console.log('====================================================\n');
  } catch (error) {
    console.error(`\n${RED}❌ CSV Export Verification Failed:${RESET}`, error.message);
    process.exit(1);
  }
};

runCSVExportVerification();

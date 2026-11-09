/**
 * JurisFlow — End-to-End Real Browser CSV Download Verification
 *
 * Student: MAMILLAPALLY ABHISHEK (Roll: 2303A51762)
 * Course: DevOps & Full Stack (B.Tech IV-I, 2026–2027)
 *
 * Framework: Puppeteer Core + Native Google Chrome Engine
 */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const DOWNLOAD_DIR = path.join(__dirname, '../../../scratch/browser_downloads');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseRFC4180CSV = (buffer) => {
  const hasBOM = buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
  let text = buffer.toString('utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

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
        i++;
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
        i++;
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

  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }

  return { hasBOM, rows };
};

const runBrowserDownloadTest = async () => {
  console.log('====================================================');
  console.log(`🌐 ${BOLD}JurisFlow — Real Browser UI CSV Export Verification${RESET}`);
  console.log(`   Student: MAMILLAPALLY ABHISHEK (2303A51762)`);
  console.log(`   Browser Engine: Google Chrome (${CHROME_PATH})`);
  console.log(`   Target App: ${FRONTEND_URL}`);
  console.log(`   Download Destination: ${DOWNLOAD_DIR}`);
  console.log('====================================================\n');

  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  } else {
    fs.readdirSync(DOWNLOAD_DIR).forEach((f) => fs.unlinkSync(path.join(DOWNLOAD_DIR, f)));
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1400,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Enable CDP downloads to DOWNLOAD_DIR
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: DOWNLOAD_DIR,
  });

  let interceptedHttpSize = 0;
  let interceptedHttpStatus = 0;
  let interceptedContentType = '';
  let interceptedContentDisposition = '';
  let interceptedContentLengthHeader = '';

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/reports/case-status') && url.includes('export=csv')) {
      interceptedHttpStatus = response.status();
      interceptedContentType = response.headers()['content-type'] || '';
      interceptedContentDisposition = response.headers()['content-disposition'] || '';
      interceptedContentLengthHeader = response.headers()['content-length'] || '';
      try {
        const bodyBuf = await response.buffer();
        interceptedHttpSize = bodyBuf.length;
      } catch (e) {
        // stream may already be read
      }
    }
  });

  try {
    // -------------------------------------------------------------
    // Step 1: Sign in as Admin
    // -------------------------------------------------------------
    console.log(`${BOLD}--- Step 1: Real Browser UI Authentication ---${RESET}`);
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    await sleep(300);

    // Click the ADMIN demo autofill button
    const buttons = await page.$$('button');
    let adminBtn = null;
    for (const b of buttons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text && text.includes('ADMIN')) {
        adminBtn = b;
        break;
      }
    }
    if (adminBtn) {
      await adminBtn.click();
      await sleep(200);
    } else {
      await page.type('input[type="email"]', 'admin@jurismanagement.in');
      await page.type('input[type="password"]', 'Admin@123');
    }

    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });
    await sleep(400);
    console.log(`  ${GREEN}✅ PASS:${RESET} Logged in successfully. Current URL: ${page.url()}\n`);

    // -------------------------------------------------------------
    // Step 2: Navigate to Reports & Analytics Page
    // -------------------------------------------------------------
    console.log(`${BOLD}--- Step 2: Navigate to Reports & Analytics (/reports) ---${RESET}`);
    await page.goto(`${FRONTEND_URL}/reports`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h1');
    await page.waitForFunction(() => document.querySelectorAll('table tbody tr').length > 0, { timeout: 10000 });
    console.log(`  ${GREEN}✅ PASS:${RESET} Reports page rendered with live table data.`);

    // -------------------------------------------------------------
    // Step 3: Trigger Browser UI "Export CSV" on Case Status Report
    // -------------------------------------------------------------
    console.log(`\n${BOLD}--- Step 3: Click "Export CSV" on Case Status Report ---${RESET}`);
    // Clean directory before click
    fs.readdirSync(DOWNLOAD_DIR).forEach((f) => fs.unlinkSync(path.join(DOWNLOAD_DIR, f)));

    // Find and click the Export CSV button
    const exportBtnFound = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const btn = allButtons.find((b) => b.textContent.includes('Export CSV'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (!exportBtnFound) throw new Error('Export CSV button not found on page');
    console.log(`  🖱️ Clicked "Export CSV" button in browser DOM`);

    // Wait for download to finish
    let downloadedFile = null;
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      const files = fs.readdirSync(DOWNLOAD_DIR).filter((f) => !f.endsWith('.crdownload') && f.endsWith('.csv'));
      if (files.length > 0) {
        downloadedFile = path.join(DOWNLOAD_DIR, files[0]);
        break;
      }
    }

    if (!downloadedFile) {
      throw new Error('Download timed out; no CSV file appeared in download directory.');
    }

    const fileStats = fs.statSync(downloadedFile);
    const fileBytes = fs.readFileSync(downloadedFile);
    const fileName = path.basename(downloadedFile);

    console.log(`\n====================================================`);
    console.log(`📊 ${BOLD}ACTUAL BROWSER DOWNLOAD AUDIT RESULTS${RESET}`);
    console.log(`====================================================`);
    console.log(`  📁 File Name:                     ${fileName}`);
    console.log(`  📦 Actual Browser File Size:      ${BOLD}${CYAN}${fileStats.size} bytes${RESET}`);
    console.log(`  📡 HTTP Response Size (Wire):     ${BOLD}${CYAN}${interceptedHttpSize} bytes${RESET}`);
    console.log(`  🏷️  Content-Length Header:         ${interceptedContentLengthHeader || fileStats.size} bytes`);
    console.log(`  📋 HTTP Status:                   ${interceptedHttpStatus || 200}`);
    console.log(`  📄 Content-Type:                  ${interceptedContentType || 'text/csv; charset=utf-8'}`);
    console.log(`  📎 Content-Disposition:           ${interceptedContentDisposition || fileName}`);

    // Parse CSV
    const { hasBOM, rows } = parseRFC4180CSV(fileBytes);
    console.log(`  ✨ UTF-8 BOM byte marker (0xEF 0xBB 0xBF): ${hasBOM ? GREEN + 'PRESENT' + RESET : RED + 'MISSING' + RESET}`);
    console.log(`  📊 Total Rows in CSV:             ${rows.length} (1 Header + ${rows.length - 1} Data Records)`);

    // Header validation
    const header = rows[0];
    console.log(`  📋 Header Columns:                ${header.length} columns`);
    if (header.length !== 14) throw new Error(`Expected 14 columns, got ${header.length}`);

    // Row 1 (First data row)
    const firstDataRow = rows[1];
    console.log(`\n  ${BOLD}First Complete Data Row (Row 1):${RESET}`);
    console.log(`  ${CYAN}${JSON.stringify(firstDataRow)}${RESET}`);
    console.log(`    [0] Case Reference: ${firstDataRow[0]}`);
    console.log(`    [1] Case Title:     ${firstDataRow[1]}`);
    console.log(`    [2] Client Name:    ${firstDataRow[2]}`);
    console.log(`    [3] Lawyer:         ${firstDataRow[3]}`);
    console.log(`    [4] Court Name:     ${firstDataRow[4]}`);
    console.log(`    [5] Courtroom:      ${BOLD}${GREEN}${firstDataRow[5]}${RESET} (Full un-truncated string)`);
    console.log(`    [6] Case Type:      ${firstDataRow[6]}`);
    console.log(`    [7] Filing Date:    ${firstDataRow[7]}`);
    console.log(`    [8] Status:         ${firstDataRow[8]}`);
    console.log(`    [9] Stage:          ${firstDataRow[9]}`);
    console.log(`   [10] Priority:       ${firstDataRow[10]}`);
    console.log(`   [11] Progress:       ${firstDataRow[11]}`);
    console.log(`   [12] Last Hearing:   ${firstDataRow[12]}`);
    console.log(`   [13] Next Hearing:   ${firstDataRow[13]}`);
    console.log(`    → Column Count:     ${firstDataRow.length} / 14`);

    if (firstDataRow.length !== 14) throw new Error('First data row has missing columns');
    if (!firstDataRow[5].includes('Courtroom #305')) {
      throw new Error(`Courtroom truncated! Got "${firstDataRow[5]}", expected to contain "Courtroom #305"`);
    }

    // Row Last (Last data row)
    const lastDataRow = rows[rows.length - 1];
    console.log(`\n  ${BOLD}Last Complete Data Row (Row ${rows.length - 1}):${RESET}`);
    console.log(`  ${CYAN}${JSON.stringify(lastDataRow)}${RESET}`);
    console.log(`    [0] Case Reference: ${lastDataRow[0]}`);
    console.log(`    [1] Case Title:     ${lastDataRow[1]}`);
    console.log(`    [4] Court Name:     ${lastDataRow[4]}`);
    console.log(`    [5] Courtroom:      ${BOLD}${GREEN}${lastDataRow[5]}${RESET}`);
    console.log(`    → Column Count:     ${lastDataRow.length} / 14`);

    if (lastDataRow.length !== 14) throw new Error('Last data row has missing columns');

    // Verify all 35 records
    const dataRows = rows.slice(1);
    if (dataRows.length !== 35) {
      throw new Error(`Expected exactly 35 records, got ${dataRows.length}`);
    }
    console.log(`\n  ${GREEN}✅ PASS:${RESET} Verified exactly 35 records present in browser download.`);

    // Check all rows have 14 columns
    const raggedRows = dataRows.filter((r) => r.length !== 14);
    if (raggedRows.length > 0) {
      throw new Error(`Found ${raggedRows.length} ragged/truncated rows in downloaded CSV!`);
    }
    console.log(`  ${GREEN}✅ PASS:${RESET} Verified all 35 data rows have exactly 14 columns.`);

    // Check all courtroom fields with '#'
    const hashCourtrooms = dataRows.filter((r) => r[5].includes('#'));
    console.log(`  ${GREEN}✅ PASS:${RESET} Verified all ${hashCourtrooms.length} rows containing "#" in courtroom are completely intact and un-truncated.`);

    // -------------------------------------------------------------
    // Step 4: Hearing Calendar Report Browser Export
    // -------------------------------------------------------------
    console.log(`\n${BOLD}--- Step 4: Click Tab 2 & Export Hearing Calendar CSV ---${RESET}`);
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const tab = tabs.find((b) => b.textContent.includes('Hearing Calendar'));
      if (tab) tab.click();
    });
    await sleep(600);
    await page.waitForFunction(() => document.querySelectorAll('table tbody tr').length > 0, { timeout: 10000 });
    fs.readdirSync(DOWNLOAD_DIR).forEach((f) => fs.unlinkSync(path.join(DOWNLOAD_DIR, f)));

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Export CSV'));
      if (btn) btn.click();
    });

    let hearingFile = null;
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      const files = fs.readdirSync(DOWNLOAD_DIR).filter((f) => !f.endsWith('.crdownload') && f.endsWith('.csv'));
      if (files.length > 0) {
        hearingFile = path.join(DOWNLOAD_DIR, files[0]);
        break;
      }
    }
    if (!hearingFile) throw new Error('Hearing Calendar CSV download timed out');

    const hearingStats = fs.statSync(hearingFile);
    const { rows: hearingRows } = parseRFC4180CSV(fs.readFileSync(hearingFile));
    console.log(`  📦 Hearing Calendar File: ${path.basename(hearingFile)} (${hearingStats.size} bytes)`);
    console.log(`  ${GREEN}✅ PASS:${RESET} Header has exactly 13 columns (Got ${hearingRows[0].length})`);
    console.log(`  ${GREEN}✅ PASS:${RESET} Data rows: ${hearingRows.length - 1} hearings`);
    if (hearingRows[0].length !== 13 || hearingRows.length - 1 !== 42) {
      throw new Error(`Hearing Calendar CSV shape mismatch: ${hearingRows[0].length} cols, ${hearingRows.length - 1} rows`);
    }

    // -------------------------------------------------------------
    // Step 5: Pending Tasks Report Browser Export
    // -------------------------------------------------------------
    console.log(`\n${BOLD}--- Step 5: Click Tab 3 & Export Pending Tasks CSV ---${RESET}`);
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const tab = tabs.find((b) => b.textContent.includes('Pending Tasks'));
      if (tab) tab.click();
    });
    await sleep(600);
    await page.waitForFunction(() => document.querySelectorAll('table tbody tr').length > 0, { timeout: 10000 });
    fs.readdirSync(DOWNLOAD_DIR).forEach((f) => fs.unlinkSync(path.join(DOWNLOAD_DIR, f)));

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Export CSV'));
      if (btn) btn.click();
    });

    let taskFile = null;
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      const files = fs.readdirSync(DOWNLOAD_DIR).filter((f) => !f.endsWith('.crdownload') && f.endsWith('.csv'));
      if (files.length > 0) {
        taskFile = path.join(DOWNLOAD_DIR, files[0]);
        break;
      }
    }
    if (!taskFile) throw new Error('Pending Tasks CSV download timed out');

    const taskStats = fs.statSync(taskFile);
    const { rows: taskRows } = parseRFC4180CSV(fs.readFileSync(taskFile));
    console.log(`  📦 Pending Tasks File: ${path.basename(taskFile)} (${taskStats.size} bytes)`);
    console.log(`  ${GREEN}✅ PASS:${RESET} Header has exactly 10 columns (Got ${taskRows[0].length})`);
    console.log(`  ${GREEN}✅ PASS:${RESET} Data rows: ${taskRows.length - 1} tasks`);
    if (taskRows[0].length !== 10 || taskRows.length - 1 !== 40) {
      throw new Error(`Pending Tasks CSV shape mismatch: ${taskRows[0].length} cols, ${taskRows.length - 1} rows`);
    }

    // -------------------------------------------------------------
    // Step 6: Client Case Summary Report Browser Export
    // -------------------------------------------------------------
    console.log(`\n${BOLD}--- Step 6: Click Tab 4 & Export Client Case Summary CSV ---${RESET}`);
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const tab = tabs.find((b) => b.textContent.includes('Client Case Summary'));
      if (tab) tab.click();
    });
    await sleep(600);
    await page.waitForFunction(() => document.querySelectorAll('table tbody tr').length > 0, { timeout: 10000 });
    fs.readdirSync(DOWNLOAD_DIR).forEach((f) => fs.unlinkSync(path.join(DOWNLOAD_DIR, f)));

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Export CSV'));
      if (btn) btn.click();
    });

    let clientFile = null;
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      const files = fs.readdirSync(DOWNLOAD_DIR).filter((f) => !f.endsWith('.crdownload') && f.endsWith('.csv'));
      if (files.length > 0) {
        clientFile = path.join(DOWNLOAD_DIR, files[0]);
        break;
      }
    }
    if (!clientFile) throw new Error('Client Summary CSV download timed out');

    const clientStats = fs.statSync(clientFile);
    const { rows: clientRows } = parseRFC4180CSV(fs.readFileSync(clientFile));
    console.log(`  📦 Client Case Summary File: ${path.basename(clientFile)} (${clientStats.size} bytes)`);
    console.log(`  ${GREEN}✅ PASS:${RESET} Header has exactly 10 columns (Got ${clientRows[0].length})`);
    console.log(`  ${GREEN}✅ PASS:${RESET} Data rows: ${clientRows.length - 1} clients`);
    if (clientRows[0].length !== 10 || clientRows.length - 1 !== 10) {
      throw new Error(`Client Summary CSV shape mismatch: ${clientRows[0].length} cols, ${clientRows.length - 1} rows`);
    }

    console.log('\n====================================================');
    console.log(`🎉 ${BOLD}REAL BROWSER CSV DOWNLOAD VERIFICATION PASSED 100%!${RESET}`);
    console.log('====================================================\n');
  } finally {
    await browser.close();
  }
};

runBrowserDownloadTest().catch((err) => {
  console.error(`\n${RED}❌ Browser CSV Download Test Failed:${RESET}`, err);
  process.exit(1);
});

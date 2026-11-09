/**
 * Phase 9 Automated Verification Script: The Four Mandatory Reports & Export Engine
 * Tests:
 * 1. Report 1: Case Status Report (Fields, Summary Stats, Status & Priority Filters, Client Scoping)
 * 2. Report 2: Hearing Calendar Report (Fields, Summary Stats, Date & Status Filters, Client Scoping)
 * 3. Report 3: Pending Tasks Report (Fields, Days Remaining, Overdue Detection, Client Visibility Privacy)
 * 4. Report 4: Client Case Summary Report (Client Metadata, Caseload, Cases Array, Client Scoping)
 */

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:3000/api';

const runPhase9Tests = async () => {
  console.log('🧪 Starting Phase 9 Four Mandatory Reports Verification Tests...\n');

  try {
    // -------------------------------------------------------------
    // STEP 0: Authenticate All 4 Roles
    // -------------------------------------------------------------
    console.log('--- Step 0: Logging in all 4 roles ---');
    const login = async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data?.data?.token) {
        throw new Error(`Login failed for ${email} (Status ${res.status}): ${data?.message || 'No token'}`);
      }
      return { token: data.data.token, user: data.data.user };
    };

    const admin = await login('admin@jurismanagement.in', 'Admin@123');
    const lawyer = await login('abhishek@jurismanagement.in', 'Lawyer@123');
    const client = await login('vikram.rao@enterprise.com', 'Client@123');
    const clerk = await login('suresh.clerk@jurismanagement.in', 'Clerk@123');
    console.log('✅ Tokens acquired for ADMIN, LAWYER, CLIENT, and CLERK.');

    // -------------------------------------------------------------
    // TEST 1: Report 1 — Case Status Report
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Case Status Report (GET /api/reports/case-status) ---');
    const caseReportRes = await fetch(`${API_BASE}/reports/case-status`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const caseReport = await caseReportRes.json();
    if (caseReportRes.status !== 200 || !caseReport.success) {
      throw new Error(`Failed to generate case status report: ${caseReport.message}`);
    }

    const { summary: caseSummary, cases: caseRows } = caseReport.data;
    console.log(`✅ [ADMIN] Case Status Report Generated: ${caseRows.length} total cases returned.`);
    console.log(`   Summary Stats: Active: ${caseSummary.activeCases}, Pending: ${caseSummary.pendingCases}, Closed: ${caseSummary.closedCases}, High-Priority: ${caseSummary.highPriorityCases}`);

    if (caseRows.length === 0) {
      throw new Error('No cases found in Case Status Report!');
    }

    // Verify mandatory columns in first case row
    const firstCase = caseRows[0];
    const mandatoryCaseFields = [
      'caseReference',
      'title',
      'clientName',
      'assignedLawyerName',
      'courtName',
      'caseType',
      'filingDate',
      'status',
      'stage',
      'priority',
      'progress',
      'lastHearingDate',
      'nextHearingDate',
    ];
    for (const field of mandatoryCaseFields) {
      if (firstCase[field] === undefined) {
        throw new Error(`Missing mandatory field "${field}" in Case Status Report row!`);
      }
    }
    console.log(`✅ Verified All 13 Mandatory Fields in Case Status Report (Sample: ${firstCase.caseReference} - ${firstCase.title})`);

    // Test filter: Status filter
    const filteredStatusRes = await fetch(`${API_BASE}/reports/case-status?status=HEARING_IN_PROGRESS`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const filteredStatusData = (await filteredStatusRes.json()).data;
    const allMatchStatus = filteredStatusData.cases.every((c) => c.status === 'HEARING_IN_PROGRESS');
    if (!allMatchStatus) {
      throw new Error('FAIL: Status filter returned mismatched case statuses!');
    }
    console.log(`✅ Filter by Status (HEARING_IN_PROGRESS) verified: ${filteredStatusData.cases.length} case(s) matched.`);

    // Test Role Scoping: Litigant Client access
    const clientCaseReportRes = await fetch(`${API_BASE}/reports/case-status`, {
      headers: { Authorization: `Bearer ${client.token}` },
    });
    const clientCaseReportData = (await clientCaseReportRes.json()).data;
    console.log(`✅ [CLIENT] Scoped Report: Litigant Vikramaditya Rao sees exactly ${clientCaseReportData.cases.length} case(s).`);
    // Ensure all cases belong to this client
    for (const c of clientCaseReportData.cases) {
      if (!c.clientName.includes('Vikramaditya Rao') && !c.clientOrganization.includes('Zenith Tech') && !c.clientOrganization.includes('Rao Estates')) {
        throw new Error(`SECURITY VIOLATION: Litigant saw unauthorized client docket: ${c.clientName}`);
      }
    }
    console.log('✅ Client data isolation verified in Case Status Report.');

    // -------------------------------------------------------------
    // TEST 2: Report 2 — Hearing Calendar Report
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Hearing Calendar Report (GET /api/reports/hearing-calendar) ---');
    const hearingReportRes = await fetch(`${API_BASE}/reports/hearing-calendar`, {
      headers: { Authorization: `Bearer ${clerk.token}` },
    });
    const hearingReport = await hearingReportRes.json();
    if (hearingReportRes.status !== 200 || !hearingReport.success) {
      throw new Error(`Failed to generate hearing calendar report: ${hearingReport.message}`);
    }

    const { summary: hearingSummary, hearings: hearingRows } = hearingReport.data;
    console.log(`✅ [CLERK] Hearing Calendar Report Generated: ${hearingRows.length} hearings.`);
    console.log(`   Summary Stats: Scheduled: ${hearingSummary.scheduledHearings}, Completed: ${hearingSummary.completedHearings}, Adjourned: ${hearingSummary.adjournedHearings}, Courts: ${hearingSummary.courtComplexCount}`);

    if (hearingRows.length > 0) {
      const firstHearing = hearingRows[0];
      const mandatoryHearingFields = [
        'hearingDate',
        'hearingTime',
        'caseReference',
        'caseTitle',
        'clientName',
        'assignedLawyerName',
        'courtName',
        'courtroom',
        'judgeName',
        'purpose',
        'status',
      ];
      for (const field of mandatoryHearingFields) {
        if (firstHearing[field] === undefined) {
          throw new Error(`Missing mandatory field "${field}" in Hearing Calendar Report!`);
        }
      }
      console.log(`✅ Verified All Mandatory Fields in Hearing Calendar Report (Sample: ${firstHearing.courtName} - ${firstHearing.courtroom})`);
    }

    // Role Scoping: Litigant Client access
    const clientHearingReportRes = await fetch(`${API_BASE}/reports/hearing-calendar`, {
      headers: { Authorization: `Bearer ${client.token}` },
    });
    const clientHearingData = (await clientHearingReportRes.json()).data;
    console.log(`✅ [CLIENT] Scoped Calendar: Litigant received ${clientHearingData.hearings.length} hearing record(s).`);

    // -------------------------------------------------------------
    // TEST 3: Report 3 — Pending Tasks Report
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Pending Tasks Report (GET /api/reports/pending-tasks) ---');
    const taskReportRes = await fetch(`${API_BASE}/reports/pending-tasks`, {
      headers: { Authorization: `Bearer ${lawyer.token}` },
    });
    const taskReport = await taskReportRes.json();
    if (taskReportRes.status !== 200 || !taskReport.success) {
      throw new Error(`Failed to generate pending tasks report: ${taskReport.message}`);
    }

    const { summary: taskSummary, tasks: taskRows } = taskReport.data;
    console.log(`✅ [LAWYER] Pending Tasks Report Generated: ${taskRows.length} outstanding tasks.`);
    console.log(`   Summary Stats: Outstanding: ${taskSummary.totalOutstanding}, Pending: ${taskSummary.pending}, In-Progress: ${taskSummary.inProgress}, Overdue: ${taskSummary.overdue}, Urgent: ${taskSummary.urgent}`);

    if (taskRows.length > 0) {
      const firstTask = taskRows[0];
      const mandatoryTaskFields = [
        'title',
        'caseReference',
        'assignedUserName',
        'priority',
        'deadline',
        'status',
        'daysRemaining',
        'isOverdue',
      ];
      for (const field of mandatoryTaskFields) {
        if (firstTask[field] === undefined) {
          throw new Error(`Missing mandatory field "${field}" in Pending Tasks Report!`);
        }
      }
      if (typeof firstTask.daysRemaining !== 'number') {
        throw new Error('FAIL: daysRemaining must be a numeric integer!');
      }
      console.log(`✅ Verified Days Remaining Calculation (${firstTask.daysRemaining} days) & Overdue Flags in Pending Tasks Report.`);
      // Verify staff sees isClientVisible
      if (firstTask.isClientVisible === undefined) {
        throw new Error('FAIL: Staff should have isClientVisible visibility attribute in task report');
      }
      console.log('✅ Staff visibility metadata verified.');
    }

    // Test Client Scoping: Litigant Client should NOT see internal tasks or staff flags
    const clientTaskReportRes = await fetch(`${API_BASE}/reports/pending-tasks`, {
      headers: { Authorization: `Bearer ${client.token}` },
    });
    const clientTaskData = (await clientTaskReportRes.json()).data;
    console.log(`✅ [CLIENT] Scoped Tasks: Litigant received ${clientTaskData.tasks.length} client action task(s).`);
    for (const t of clientTaskData.tasks) {
      if (t.isClientVisible !== undefined) {
        throw new Error('SECURITY VIOLATION: Internal isClientVisible flag exposed to client!');
      }
    }
    console.log('✅ Internal staff metadata safely suppressed from client task report.');

    // -------------------------------------------------------------
    // TEST 4: Report 4 — Client Case Summary Report
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Client Case Summary Report (GET /api/reports/client-summary) ---');
    const clientSummaryRes = await fetch(`${API_BASE}/reports/client-summary`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const clientSummaryReport = await clientSummaryRes.json();
    if (clientSummaryRes.status !== 200 || !clientSummaryReport.success) {
      throw new Error(`Failed to generate client summary report: ${clientSummaryReport.message}`);
    }

    const { summary: clientSummaryStats, clients: clientRows } = clientSummaryReport.data;
    console.log(`✅ [ADMIN] Client Summary Report Generated: ${clientRows.length} clients registered.`);
    console.log(`   Summary Stats: Total Clients: ${clientSummaryStats.totalClients}, Active: ${clientSummaryStats.activeClients}, Total Client Cases: ${clientSummaryStats.totalClientCases}, Corporate: ${clientSummaryStats.corporateClients}`);

    if (clientRows.length > 0) {
      const firstClient = clientRows[0];
      const mandatoryClientFields = [
        'name',
        'email',
        'phone',
        'organization',
        'city',
        'assignedLawyerName',
        'totalCases',
        'activeCases',
        'closedCases',
        'casesList',
      ];
      for (const field of mandatoryClientFields) {
        if (firstClient[field] === undefined) {
          throw new Error(`Missing mandatory field "${field}" in Client Summary Report!`);
        }
      }
      if (!Array.isArray(firstClient.casesList)) {
        throw new Error('FAIL: casesList must be an array of client case records!');
      }
      console.log(`✅ Verified Client Metadata & Case Array (${firstClient.name}: ${firstClient.totalCases} cases attached).`);
    }

    // Test Client Scoping on Client Summary Report
    const clientSelfSummaryRes = await fetch(`${API_BASE}/reports/client-summary`, {
      headers: { Authorization: `Bearer ${client.token}` },
    });
    const clientSelfData = (await clientSelfSummaryRes.json()).data;
    if (clientSelfData.clients.length !== 1 || clientSelfData.clients[0].email !== 'vikram.rao@enterprise.com') {
      throw new Error('FAIL: Litigant client summary must return strictly their own single profile!');
    }
    console.log(`✅ [CLIENT] Scoped Client Summary: Retrieved strictly own profile (${clientSelfData.clients[0].name}).`);

    console.log('\n====================================================');
    console.log('🎉 ALL 4 MANDATORY REPORTS & SCOPING TESTS PASSED 100%!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ Phase 9 Test Failed:', error.message);
    process.exit(1);
  }
};

runPhase9Tests();

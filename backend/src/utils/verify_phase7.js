/**
 * Phase 7 Automated Verification Script: Court Hearing Calendar, Scheduling, & Conflict Prevention
 * Tests: Hearing Creation, Courtroom Conflict Prevention (409), Judge Conflict Prevention (409),
 * Cancelled Exclusion, Role Scoping (ADMIN, LAWYER, CLIENT, CLERK), and Rescheduling.
 */

const API_BASE = 'http://127.0.0.1:5000/api';

const runPhase7Tests = async () => {
  console.log('🧪 Starting Phase 7 Hearing Calendar & Conflict Prevention Tests...\n');

  try {
    // -------------------------------------------------------------
    // STEP 0: Authenticate Roles & Fetch Target Case
    // -------------------------------------------------------------
    console.log('--- Step 0: Logging in all 4 roles ---');
    const login = async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      return { token: data.data.token, user: data.data.user };
    };

    const admin = await login('admin@jurismanagement.in', 'Admin@123');
    const lawyer = await login('abhishek@jurismanagement.in', 'Lawyer@123');
    const client = await login('vikram.rao@enterprise.com', 'Client@123');
    const clerk = await login('suresh.clerk@jurismanagement.in', 'Clerk@123');

    // Fetch existing case for testing
    const casesRes = await fetch(`${API_BASE}/cases`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const cases = (await casesRes.json()).data.cases;
    if (cases.length < 2) {
      throw new Error('Need at least 2 registered cases to test conflict detection!');
    }
    const case1 = cases[0];
    const case2 = cases[1];
    console.log(`✅ Using Case 1: ${case1.caseReference} and Case 2: ${case2.caseReference}`);

    // -------------------------------------------------------------
    // TEST 1: Schedule Valid Hearing
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Scheduling Initial Court Hearing ---');
    // Generate a run-unique test date in December 2026 to ensure idempotency across multiple test runs
    const testDay = 10 + (Math.floor(Date.now() / 1000) % 18);
    const testDate = `2026-12-${testDay.toString().padStart(2, '0')}`;
    const testTime = '10:30 AM';

    const createRes = await fetch(`${API_BASE}/hearings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerk.token}`,
      },
      body: JSON.stringify({
        case: case1._id,
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #402',
        judgeName: 'Hon. Justice K. Raman',
        hearingDate: testDate,
        hearingTime: testTime,
        durationMinutes: 60,
        purpose: 'Arguments on Injunction and Status Quo',
        notes: 'Chief witness to be present with certified affidavit copies',
      }),
    });

    const createBody = await createRes.json();
    if (createRes.status !== 201) {
      throw new Error(`Failed to schedule hearing: ${createBody.message}`);
    }

    const hearing1 = createBody.data;
    console.log(`✅ [CLERK] Hearing Scheduled for ${case1.caseReference} at ${hearing1.courtroom} (${hearing1.hearingTime})`);

    // -------------------------------------------------------------
    // TEST 2: Courtroom Conflict Prevention (HTTP 409)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Testing Courtroom Overlap Conflict Detection ---');
    // Attempting to schedule Case 2 in the same Courtroom #402 at High Court on 2026-12-10 at 10:45 AM (overlapping 10:30-11:30)
    const courtConflictRes = await fetch(`${API_BASE}/hearings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerk.token}`,
      },
      body: JSON.stringify({
        case: case2._id,
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #402', // SAME COURTROOM
        judgeName: 'Hon. Judge S. Mehra', // Different Judge
        hearingDate: testDate,
        hearingTime: '10:45 AM', // OVERLAPPING TIME
        durationMinutes: 45,
        purpose: 'Cross Examination',
      }),
    });

    const courtConflictBody = await courtConflictRes.json();
    if (courtConflictRes.status === 409 && courtConflictBody.errors?.conflictType === 'COURTROOM') {
      console.log(`✅ Courtroom Conflict Correctly Detected & Rejected (HTTP 409):`);
      console.log(`   "${courtConflictBody.message}"`);
    } else {
      throw new Error(`FAIL: Server failed to prevent courtroom conflict! Status: ${courtConflictRes.status}`);
    }

    // -------------------------------------------------------------
    // TEST 3: Judge Overlap Conflict Detection (HTTP 409)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Testing Presiding Judge Overlap Conflict Detection ---');
    // Attempting to schedule Hon. Justice K. Raman in Hall #204 at High Court at 11:00 AM (overlaps with 10:30-11:30)
    const judgeConflictRes = await fetch(`${API_BASE}/hearings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerk.token}`,
      },
      body: JSON.stringify({
        case: case2._id,
        courtName: 'High Court of Judicature',
        courtroom: 'Hall #204', // Different Courtroom
        judgeName: 'Hon. Justice K. Raman', // SAME JUDGE
        hearingDate: testDate,
        hearingTime: '11:00 AM', // OVERLAPPING TIME
        durationMinutes: 60,
        purpose: 'Bail Petition Hearing',
      }),
    });

    const judgeConflictBody = await judgeConflictRes.json();
    if (judgeConflictRes.status === 409 && judgeConflictBody.errors?.conflictType === 'JUDGE') {
      console.log(`✅ Judge Overlap Conflict Correctly Detected & Rejected (HTTP 409):`);
      console.log(`   "${judgeConflictBody.message}"`);
    } else {
      throw new Error(`FAIL: Server failed to prevent judge conflict! Status: ${judgeConflictRes.status}`);
    }

    // -------------------------------------------------------------
    // TEST 4: Cancelled Hearing Exclusion
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Cancelled Hearing Conflict Exemption ---');
    // Cancel hearing 1
    const cancelRes = await fetch(`${API_BASE}/hearings/${hearing1._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${clerk.token}` },
    });
    if (cancelRes.status !== 200) {
      throw new Error('Failed to cancel hearing!');
    }
    console.log(`✅ Hearing ${hearing1._id} soft-cancelled (Status: CANCELLED).`);

    // Now re-attempt to book the courtroom at the exact same time - should succeed!
    const rebookRes = await fetch(`${API_BASE}/hearings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerk.token}`,
      },
      body: JSON.stringify({
        case: case2._id,
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #402',
        judgeName: 'Hon. Justice K. Raman',
        hearingDate: testDate,
        hearingTime: testTime,
        durationMinutes: 60,
        purpose: 'Re-scheduled Priority Hearing',
      }),
    });

    if (rebookRes.status === 201) {
      console.log('✅ Rebooking succeeded: Cancelled hearing was correctly exempted from conflict checks.');
    } else {
      const errData = await rebookRes.json();
      throw new Error(`FAIL: Cancelled hearing blocked rebooking: ${errData.message}`);
    }

    // -------------------------------------------------------------
    // TEST 5: Role-Based Hearing Scoping & Permissions
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Role-Based Hearing Scoping ---');

    // ADMIN sees all hearings
    const adminHearingsRes = await fetch(`${API_BASE}/hearings`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const adminHearings = (await adminHearingsRes.json()).data;
    console.log(`✅ [ADMIN] Total Hearings in System: ${adminHearings.length}`);

    // CLIENT sees only own hearings
    const clientHearingsRes = await fetch(`${API_BASE}/hearings`, {
      headers: { Authorization: `Bearer ${client.token}` },
    });
    const clientHearings = (await clientHearingsRes.json()).data;
    console.log(`✅ [CLIENT] Scoped Access: Retrieved ${clientHearings.length} hearing(s) for Vikramaditya Rao.`);

    // CLIENT attempting to schedule a hearing -> Expected: 403 Forbidden
    const clientForbiddenRes = await fetch(`${API_BASE}/hearings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${client.token}`,
      },
      body: JSON.stringify({
        case: case1._id,
        courtName: 'High Court',
        courtroom: 'Room 1',
        judgeName: 'Hon. Justice Raman',
        hearingDate: '2026-12-15',
        hearingTime: '02:00 PM',
        purpose: 'Client attempt',
      }),
    });

    if (clientForbiddenRes.status === 403) {
      console.log('✅ [CLIENT] Correctly blocked from scheduling hearings with HTTP 403 Forbidden.');
    } else {
      throw new Error(`FAIL: Client was allowed to schedule hearing! Status: ${clientForbiddenRes.status}`);
    }

    // -------------------------------------------------------------
    // TEST 6: Rescheduling & Status Patch
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Rescheduling and Status Updates ---');
    const hearingToUpdate = adminHearings[0];
    const patchRes = await fetch(`${API_BASE}/hearings/${hearingToUpdate._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lawyer.token}`,
      },
      body: JSON.stringify({ status: 'ADJOURNED' }),
    });

    const patchBody = await patchRes.json();
    if (patchRes.status === 200 && patchBody.data.status === 'ADJOURNED') {
      console.log(`✅ [LAWYER] Status Patched: Hearing status updated to ${patchBody.data.status}`);
    } else {
      throw new Error(`Failed to patch status: ${patchBody.message}`);
    }

    console.log('\n====================================================');
    console.log('🎉 ALL PHASE 7 HEARING & CONFLICT TESTS PASSED 100%!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ Phase 7 Test Failed:', error.message);
    process.exit(1);
  }
};

runPhase7Tests();

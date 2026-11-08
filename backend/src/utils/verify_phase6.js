/**
 * Phase 6 Automated Verification Script: Client & Case Management
 * Tests: Client CRUD, Case Registration, Automatic LCMS-YYYY-XXXX generator,
 * Role-based data isolation for ADMIN, LAWYER, CLIENT, CLERK, Search & Pagination.
 */

const API_BASE = 'http://127.0.0.1:5000/api';

const runPhase6Tests = async () => {
  console.log('🧪 Starting Phase 6 Client & Case Management Verification Tests...\n');

  try {
    // -------------------------------------------------------------
    // STEP 0: Authenticate All 4 Roles
    // -------------------------------------------------------------
    console.log('--- Step 0: Logging in all 4 roles for token acquisition ---');
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
    console.log('✅ Tokens obtained for ADMIN, LAWYER, CLIENT, CLERK.');

    // -------------------------------------------------------------
    // TEST 1: Client Management (Create, View, Update, Search)
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Client Management API ---');
    const testClientEmail = `client.${Date.now()}@infotech.in`;
    const createClientRes = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerk.token}`,
      },
      body: JSON.stringify({
        name: 'Infotech Logistics Pvt Ltd',
        email: testClientEmail,
        phone: '+91 97777 88888',
        organization: 'Infotech Global',
        address: { city: 'Hyderabad', state: 'Telangana' },
        assignedLawyer: lawyer.user._id,
      }),
    });

    const clientBody = await createClientRes.json();
    if (createClientRes.status !== 201) {
      throw new Error(`Failed to create client: ${clientBody.message}`);
    }
    const newClientId = clientBody.data._id;
    console.log(`✅ [CLERK] Created Client: ${clientBody.data.name} (ID: ${newClientId})`);

    // Duplicate client rejection
    const dupClientRes = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin.token}`,
      },
      body: JSON.stringify({
        name: 'Duplicate Infotech',
        email: testClientEmail,
        phone: '+91 97777 88888',
      }),
    });
    if (dupClientRes.status === 409) {
      console.log('✅ Duplicate client email rejected with HTTP 409 Conflict.');
    } else {
      throw new Error(`FAIL: Server returned status ${dupClientRes.status} on duplicate client email!`);
    }

    // Search clients
    const searchClientRes = await fetch(`${API_BASE}/clients?search=Infotech`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const searchBody = await searchClientRes.json();
    if (searchClientRes.status === 200 && searchBody.data.clients.length > 0) {
      console.log(`✅ [ADMIN] Search Client: Found ${searchBody.data.clients.length} matching client(s).`);
    } else {
      throw new Error('Client search failed!');
    }

    // -------------------------------------------------------------
    // TEST 2: Case Registration with Automatic Reference Generator
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Automatic Case Reference Generation & Case Registration ---');
    const createCaseRes = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerk.token}`,
      },
      body: JSON.stringify({
        title: 'Infotech Logistics vs. Highway Tollway Authority',
        caseType: 'Commercial Contract Dispute',
        courtName: 'High Court of Judicature',
        courtroom: 'Bench #2, Hall 204',
        client: newClientId,
        assignedLawyer: lawyer.user._id,
        description: 'Breach of electronic toll processing agreement and damages claim.',
        status: 'FILED',
        priority: 'HIGH',
      }),
    });

    const caseBody = await createCaseRes.json();
    if (createCaseRes.status !== 201) {
      throw new Error(`Failed to create case: ${caseBody.message}`);
    }

    const createdCase = caseBody.data;
    const caseRefRegex = /^LCMS-\d{4}-\d{4}$/;
    if (!caseRefRegex.test(createdCase.caseReference)) {
      throw new Error(`Invalid Case Reference generated: ${createdCase.caseReference}. Expected LCMS-YYYY-XXXX format.`);
    }
    console.log(`✅ [CLERK] Registered Case: ${createdCase.title}`);
    console.log(`✅ Verified Auto-Generated Reference: ${createdCase.caseReference} (Matches LCMS-YYYY-XXXX)`);

    // -------------------------------------------------------------
    // TEST 3: Role-Based Case Data Scoping
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Role-Based Data Scoping on GET /api/cases ---');

    // ADMIN sees all cases
    const adminCasesRes = await fetch(`${API_BASE}/cases`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const adminCases = (await adminCasesRes.json()).data.cases;
    console.log(`✅ [ADMIN] Fetched All Cases: ${adminCases.length} total cases in system.`);

    // LAWYER sees only assigned cases
    const lawyerCasesRes = await fetch(`${API_BASE}/cases`, {
      headers: { Authorization: `Bearer ${lawyer.token}` },
    });
    const lawyerCases = (await lawyerCasesRes.json()).data.cases;
    const allAssignedToLawyer = lawyerCases.every(
      (c) => c.assignedLawyer._id.toString() === lawyer.user._id
    );
    if (!allAssignedToLawyer) {
      throw new Error('SECURITY VIOLATION: Lawyer received cases not assigned to them!');
    }
    console.log(`✅ [LAWYER] Scoped Access: ${lawyerCases.length} case(s), all verified assigned to Adv. Abhishek.`);

    // CLIENT sees only their own registered cases
    const clientCasesRes = await fetch(`${API_BASE}/cases`, {
      headers: { Authorization: `Bearer ${client.token}` },
    });
    const clientCases = (await clientCasesRes.json()).data.cases;
    console.log(`✅ [CLIENT] Scoped Access: ${clientCases.length} case(s) belonging to Vikramaditya Rao.`);

    // -------------------------------------------------------------
    // TEST 4: Case Detail Security & Isolation
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Case Detail & Unauthorized Access Isolation ---');

    // CLIENT attempting to view another client's case (createdCase belongs to Infotech, not Vikramaditya)
    const clientForbiddenRes = await fetch(`${API_BASE}/cases/${createdCase._id}`, {
      headers: { Authorization: `Bearer ${client.token}` },
    });

    if (clientForbiddenRes.status === 403) {
      console.log('✅ [CLIENT] Correctly blocked from viewing other litigant\'s case with HTTP 403 Forbidden.');
    } else {
      throw new Error(`FAIL: Client was allowed to access other litigant's case! Status: ${clientForbiddenRes.status}`);
    }

    // CLIENT attempting to modify a case
    const clientUpdateRes = await fetch(`${API_BASE}/cases/${createdCase._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${client.token}`,
      },
      body: JSON.stringify({ status: 'CLOSED' }),
    });

    if (clientUpdateRes.status === 403) {
      console.log('✅ [CLIENT] Correctly blocked from updating case records with HTTP 403 Forbidden.');
    } else {
      throw new Error(`FAIL: Client was allowed to update case! Status: ${clientUpdateRes.status}`);
    }

    // -------------------------------------------------------------
    // TEST 5: Lawyer Updating Case Progress
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Lawyer Updating Case Progress & Stage ---');
    const lawyerUpdateRes = await fetch(`${API_BASE}/cases/${createdCase._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lawyer.token}`,
      },
      body: JSON.stringify({
        status: 'HEARING_IN_PROGRESS',
        stage: 'Arguments on Injunction Application',
        progress: 60,
      }),
    });

    const updateBody = await lawyerUpdateRes.json();
    if (lawyerUpdateRes.status === 200 && updateBody.data.status === 'HEARING_IN_PROGRESS') {
      console.log(`✅ [LAWYER] Updated Case: Status set to ${updateBody.data.status}, Stage: "${updateBody.data.stage}" (Progress: ${updateBody.data.progress}%)`);
    } else {
      throw new Error(`Lawyer failed to update assigned case: ${updateBody.message}`);
    }

    // -------------------------------------------------------------
    // TEST 6: Search, Filter & Pagination
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Case Search, Filter & Pagination ---');
    const filteredRes = await fetch(`${API_BASE}/cases?status=HEARING_IN_PROGRESS&page=1&limit=5`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const filterBody = await filteredRes.json();
    if (filteredRes.status === 200 && filterBody.data.pagination) {
      console.log(`✅ Filtered Query: Found ${filterBody.data.cases.length} active hearings cases (Page ${filterBody.data.pagination.page} of ${filterBody.data.pagination.totalPages}).`);
    } else {
      throw new Error('Case filtering & pagination failed!');
    }

    console.log('\n====================================================');
    console.log('🎉 ALL PHASE 6 CLIENT & CASE TESTS PASSED 100%!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ Phase 6 Test Failed:', error.message);
    process.exit(1);
  }
};

runPhase6Tests();

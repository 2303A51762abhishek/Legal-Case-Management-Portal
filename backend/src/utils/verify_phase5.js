/**
 * Automated Verification Script for Phase 5: Authentication & RBAC
 * Uses native Node.js fetch (No external HTTP dependencies required)
 * Tests: All 4 Roles Login, Invalid Passwords, Public Registration, Privilege Escalation Guard,
 * Duplicate Email, Session Verification (/api/auth/me), and Role Authorization.
 */

const API_BASE = 'http://127.0.0.1:5000/api';

const runPhase5Tests = async () => {
  console.log('🧪 Starting Phase 5 Authentication & RBAC Verification Tests...\n');

  try {
    // -------------------------------------------------------------
    // TEST 1: Login with All 4 Roles
    // -------------------------------------------------------------
    console.log('--- TEST 1: Authenticating All 4 User Roles ---');
    const rolesToTest = [
      { role: 'ADMIN', email: 'admin@jurismanagement.in', password: 'Admin@123' },
      { role: 'LAWYER', email: 'abhishek@jurismanagement.in', password: 'Lawyer@123' },
      { role: 'CLIENT', email: 'vikram.rao@enterprise.com', password: 'Client@123' },
      { role: 'CLERK', email: 'suresh.clerk@jurismanagement.in', password: 'Clerk@123' },
    ];

    const tokens = {};

    for (const item of rolesToTest) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: item.email, password: item.password }),
      });

      const body = await res.json();
      if (!res.ok || !body.success || !body.data.token || body.data.user.role !== item.role) {
        throw new Error(`Failed to authenticate ${item.role}: ${body.message}`);
      }

      tokens[item.role] = body.data.token;
      console.log(`✅ [${item.role}] Login Successful: ${body.data.user.name} (Role: ${body.data.user.role})`);
    }

    // -------------------------------------------------------------
    // TEST 2: Unsuccessful Login Tests
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Invalid Credential Rejections ---');
    const wrongPassRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@jurismanagement.in', password: 'WrongPassword999!' }),
    });

    if (wrongPassRes.status === 401) {
      console.log('✅ Invalid password correctly rejected with HTTP 401 Unauthorized.');
    } else {
      throw new Error(`FAIL: Server returned status ${wrongPassRes.status} for wrong password!`);
    }

    const nonExistentRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent.litigant@fake.com', password: 'SomePassword123' }),
    });

    if (nonExistentRes.status === 401) {
      console.log('✅ Non-existent user correctly rejected with HTTP 401 Unauthorized.');
    } else {
      throw new Error(`FAIL: Server returned status ${nonExistentRes.status} for non-existent user!`);
    }

    // -------------------------------------------------------------
    // TEST 3: Public Registration & Privilege Escalation Prevention
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Public Registration & Anti-Privilege Escalation ---');
    const testRegEmail = `test.client.${Date.now()}@litigant.in`;

    // Attempting privilege escalation: malicious payload passes role: 'ADMIN' during public signup
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sunita Mehra',
        email: testRegEmail,
        password: 'ClientPassword@123',
        phone: '+91 91234 56789',
        organization: 'Mehra Exports Ltd',
        role: 'ADMIN', // MALICIOUS PRIVILEGE ESCALATION INJECTION ATTEMPT
      }),
    });

    const regBody = await regRes.json();
    if (regRes.status !== 201) {
      throw new Error(`Registration failed: ${regBody.message}`);
    }

    // Verify backend forced the role to CLIENT
    if (regBody.data.user.role !== 'CLIENT') {
      throw new Error('SECURITY VIOLATION: Privilege escalation allowed public user to become ADMIN!');
    }
    console.log(`✅ Registration Successful: User created. Role forced to: ${regBody.data.user.role} (Privilege escalation prevented!)`);

    // Duplicate Email Test
    const dupRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Person',
        email: testRegEmail,
        password: 'AnyPassword@123',
      }),
    });

    if (dupRes.status === 409) {
      console.log('✅ Duplicate email registration correctly rejected with HTTP 409 Conflict.');
    } else {
      throw new Error(`FAIL: Server returned status ${dupRes.status} for duplicate registration!`);
    }

    // -------------------------------------------------------------
    // TEST 4: Protected Session Recovery (/api/auth/me)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Session Profile Verification (/api/auth/me) ---');
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${tokens.LAWYER}` },
    });

    const meBody = await meRes.json();
    if (meRes.status !== 200 || meBody.data.user.role !== 'LAWYER') {
      throw new Error('Failed to retrieve current user session profile!');
    }
    console.log(`✅ Session Recovered for: ${meBody.data.user.name} (${meBody.data.user.email})`);

    // Tampered Token Test
    const tamperedRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.tampered.token' },
    });

    if (tamperedRes.status === 401) {
      console.log('✅ Tampered JWT correctly rejected with HTTP 401 Unauthorized.');
    } else {
      throw new Error(`FAIL: Server accepted tampered token (status: ${tamperedRes.status})!`);
    }

    // -------------------------------------------------------------
    // TEST 5: Role-Based Authorization Enforcement (/api/users)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Strict Role Authorization Guards ---');

    // ADMIN token accessing /api/users -> Expected: 200 OK
    const adminRes = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${tokens.ADMIN}` },
    });
    const adminBody = await adminRes.json();
    if (adminRes.status === 200) {
      console.log(`✅ [ADMIN] Authorized: Retrieved ${adminBody.data.length} registered users (HTTP 200 OK).`);
    } else {
      throw new Error(`Admin failed to access /api/users: ${adminBody.message}`);
    }

    // LAWYER token accessing /api/users -> Expected: 403 Forbidden
    const lawyerRes = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${tokens.LAWYER}` },
    });
    if (lawyerRes.status === 403) {
      console.log('✅ [LAWYER] Blocked from /api/users with HTTP 403 Forbidden as expected.');
    } else {
      throw new Error(`FAIL: LAWYER allowed into /api/users (status: ${lawyerRes.status})!`);
    }

    // CLIENT token accessing /api/users -> Expected: 403 Forbidden
    const clientRes = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${tokens.CLIENT}` },
    });
    if (clientRes.status === 403) {
      console.log('✅ [CLIENT] Blocked from /api/users with HTTP 403 Forbidden as expected.');
    } else {
      throw new Error(`FAIL: CLIENT allowed into /api/users (status: ${clientRes.status})!`);
    }

    // CLERK token accessing /api/users -> Expected: 403 Forbidden
    const clerkRes = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${tokens.CLERK}` },
    });
    if (clerkRes.status === 403) {
      console.log('✅ [CLERK] Blocked from /api/users with HTTP 403 Forbidden as expected.');
    } else {
      throw new Error(`FAIL: CLERK allowed into /api/users (status: ${clerkRes.status})!`);
    }

    // -------------------------------------------------------------
    // TEST 6: Admin Creating Privileged User (LAWYER)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Admin Creating Privileged Lawyer Account ---');
    const newLawyerEmail = `adv.ramesh.${Date.now()}@juris.in`;
    const createRes = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.ADMIN}`,
      },
      body: JSON.stringify({
        name: 'Adv. Ramesh Kumar',
        email: newLawyerEmail,
        password: 'LawyerPassword@123',
        role: 'LAWYER',
        phone: '+91 98333 44455',
        barCouncilId: 'TS/2026/99887',
        designation: 'Associate Counsel',
      }),
    });

    const createBody = await createRes.json();
    if (createRes.status === 201 && createBody.data.role === 'LAWYER') {
      console.log(`✅ [ADMIN] Created Privileged User: ${createBody.data.name} as ${createBody.data.role}`);
    } else {
      throw new Error(`Failed to create privileged lawyer: ${createBody.message}`);
    }

    console.log('\n====================================================');
    console.log('🎉 ALL PHASE 5 AUTHENTICATION & RBAC TESTS PASSED 100%!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ Phase 5 Test Failed:', error.message);
    process.exit(1);
  }
};

runPhase5Tests();

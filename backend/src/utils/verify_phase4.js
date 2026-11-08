/**
 * Phase 4 Verification & Smoke Test Script
 * Tests: MongoDB Connection, 7 Models, Seeding, Retrieval, Unique Constraints, Password Security
 */

const { connectDB, disconnectDB, getDBStatus } = require('../config/db');
const {
  User,
  Client,
  Case,
  Hearing,
  Task,
  Document,
  Notification,
} = require('../models');
const seedDatabase = require('./seed');

const runVerification = async () => {
  console.log('🧪 Starting Phase 4 MongoDB & Schema Verification Tests...\n');

  try {
    // 1. Run Seeder without disconnecting
    console.log('Step 1: Running Seed Script...');
    const seedResults = await seedDatabase(false);
    console.log('Seeded Counts:', seedResults);

    // 2. Check Database Status
    console.log('\nStep 2: Checking Database Connection Status...');
    const status = getDBStatus();
    console.log(`Database Connection State: ${status.state} (Connected: ${status.isConnected})`);

    // 3. Test Retrieval of all 7 collections
    console.log('\nStep 3: Verifying Retrieval Across 7 Collections...');
    const userCount = await User.countDocuments();
    const clientCount = await Client.countDocuments();
    const caseCount = await Case.countDocuments();
    const hearingCount = await Hearing.countDocuments();
    const taskCount = await Task.countDocuments();
    const docCount = await Document.countDocuments();
    const notifCount = await Notification.countDocuments();

    console.log(`- Users Collection:         ${userCount} records`);
    console.log(`- Clients Collection:       ${clientCount} records`);
    console.log(`- Cases Collection:         ${caseCount} records`);
    console.log(`- Hearings Collection:      ${hearingCount} records`);
    console.log(`- Tasks Collection:         ${taskCount} records`);
    console.log(`- Documents Collection:     ${docCount} records`);
    console.log(`- Notifications Collection: ${notifCount} records`);

    if (userCount !== 4 || caseCount !== 3 || clientCount !== 2) {
      throw new Error('Record count mismatch in MongoDB verification!');
    }

    // 4. Verify Password Hashing (No Plaintext)
    console.log('\nStep 4: Verifying Password Cryptographic Security...');
    const adminRecord = await User.findOne({ email: 'admin@jurismanagement.in' }).select('+password');
    if (!adminRecord.password.startsWith('$2a$') && !adminRecord.password.startsWith('$2b$')) {
      throw new Error('Security Violation: Password was stored in plaintext!');
    }
    console.log('✅ Passwords are encrypted with bcrypt salt rounds (Hash prefix: ' + adminRecord.password.substring(0, 7) + '...)');

    // 5. Test Duplicate Email Constraint
    console.log('\nStep 5: Testing Unique Email Index Constraint...');
    try {
      await User.create({
        name: 'Duplicate Admin Test',
        email: 'admin@jurismanagement.in', // Existing email
        password: '$2a$10$invaliddummypasswordhashforindexcheck',
        role: 'ADMIN',
      });
      throw new Error('FAIL: Duplicate email was accepted by database!');
    } catch (err) {
      if (err.code === 11000 || err.message.includes('duplicate')) {
        console.log('✅ Duplicate email prevented as expected (E11000 duplicate key error).');
      } else {
        throw err;
      }
    }

    // 6. Test Duplicate Case Reference Constraint
    console.log('\nStep 6: Testing Unique Case Reference Index Constraint...');
    try {
      const anyClient = await Client.findOne();
      const anyLawyer = await User.findOne({ role: 'LAWYER' });
      await Case.create({
        caseReference: 'LCMS-2026-0104', // Existing case reference
        title: 'Duplicate Case Test',
        caseType: 'Writ Petition',
        courtName: 'High Court',
        client: anyClient._id,
        assignedLawyer: anyLawyer._id,
        description: 'Duplicate test',
      });
      throw new Error('FAIL: Duplicate case reference was accepted by database!');
    } catch (err) {
      if (err.code === 11000 || err.message.includes('duplicate')) {
        console.log('✅ Duplicate case reference prevented as expected (E11000 duplicate key error).');
      } else {
        throw err;
      }
    }

    // 7. Test Populated Relations
    console.log('\nStep 7: Testing Mongoose ObjectId Population (Case -> Client & Lawyer)...');
    const populatedCase = await Case.findOne({ caseReference: 'LCMS-2026-0104' })
      .populate('client')
      .populate('assignedLawyer');

    console.log(`- Case Reference: ${populatedCase.caseReference}`);
    console.log(`- Case Title:     ${populatedCase.title}`);
    console.log(`- Client Name:    ${populatedCase.client.name}`);
    console.log(`- Lead Counsel:   ${populatedCase.assignedLawyer.name} (${populatedCase.assignedLawyer.barCouncilId})`);

    console.log('\n====================================================');
    console.log('🎉 ALL PHASE 4 DATABASE & SCHEMA TESTS PASSED 100%!');
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Phase 4 Verification Failed:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

runVerification();

/**
 * Database Seeding Script for Legal Case and Court Hearing Management Portal
 * Strictly restricted to Development / Testing environments.
 */

const { connectDB, disconnectDB } = require('../config/db');
const { hashPassword } = require('./password');
const {
  User,
  Client,
  Case,
  Hearing,
  Task,
  Document,
  Notification,
} = require('../models');

const seedDatabase = async (shouldDisconnect = true) => {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ SEEDING ABORTED: Cannot seed in production environment!');
    process.exit(1);
  }

  console.log('🌱 Starting Database Seeding Process...');
  await connectDB();

  try {
    // 1. Clear existing collections to ensure idempotent seeding
    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Client.deleteMany({}),
      Case.deleteMany({}),
      Hearing.deleteMany({}),
      Task.deleteMany({}),
      Document.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // 2. Hash passwords using bcrypt (10 rounds) - NEVER store plaintext passwords
    const [adminPassword, lawyerPassword, clientPassword, clerkPassword] = await Promise.all([
      hashPassword('Admin@123'),
      hashPassword('Lawyer@123'),
      hashPassword('Client@123'),
      hashPassword('Clerk@123'),
    ]);

    // 3. Create Demo Users for all 4 Roles
    console.log('👥 Creating demo accounts for all 4 roles...');
    const adminUser = await User.create({
      name: 'Adv. Rajeshwar Sharma',
      email: 'admin@jurismanagement.in',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+91 98111 22334',
      accountStatus: 'ACTIVE',
      designation: 'Managing Partner & Chief Administrator',
    });

    const lawyerUser = await User.create({
      name: 'Adv. Mamillapally Abhishek',
      email: 'abhishek@jurismanagement.in',
      password: lawyerPassword,
      role: 'LAWYER',
      phone: '+91 98765 43210',
      accountStatus: 'ACTIVE',
      barCouncilId: 'TS/2026/51762',
      designation: 'Lead Litigation Counsel (High Court)',
    });

    const clientUser = await User.create({
      name: 'Vikramaditya Rao',
      email: 'vikram.rao@enterprise.com',
      password: clientPassword,
      role: 'CLIENT',
      phone: '+91 94440 12345',
      accountStatus: 'ACTIVE',
      designation: 'Managing Director, Zenith Technologies Ltd',
    });

    const clerkUser = await User.create({
      name: 'Suresh Chandra',
      email: 'suresh.clerk@jurismanagement.in',
      password: clerkPassword,
      role: 'CLERK',
      phone: '+91 99887 76655',
      accountStatus: 'ACTIVE',
      designation: 'Registry & Cause List Clerk',
    });

    console.log('✅ 4 Demo Users Created (ADMIN, LAWYER, CLIENT, CLERK)');

    // 4. Create Demo Clients
    console.log('🏢 Creating client records...');
    const demoClient = await Client.create({
      name: 'Vikramaditya Rao (Zenith Technologies)',
      email: 'vikram.rao@enterprise.com',
      phone: '+91 94440 12345',
      organization: 'Zenith Technologies Pvt Ltd',
      address: {
        street: 'Cyber Gateway, HITEC City',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500081',
        country: 'India',
      },
      assignedLawyer: lawyerUser._id,
      userAccount: clientUser._id,
      status: 'ACTIVE',
    });

    const bankClient = await Client.create({
      name: 'Union Bank of India (Zonal Recovery)',
      email: 'zonal.recovery@unionbank.co.in',
      phone: '+91 98222 33445',
      organization: 'Union Bank of India',
      address: {
        street: 'Bank Street, Koti',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500095',
        country: 'India',
      },
      assignedLawyer: lawyerUser._id,
      status: 'ACTIVE',
    });

    // 5. Create Demo Cases
    console.log('⚖️  Creating registered legal cases...');
    const case1 = await Case.create({
      caseReference: 'LCMS-2026-0104',
      title: 'Apex Technologies vs. State Revenue Department',
      caseType: 'Corporate Taxation & Writ Petition',
      courtName: 'High Court of Judicature',
      courtroom: 'Courtroom #402, Bench 4',
      client: demoClient._id,
      assignedLawyer: lawyerUser._id,
      filingDate: new Date('2026-09-12'),
      description: 'Challenging retrospective tax assessment under Section 148 of Income Tax Act 1961.',
      status: 'HEARING_IN_PROGRESS',
      stage: 'Final Arguments on Subsidies',
      progress: 80,
      priority: 'HIGH',
    });

    const case2 = await Case.create({
      caseReference: 'LCMS-2026-0098',
      title: 'Rao Estates Ltd vs. Municipal Corporation',
      caseType: 'Property & Land Acquisition Dispute',
      courtName: 'City Civil Court',
      courtroom: 'Hall #2, Civil Annex',
      client: demoClient._id,
      assignedLawyer: lawyerUser._id,
      filingDate: new Date('2026-09-24'),
      description: 'Declaratory suit challenging unauthorized municipal road widening acquisition.',
      status: 'UNDER_REVIEW',
      stage: 'Filing of Written Statement & Scrutiny',
      progress: 45,
      priority: 'MEDIUM',
    });

    const case3 = await Case.create({
      caseReference: 'LCMS-2026-0095',
      title: 'Union Bank of India vs. V. K. Infra Projects',
      caseType: 'Commercial Debt Recovery',
      courtName: 'Debt Recovery Tribunal - II',
      courtroom: 'Tribunal Hall A',
      client: bankClient._id,
      assignedLawyer: lawyerUser._id,
      filingDate: new Date('2026-08-02'),
      description: 'Recovery proceedings under SARFAESI Act for commercial facility default.',
      status: 'JUDGMENT_RESERVED',
      stage: 'Order Reserved for Pronouncement',
      progress: 95,
      priority: 'URGENT',
    });

    // 6. Create Court Hearings
    console.log('📅 Scheduling court appearances...');
    const hearingDate1 = new Date();
    hearingDate1.setDate(hearingDate1.getDate() + 2); // In 2 days

    await Hearing.create({
      case: case1._id,
      courtName: 'High Court of Judicature',
      courtroom: 'Courtroom #402',
      judgeName: 'Hon. Justice K. Raman',
      hearingDate: hearingDate1,
      hearingTime: '10:30 AM',
      purpose: 'Final Arguments on Tax Exemption',
      status: 'SCHEDULED',
      summary: 'Senior counsel to argue admissibility of transitional tax credits.',
    });

    const hearingDate2 = new Date();
    hearingDate2.setDate(hearingDate2.getDate() + 5);

    await Hearing.create({
      case: case2._id,
      courtName: 'City Civil Court',
      courtroom: 'Hall #2',
      judgeName: 'Hon. Judge S. Mehra',
      hearingDate: hearingDate2,
      hearingTime: '11:45 AM',
      purpose: 'Cross Examination of Chief Town Planner',
      status: 'SCHEDULED',
    });

    // 7. Create Litigation Tasks
    console.log('📋 Creating legal tasks and deadlines...');
    const taskDeadline1 = new Date();
    taskDeadline1.setDate(taskDeadline1.getDate() + 1); // Tomorrow

    await Task.create({
      title: 'Draft Rejoinder Affidavit for LCMS-2026-0104',
      description: 'Incorporate latest CBDT circular in rejoinder to revenue counter-affidavit.',
      case: case1._id,
      assignedUser: lawyerUser._id,
      createdBy: adminUser._id,
      priority: 'URGENT',
      deadline: taskDeadline1,
      status: 'IN_PROGRESS',
    });

    await Task.create({
      title: 'Obtain Certified Copy of Interim Stay Order',
      description: 'Apply to High Court copy application section and collect sealed orders.',
      case: case1._id,
      assignedUser: clerkUser._id,
      createdBy: lawyerUser._id,
      priority: 'HIGH',
      deadline: taskDeadline1,
      status: 'PENDING',
    });

    // 8. Create Authorized Case Documents
    console.log('📁 Registering case documents...');
    await Document.create({
      title: 'Writ_Petition_Final_Stamped.pdf',
      documentType: 'PETITION',
      case: case1._id,
      uploadedBy: lawyerUser._id,
      filePath: 'uploads/Writ_Petition_Final_Stamped.pdf',
      fileName: 'Writ_Petition_Final_Stamped.pdf',
      fileSize: 2457600,
      mimeType: 'application/pdf',
      isConfidential: false,
    });

    await Document.create({
      title: 'Interim_Injunction_Stay_Order.pdf',
      documentType: 'ORDER',
      case: case1._id,
      uploadedBy: clerkUser._id,
      filePath: 'uploads/Interim_Injunction_Stay_Order.pdf',
      fileName: 'Interim_Injunction_Stay_Order.pdf',
      fileSize: 1228800,
      mimeType: 'application/pdf',
      isConfidential: false,
    });

    // 9. Create In-App Notifications
    console.log('🔔 Generating in-app notifications...');
    await Notification.create({
      recipient: lawyerUser._id,
      title: 'Hearing Scheduled in 48 Hours',
      message: 'Case LCMS-2026-0104 is scheduled before High Court Bench 4 on 10 Nov at 10:30 AM.',
      type: 'HEARING_ALERT',
      relatedCase: case1._id,
      isRead: false,
    });

    await Notification.create({
      recipient: clientUser._id,
      title: 'Case Milestone Progress Updated',
      message: 'Your case LCMS-2026-0104 is currently in Final Arguments stage (80% complete).',
      type: 'CASE_UPDATE',
      relatedCase: case1._id,
      isRead: false,
    });

    console.log('====================================================');
    console.log('✨ Database Seeding Completed Successfully!');
    console.log('====================================================');
    console.log('Demo Credentials:');
    console.log('👑 ADMIN:  admin@jurismanagement.in     / Admin@123');
    console.log('⚖️  LAWYER: abhishek@jurismanagement.in    / Lawyer@123');
    console.log('👤 CLIENT: vikram.rao@enterprise.com     / Client@123');
    console.log('📝 CLERK:  suresh.clerk@jurismanagement.in / Clerk@123');
    console.log('====================================================');

    return {
      users: 4,
      clients: 2,
      cases: 3,
      hearings: 2,
      tasks: 2,
      documents: 2,
      notifications: 2,
    };
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    throw error;
  } finally {
    if (shouldDisconnect) {
      await disconnectDB();
    }
  }
};

// Execute if run directly from command line
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedDatabase;

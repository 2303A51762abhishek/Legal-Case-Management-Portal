/**
 * Comprehensive Demonstration Dataset Seeder (Phase 11)
 * Legal Case and Court Hearing Management Portal (JurisFlow)
 *
 * Student: MAMILLAPALLY ABHISHEK (Roll: 2303A51762)
 * Course: DevOps & Full Stack (B.Tech IV-I, 2026–2027)
 *
 * Features:
 * - Safe, non-destructive, idempotent execution (upsert / check existence)
 * - 19 Demo Users (1 Admin, 5 Lawyers, 3 Clerks, 10 Clients)
 * - 10 Realistic Corporate & Individual Client Profiles
 * - 32 Realistic Legal Dockets across all 6 statuses
 * - 42 Court Hearings without accidental judge/courtroom conflicts
 * - 52 Legal Tasks with client-visibility scoping and priority distribution
 * - 20 Sample Legal Documents with valid PDF magic bytes on disk
 * - 28 Realistic In-App System Notifications
 *
 * Rule Guarantee:
 * - activeCases (14) + pendingCases (9) + closedCases (9) === totalCases (32)
 */

const fs = require('fs');
const path = require('path');
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

// Helper to create valid sample PDF on disk
const ensureSamplePdf = (uploadsDir, fileName) => {
  const fullPath = path.join(uploadsDir, fileName);
  if (!fs.existsSync(fullPath)) {
    const validPdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF\n'
    );
    fs.writeFileSync(fullPath, validPdfBuffer);
  }
  return fullPath;
};

const seedDemoData = async (shouldDisconnect = true) => {
  console.log('====================================================');
  console.log('🏛️  JurisFlow — Comprehensive Demonstration Seeder');
  console.log('    Student: MAMILLAPALLY ABHISHEK (2303A51762)');
  console.log('====================================================');

  await connectDB();

  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 1. Passwords (bcrypt salt 10)
    console.log('🔐 Hashing development credentials...');
    const [adminPass, lawyerPass, clientPass, clerkPass] = await Promise.all([
      hashPassword('Admin@123'),
      hashPassword('Lawyer@123'),
      hashPassword('Client@123'),
      hashPassword('Clerk@123'),
    ]);

    // -------------------------------------------------------------
    // 2. USERS: 1 Admin, 5 Lawyers, 3 Clerks, 10 Clients (Total 19)
    // -------------------------------------------------------------
    console.log('👥 Generating / updating 19 demonstration users...');
    const usersData = [
      // 1 Admin
      {
        name: 'Adv. Rajeshwar Sharma',
        email: 'admin@jurismanagement.in',
        password: adminPass,
        role: 'ADMIN',
        phone: '+91 98111 22334',
        accountStatus: 'ACTIVE',
        designation: 'Managing Partner & Chief Administrator',
      },
      // 5 Lawyers
      {
        name: 'Adv. Mamillapally Abhishek',
        email: 'abhishek@jurismanagement.in',
        password: lawyerPass,
        role: 'LAWYER',
        phone: '+91 98765 43210',
        accountStatus: 'ACTIVE',
        barCouncilId: 'TS/2026/51762',
        designation: 'Lead Litigation Counsel (High Court)',
      },
      {
        name: 'Adv. Priya Sharma',
        email: 'priya.sharma@jurismanagement.in',
        password: lawyerPass,
        role: 'LAWYER',
        phone: '+91 98234 56789',
        accountStatus: 'ACTIVE',
        barCouncilId: 'DL/2020/19842',
        designation: 'Senior Corporate Litigation Counsel',
      },
      {
        name: 'Adv. Vikas Verma',
        email: 'vikas.verma@jurismanagement.in',
        password: lawyerPass,
        role: 'LAWYER',
        phone: '+91 98345 67890',
        accountStatus: 'ACTIVE',
        barCouncilId: 'MH/2018/31209',
        designation: 'Constitutional & Writ Petition Advocate',
      },
      {
        name: 'Adv. Ananya Deshmukh',
        email: 'ananya.deshmukh@jurismanagement.in',
        password: lawyerPass,
        role: 'LAWYER',
        phone: '+91 98456 78901',
        accountStatus: 'ACTIVE',
        barCouncilId: 'KA/2021/44910',
        designation: 'Commercial Arbitration & ADR Counsel',
      },
      {
        name: 'Adv. Arjun Menon',
        email: 'arjun.menon@jurismanagement.in',
        password: lawyerPass,
        role: 'LAWYER',
        phone: '+91 98567 89012',
        accountStatus: 'ACTIVE',
        barCouncilId: 'KL/2019/28114',
        designation: 'Debt Recovery & Banking Law Specialist',
      },
      // 3 Clerks
      {
        name: 'Suresh Chandra',
        email: 'suresh.clerk@jurismanagement.in',
        password: clerkPass,
        role: 'CLERK',
        phone: '+91 99887 76655',
        accountStatus: 'ACTIVE',
        designation: 'Registry & Cause List Clerk',
      },
      {
        name: 'Ramesh Patel',
        email: 'ramesh.clerk@jurismanagement.in',
        password: clerkPass,
        role: 'CLERK',
        phone: '+91 99776 65544',
        accountStatus: 'ACTIVE',
        designation: 'Filing & Judicial Scrutiny Clerk',
      },
      {
        name: 'Geeta Sharma',
        email: 'geeta.clerk@jurismanagement.in',
        password: clerkPass,
        role: 'CLERK',
        phone: '+91 99665 54433',
        accountStatus: 'ACTIVE',
        designation: 'Records & Listing Superintendent',
      },
      // 10 Clients
      {
        name: 'Vikramaditya Rao',
        email: 'vikram.rao@enterprise.com',
        password: clientPass,
        role: 'CLIENT',
        phone: '+91 94440 12345',
        accountStatus: 'ACTIVE',
        designation: 'Managing Director, Zenith Technologies Ltd',
      },
      {
        name: 'Dr. Meera Nair',
        email: 'meera.nair@apollohealthcare.in',
        password: clientPass,
        role: 'CLIENT',
        phone: '+91 94441 23456',
        accountStatus: 'ACTIVE',
        designation: 'Director, Apollo Diagnostics Services',
      },
      {
        name: 'Rajesh Patel',
        email: 'rajesh.patel@gujaratmaritime.in',
        password: clientPass,
        role: 'CLIENT',
        phone: '+91 94442 34567',
        accountStatus: 'ACTIVE',
        designation: 'VP Operations, Gujarat Maritime Logistics',
      },
      {
        name: 'Sunita Reddy',
        email: 'sunita.reddy@deccansoft.in',
        password: clientPass,
        role: 'CLIENT',
        phone: '+91 94443 45678',
        accountStatus: 'ACTIVE',
        designation: 'CEO, Deccan Software Solutions',
      },
      {
        name: 'Amit Agarwal',
        email: 'amit.agarwal@agrawalsons.in',
        password: clientPass,
        role: 'CLIENT',
        phone: '+91 94444 56789',
        accountStatus: 'ACTIVE',
        designation: 'CFO, Agrawal & Sons Infrastructure',
      },
      {
        name: 'Kavita Singh',
        email: 'kavita.singh@singhlogistics.in',
        password: clientPass,
        role: 'CLIENT',
        phone: '+91 94445 67890',
        accountStatus: 'ACTIVE',
        designation: 'Managing Director, Singh Freight Corridors',
      },
      {
        name: 'Harish Iyer',
        email: 'harish.iyer@iyertextiles.com',
        password: clientPass,
        role: 'CLIENT',
        phone: '+91 94446 78901',
        accountStatus: 'ACTIVE',
        designation: 'Partner, Iyer Textiles & Exports',
      },
      {
        name: 'Deepa Joshi',
        email: 'deepa.joshi@joshifinance.org',
        password: clientPass,
        role: 'CLIENT',
        phone: '+91 94447 89012',
        accountStatus: 'ACTIVE',
        designation: 'Legal Head, Joshi Micro-Finance',
      },
      {
        name: 'Tarun Mehta',
        email: 'tarun.mehta@mehtaenergy.in',
        password: clientPass,
        role: 'CLIENT',
        phone: '+91 94448 90123',
        accountStatus: 'ACTIVE',
        designation: 'Managing Trustee, Mehta Clean Energy Foundation',
      },
      {
        name: 'Sneha Bose',
        email: 'sneha.bose@boseinfra.com',
        password: clientPass,
        role: 'CLIENT',
        phone: '+91 94449 01234',
        accountStatus: 'ACTIVE',
        designation: 'Director, Bose Realcon & Urban Infra',
      },
    ];

    const userMap = {};
    for (const u of usersData) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) {
        existing = await User.create(u);
      } else {
        existing.name = u.name;
        existing.role = u.role;
        existing.phone = u.phone;
        existing.accountStatus = u.accountStatus;
        existing.designation = u.designation;
        if (u.barCouncilId) existing.barCouncilId = u.barCouncilId;
        await existing.save();
      }
      userMap[u.email] = existing;
    }
    console.log(`✅ 19 Demo Users ready (1 Admin, 5 Lawyers, 3 Clerks, 10 Clients).`);

    const lawyers = [
      userMap['abhishek@jurismanagement.in'],
      userMap['priya.sharma@jurismanagement.in'],
      userMap['vikas.verma@jurismanagement.in'],
      userMap['ananya.deshmukh@jurismanagement.in'],
      userMap['arjun.menon@jurismanagement.in'],
    ];

    const clerks = [
      userMap['suresh.clerk@jurismanagement.in'],
      userMap['ramesh.clerk@jurismanagement.in'],
      userMap['geeta.clerk@jurismanagement.in'],
    ];

    const admin = userMap['admin@jurismanagement.in'];

    // -------------------------------------------------------------
    // 3. CLIENTS: 10 Individual & Corporate Client Records
    // -------------------------------------------------------------
    console.log('🏢 Generating / updating 10 client profiles...');
    const clientsData = [
      {
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
        assignedLawyer: lawyers[0]._id, // Adv. Abhishek
        userAccount: userMap['vikram.rao@enterprise.com']._id,
        status: 'ACTIVE',
      },
      {
        name: 'Dr. Meera Nair (Apollo Diagnostics)',
        email: 'meera.nair@apollohealthcare.in',
        phone: '+91 94441 23456',
        organization: 'Apollo Healthcare & Diagnostics Ltd',
        address: {
          street: 'Jubilee Hills Road #36',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500033',
          country: 'India',
        },
        assignedLawyer: lawyers[1]._id, // Adv. Priya
        userAccount: userMap['meera.nair@apollohealthcare.in']._id,
        status: 'ACTIVE',
      },
      {
        name: 'Rajesh Patel (Gujarat Maritime)',
        email: 'rajesh.patel@gujaratmaritime.in',
        phone: '+91 94442 34567',
        organization: 'Gujarat Maritime & Logistics Ltd',
        address: {
          street: 'Port Complex, Gandhidham',
          city: 'Kutch',
          state: 'Gujarat',
          postalCode: '370201',
          country: 'India',
        },
        assignedLawyer: lawyers[2]._id, // Adv. Vikas
        userAccount: userMap['rajesh.patel@gujaratmaritime.in']._id,
        status: 'ACTIVE',
      },
      {
        name: 'Sunita Reddy (Deccan Software)',
        email: 'sunita.reddy@deccansoft.in',
        phone: '+91 94443 45678',
        organization: 'Deccan Software Solutions Pvt Ltd',
        address: {
          street: 'Financial District, Nanakramguda',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500032',
          country: 'India',
        },
        assignedLawyer: lawyers[0]._id, // Adv. Abhishek
        userAccount: userMap['sunita.reddy@deccansoft.in']._id,
        status: 'ACTIVE',
      },
      {
        name: 'Amit Agarwal (Agrawal & Sons)',
        email: 'amit.agarwal@agrawalsons.in',
        phone: '+91 94444 56789',
        organization: 'Agrawal & Sons Infrastructure Ltd',
        address: {
          street: 'Connaught Place Outer Circle',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
          country: 'India',
        },
        assignedLawyer: lawyers[3]._id, // Adv. Ananya
        userAccount: userMap['amit.agarwal@agrawalsons.in']._id,
        status: 'ACTIVE',
      },
      {
        name: 'Kavita Singh (Singh Freight)',
        email: 'kavita.singh@singhlogistics.in',
        phone: '+91 94445 67890',
        organization: 'Singh Freight Corridors Ltd',
        address: {
          street: 'Transport Nagar Sector 21',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122001',
          country: 'India',
        },
        assignedLawyer: lawyers[1]._id, // Adv. Priya
        userAccount: userMap['kavita.singh@singhlogistics.in']._id,
        status: 'ACTIVE',
      },
      {
        name: 'Harish Iyer (Iyer Textiles)',
        email: 'harish.iyer@iyertextiles.com',
        phone: '+91 94446 78901',
        organization: 'Iyer Textiles & Exports Ltd',
        address: {
          street: 'T. Nagar Commercial Area',
          city: 'Chennai',
          state: 'Tamil Nadu',
          postalCode: '600017',
          country: 'India',
        },
        assignedLawyer: lawyers[4]._id, // Adv. Arjun
        userAccount: userMap['harish.iyer@iyertextiles.com']._id,
        status: 'ACTIVE',
      },
      {
        name: 'Deepa Joshi (Joshi Micro-Finance)',
        email: 'deepa.joshi@joshifinance.org',
        phone: '+91 94447 89012',
        organization: 'Joshi Micro-Finance Corporation',
        address: {
          street: 'FC Road, Shivajinagar',
          city: 'Pune',
          state: 'Maharashtra',
          postalCode: '411005',
          country: 'India',
        },
        assignedLawyer: lawyers[4]._id, // Adv. Arjun
        userAccount: userMap['deepa.joshi@joshifinance.org']._id,
        status: 'ACTIVE',
      },
      {
        name: 'Tarun Mehta (Mehta Green Energy)',
        email: 'tarun.mehta@mehtaenergy.in',
        phone: '+91 94448 90123',
        organization: 'Mehta Clean Energy Foundation',
        address: {
          street: 'Bandra Kurla Complex (BKC)',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400051',
          country: 'India',
        },
        assignedLawyer: lawyers[2]._id, // Adv. Vikas
        userAccount: userMap['tarun.mehta@mehtaenergy.in']._id,
        status: 'ACTIVE',
      },
      {
        name: 'Sneha Bose (Bose Realcon)',
        email: 'sneha.bose@boseinfra.com',
        phone: '+91 94449 01234',
        organization: 'Bose Realcon & Urban Infra Ltd',
        address: {
          street: 'Salt Lake Sector V',
          city: 'Kolkata',
          state: 'West Bengal',
          postalCode: '700091',
          country: 'India',
        },
        assignedLawyer: lawyers[3]._id, // Adv. Ananya
        userAccount: userMap['sneha.bose@boseinfra.com']._id,
        status: 'ACTIVE',
      },
    ];

    const clientMap = {};
    for (const c of clientsData) {
      let existing = await Client.findOne({ email: c.email });
      if (!existing) {
        existing = await Client.create(c);
      } else {
        existing.name = c.name;
        existing.phone = c.phone;
        existing.organization = c.organization;
        existing.address = c.address;
        existing.assignedLawyer = c.assignedLawyer;
        existing.userAccount = c.userAccount;
        existing.status = c.status;
        await existing.save();
      }
      clientMap[c.email] = existing;
    }
    console.log(`✅ 10 Client Profiles ready.`);

    const clientList = Object.values(clientMap);

    // -------------------------------------------------------------
    // 4. CASES: 32 Realistic Legal Dockets across all 6 Statuses
    // Partition:
    // Active (14): HEARING_IN_PROGRESS (10), APPEALED (4)
    // Pending (9): FILED (4), UNDER_REVIEW (5)
    // Closed (9):  CLOSED (5), JUDGMENT_RESERVED (4)
    // Total = 14 + 9 + 9 = 32
    // -------------------------------------------------------------
    console.log('⚖️  Generating / updating 32 realistic legal cases...');

    const casesData = [
      // --- 4 FILED Cases (Pending category) ---
      {
        caseReference: 'LCMS-2026-0001',
        title: 'Zenith Tech vs. Cyber Appellate Tribunal',
        caseType: 'Cyber Law & IP Infringement',
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #301, Commercial Division',
        client: clientList[0]._id, // Vikramaditya
        assignedLawyer: lawyers[0]._id, // Abhishek
        filingDate: new Date('2026-11-01'),
        description: 'Writ petition against algorithmic patent rejection and unilateral trademark cancellation.',
        status: 'FILED',
        stage: 'Initial Registry Scrutiny',
        progress: 10,
        priority: 'MEDIUM',
      },
      {
        caseReference: 'LCMS-2026-0002',
        title: 'Apollo Healthcare vs. State Pollution Board',
        caseType: 'Environmental Compliance & Writ',
        courtName: 'National Green Tribunal (Southern Zone)',
        courtroom: 'Bench #2, Judicial Hall',
        client: clientList[1]._id,
        assignedLawyer: lawyers[1]._id,
        filingDate: new Date('2026-11-02'),
        description: 'Challenge to punitive environmental compensation order regarding biomedical incinerator emissions.',
        status: 'FILED',
        stage: 'Objections & Verification',
        progress: 15,
        priority: 'HIGH',
      },
      {
        caseReference: 'LCMS-2026-0003',
        title: 'Gujarat Maritime vs. Coastal Zone Authority',
        caseType: 'Maritime & Maritime Environmental Law',
        courtName: 'High Court of Judicature (Gujarat)',
        courtroom: 'Courtroom #104, Civil Division',
        client: clientList[2]._id,
        assignedLawyer: lawyers[2]._id,
        filingDate: new Date('2026-11-03'),
        description: 'Declaratory suit challenging port jetty expansion clearance moratorium.',
        status: 'FILED',
        stage: 'Filing & Stamp Duty Scrutiny',
        progress: 12,
        priority: 'LOW',
      },
      {
        caseReference: 'LCMS-2026-0004',
        title: 'Deccan Software vs. Tech Hub Developers',
        caseType: 'Commercial Lease Agreement Breach',
        courtName: 'City Civil Court',
        courtroom: 'Courtroom #205, Commercial Court',
        client: clientList[3]._id,
        assignedLawyer: lawyers[0]._id,
        filingDate: new Date('2026-11-04'),
        description: 'Specific performance suit seeking handover of IT park premises and escrow refund.',
        status: 'FILED',
        stage: 'Summons Issuance',
        progress: 18,
        priority: 'MEDIUM',
      },

      // --- 5 UNDER_REVIEW Cases (Pending category) ---
      {
        caseReference: 'LCMS-2026-0005',
        title: 'Agrawal Infra vs. National Highways Authority',
        caseType: 'Infrastructure EPC Arbitration',
        courtName: 'High Court of Delhi',
        courtroom: 'Courtroom #412, Arbitration Bench',
        client: clientList[4]._id,
        assignedLawyer: lawyers[3]._id,
        filingDate: new Date('2026-10-15'),
        description: 'Section 11 petition for appointment of sole arbitrator in expressway concession dispute.',
        status: 'UNDER_REVIEW',
        stage: 'Registry Compliance Review',
        progress: 30,
        priority: 'URGENT',
      },
      {
        caseReference: 'LCMS-2026-0006',
        title: 'Singh Freight vs. Northern Railway Division',
        caseType: 'Commercial Freight Tariff Dispute',
        courtName: 'Railway Claims Tribunal',
        courtroom: 'Bench #1, Principal Bench',
        client: clientList[5]._id,
        assignedLawyer: lawyers[1]._id,
        filingDate: new Date('2026-10-18'),
        description: 'Recovery claim for unilateral demurrage surcharge imposition on container rake siding.',
        status: 'UNDER_REVIEW',
        stage: 'Written Statement Verification',
        progress: 35,
        priority: 'MEDIUM',
      },
      {
        caseReference: 'LCMS-2026-0007',
        title: 'Iyer Textiles vs. Customs & Central Excise Board',
        caseType: 'Customs Drawback & Indirect Tax',
        courtName: 'CESTAT Principal Bench',
        courtroom: 'Courtroom #302, Tribunal Hall',
        client: clientList[6]._id,
        assignedLawyer: lawyers[4]._id,
        filingDate: new Date('2026-10-22'),
        description: 'Appeal contesting denial of duty drawback on organic cotton export consignments.',
        status: 'UNDER_REVIEW',
        stage: 'Departmental Reply Examination',
        progress: 40,
        priority: 'HIGH',
      },
      {
        caseReference: 'LCMS-2026-0008',
        title: 'Joshi Micro-Finance vs. Debt Recovery Appellate',
        caseType: 'Banking Regulation & Writ',
        courtName: 'High Court of Bombay',
        courtroom: 'Courtroom #15, Appellate Side',
        client: clientList[7]._id,
        assignedLawyer: lawyers[4]._id,
        filingDate: new Date('2026-10-25'),
        description: 'Challenge to micro-lending cap guidelines issued by financial ombudsman.',
        status: 'UNDER_REVIEW',
        stage: 'Judicial Scrutiny',
        progress: 25,
        priority: 'MEDIUM',
      },
      {
        caseReference: 'LCMS-2026-0009',
        title: 'Mehta Green Energy vs. Solar Power Grid Corp',
        caseType: 'Renewable Power Purchase Agreement',
        courtName: 'Central Electricity Regulatory Commission',
        courtroom: 'Hearing Room #3, CERC',
        client: clientList[8]._id,
        assignedLawyer: lawyers[2]._id,
        filingDate: new Date('2026-10-28'),
        description: 'Dispute regarding grid curtailment compensation and tariff revision under change-in-law clause.',
        status: 'UNDER_REVIEW',
        stage: 'Pre-Admission Scrutiny',
        progress: 32,
        priority: 'HIGH',
      },

      // --- 10 HEARING_IN_PROGRESS Cases (Active category) ---
      {
        caseReference: 'LCMS-2026-0010',
        title: 'Apex Technologies vs. State Revenue Department',
        caseType: 'Corporate Taxation & Writ Petition',
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #402, Bench 4',
        client: clientList[0]._id, // Vikramaditya
        assignedLawyer: lawyers[0]._id, // Abhishek
        filingDate: new Date('2026-09-12'),
        description: 'Challenging retrospective tax assessment under Section 148 of Income Tax Act 1961.',
        status: 'HEARING_IN_PROGRESS',
        stage: 'Final Arguments on Subsidies',
        progress: 80,
        priority: 'HIGH',
      },
      {
        caseReference: 'LCMS-2026-0011',
        title: 'Bose Realcon vs. Metro Rail Corporation',
        caseType: 'Land Acquisition & Fair Compensation',
        courtName: 'High Court of Calcutta',
        courtroom: 'Courtroom #2, Division Bench',
        client: clientList[9]._id,
        assignedLawyer: lawyers[3]._id,
        filingDate: new Date('2026-08-14'),
        description: 'Petition seeking market-rate multiplier compensation for commercial parcel acquisition.',
        status: 'HEARING_IN_PROGRESS',
        stage: 'Cross Examination of Valuation Expert',
        progress: 65,
        priority: 'URGENT',
      },
      {
        caseReference: 'LCMS-2026-0012',
        title: 'Zenith Tech vs. Global Cloud Infrastructure',
        caseType: 'SLA Breach & Commercial Damages',
        courtName: 'City Civil Court',
        courtroom: 'Courtroom #103, Commercial Court',
        client: clientList[0]._id, // Vikramaditya
        assignedLawyer: lawyers[0]._id, // Abhishek
        filingDate: new Date('2026-07-20'),
        description: 'Damages suit for data center outage resulting in enterprise service disruptions.',
        status: 'HEARING_IN_PROGRESS',
        stage: 'Plaintiff Evidence Recording',
        progress: 55,
        priority: 'HIGH',
      },
      {
        caseReference: 'LCMS-2026-0013',
        title: 'Apollo Healthcare vs. Medical Council Board',
        caseType: 'Regulatory Accreditation Mandamus',
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #501, Constitutional Bench',
        client: clientList[1]._id,
        assignedLawyer: lawyers[1]._id,
        filingDate: new Date('2026-08-05'),
        description: 'Mandamus petition challenging arbitrary inspection ratings and license delay.',
        status: 'HEARING_IN_PROGRESS',
        stage: 'Respondents Counter Examination',
        progress: 60,
        priority: 'MEDIUM',
      },
      {
        caseReference: 'LCMS-2026-0014',
        title: 'Gujarat Maritime vs. International Cargo Lines',
        caseType: 'Admiralty Suit & Vessel Arrest',
        courtName: 'High Court of Bombay',
        courtroom: 'Admiralty Court #1',
        client: clientList[2]._id,
        assignedLawyer: lawyers[2]._id,
        filingDate: new Date('2026-06-12'),
        description: 'Action in rem for bunker fuel dues recovery and conservatory vessel detention.',
        status: 'HEARING_IN_PROGRESS',
        stage: 'Security Deposit Arguments',
        progress: 75,
        priority: 'URGENT',
      },
      {
        caseReference: 'LCMS-2026-0015',
        title: 'Deccan Software vs. FinTech Payments Gateway',
        caseType: 'Escrow Settlement Default Suit',
        courtName: 'City Civil Court',
        courtroom: 'Courtroom #201, Civil Annex',
        client: clientList[3]._id,
        assignedLawyer: lawyers[0]._id,
        filingDate: new Date('2026-08-22'),
        description: 'Summary suit under Order 37 CPC for recovery of merchant transaction remittances.',
        status: 'HEARING_IN_PROGRESS',
        stage: 'Leave to Defend Hearing',
        progress: 50,
        priority: 'MEDIUM',
      },
      {
        caseReference: 'LCMS-2026-0016',
        title: 'Agrawal Infra vs. State Public Works Dept',
        caseType: 'Contract Price Variation Dispute',
        courtName: 'Arbitral Tribunal Bench',
        courtroom: 'Hall B, Arbitration Centre',
        client: clientList[4]._id,
        assignedLawyer: lawyers[3]._id,
        filingDate: new Date('2026-05-30'),
        description: 'Claim under wholesale price index formula for bitumen escalation reimbursement.',
        status: 'HEARING_IN_PROGRESS',
        stage: 'Oral Submissions on Merits',
        progress: 85,
        priority: 'HIGH',
      },
      {
        caseReference: 'LCMS-2026-0017',
        title: 'Singh Freight vs. Heavy Industries Logistics',
        caseType: 'Cargo Damage Subrogation Claim',
        courtName: 'City Civil Court',
        courtroom: 'Courtroom #304',
        client: clientList[5]._id,
        assignedLawyer: lawyers[1]._id,
        filingDate: new Date('2026-07-11'),
        description: 'Insurance subrogation claim for heavy transformer transit damage.',
        status: 'HEARING_IN_PROGRESS',
        stage: 'Cross Examination of Surveyor',
        progress: 70,
        priority: 'LOW',
      },
      {
        caseReference: 'LCMS-2026-0018',
        title: 'Iyer Textiles vs. Overseas Sourcing Partner',
        caseType: 'International Trade Arbitration',
        courtName: 'High Court of Madras',
        courtroom: 'Courtroom #12, Commercial Bench',
        client: clientList[6]._id,
        assignedLawyer: lawyers[4]._id,
        filingDate: new Date('2026-08-19'),
        description: 'Section 9 petition seeking interim protection and bank guarantee freeze.',
        status: 'HEARING_IN_PROGRESS',
        stage: 'Hearing on Interim Relief',
        progress: 68,
        priority: 'HIGH',
      },
      {
        caseReference: 'LCMS-2026-0019',
        title: 'Joshi Micro-Finance vs. Borrower Cooperative',
        caseType: 'Commercial Insolvency (IBC Section 7)',
        courtName: 'National Company Law Tribunal (NCLT)',
        courtroom: 'Courtroom #1, NCLT Bench',
        client: clientList[7]._id,
        assignedLawyer: lawyers[4]._id,
        filingDate: new Date('2026-06-25'),
        description: 'Financial creditor petition for initiation of corporate insolvency resolution process.',
        status: 'HEARING_IN_PROGRESS',
        stage: 'Admission Arguments',
        progress: 72,
        priority: 'URGENT',
      },

      // --- 4 JUDGMENT_RESERVED Cases (Closed category) ---
      {
        caseReference: 'LCMS-2026-0020',
        title: 'Union Bank of India vs. V. K. Infra Projects',
        caseType: 'Commercial Debt Recovery',
        courtName: 'Debt Recovery Tribunal - II',
        courtroom: 'Tribunal Hall A',
        client: clientList[0]._id, // Linked to primary corporate client
        assignedLawyer: lawyers[0]._id,
        filingDate: new Date('2026-08-02'),
        description: 'Recovery proceedings under SARFAESI Act for commercial facility default.',
        status: 'JUDGMENT_RESERVED',
        stage: 'Order Reserved for Pronouncement',
        progress: 95,
        priority: 'URGENT',
      },
      {
        caseReference: 'LCMS-2026-0021',
        title: 'Mehta Clean Energy vs. State Discom Board',
        caseType: 'Solar Tariff Surcharge Determination',
        courtName: 'Appellate Tribunal for Electricity',
        courtroom: 'Courtroom #1, Principal Bench',
        client: clientList[8]._id,
        assignedLawyer: lawyers[2]._id,
        filingDate: new Date('2026-04-10'),
        description: 'Appeal contesting unilateral withdrawal of banking incentives for rooftop solar generation.',
        status: 'JUDGMENT_RESERVED',
        stage: 'Judgment Reserved',
        progress: 95,
        priority: 'HIGH',
      },
      {
        caseReference: 'LCMS-2026-0022',
        title: 'Bose Realcon vs. Urban Development Authority',
        caseType: 'Master Plan Zoning & Land Title Suit',
        courtName: 'High Court of Calcutta',
        courtroom: 'Courtroom #5, Special Bench',
        client: clientList[9]._id,
        assignedLawyer: lawyers[3]._id,
        filingDate: new Date('2026-03-18'),
        description: 'Challenging retroactive zoning designation change impeding commercial IT township.',
        status: 'JUDGMENT_RESERVED',
        stage: 'Final Verdict Reserved',
        progress: 98,
        priority: 'URGENT',
      },
      {
        caseReference: 'LCMS-2026-0023',
        title: 'Apollo Healthcare vs. State Drug Controller',
        caseType: 'Pharmaceutical License Mandamus',
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #204, Single Bench',
        client: clientList[1]._id,
        assignedLawyer: lawyers[1]._id,
        filingDate: new Date('2026-05-15'),
        description: 'Mandamus petition challenging suspension of central distribution warehouse license.',
        status: 'JUDGMENT_RESERVED',
        stage: 'Awaiting Signed Judgment Order',
        progress: 95,
        priority: 'MEDIUM',
      },

      // --- 5 CLOSED Cases (Closed category) ---
      {
        caseReference: 'LCMS-2026-0024',
        title: 'Zenith Tech vs. Apex Systems Consulting',
        caseType: 'Commercial Debt Settlement',
        courtName: 'National Lok Adalat',
        courtroom: 'Lok Adalat Hall #3',
        client: clientList[0]._id, // Vikramaditya
        assignedLawyer: lawyers[0]._id, // Abhishek
        filingDate: new Date('2026-01-10'),
        description: 'Mutual consent compromise deed executed for outstanding software engineering receivables.',
        status: 'CLOSED',
        stage: 'Decree Drawn & Executed',
        progress: 100,
        priority: 'LOW',
      },
      {
        caseReference: 'LCMS-2026-0025',
        title: 'Gujarat Maritime vs. West Coast Stevedores',
        caseType: 'Cargo Stevedoring Contract Arbitration',
        courtName: 'Arbitration Centre (Mumbai)',
        courtroom: 'Hearing Room 1',
        client: clientList[2]._id,
        assignedLawyer: lawyers[2]._id,
        filingDate: new Date('2025-11-20'),
        description: 'Consent award rendered with complete satisfaction of billing reconciliation.',
        status: 'CLOSED',
        stage: 'Final Award Disbursed',
        progress: 100,
        priority: 'LOW',
      },
      {
        caseReference: 'LCMS-2026-0026',
        title: 'Agrawal Infra vs. Northern Bridges Corp',
        caseType: 'Subcontractor Retention Money Suit',
        courtName: 'City Civil Court',
        courtroom: 'Courtroom #108',
        client: clientList[4]._id,
        assignedLawyer: lawyers[3]._id,
        filingDate: new Date('2025-12-05'),
        description: 'Full recovery effected through post-dated cheques in civil mediation.',
        status: 'CLOSED',
        stage: 'Mediation Settlement Implemented',
        progress: 100,
        priority: 'LOW',
      },
      {
        caseReference: 'LCMS-2026-0027',
        title: 'Singh Freight vs. National Highway Patrol',
        caseType: 'Traffic Challan Quashing Petition',
        courtName: 'High Court of Punjab & Haryana',
        courtroom: 'Courtroom #19, Motion Bench',
        client: clientList[5]._id,
        assignedLawyer: lawyers[1]._id,
        filingDate: new Date('2026-02-14'),
        description: 'Batch of e-challans quashed due to faulty radar speed sensors.',
        status: 'CLOSED',
        stage: 'Writ Allowed & Quashed',
        progress: 100,
        priority: 'LOW',
      },
      {
        caseReference: 'LCMS-2026-0028',
        title: 'Harish Iyer vs. Southern Power Distribution',
        caseType: 'Industrial Power Tariff Overbilling',
        courtName: 'Consumer Grievance Redressal Forum',
        courtroom: 'Bench #1, CGRF',
        client: clientList[6]._id,
        assignedLawyer: lawyers[4]._id,
        filingDate: new Date('2026-01-28'),
        description: 'Order issued granting credit adjustment of 42 lakh rupees in monthly billing.',
        status: 'CLOSED',
        stage: 'Compliance Certified',
        progress: 100,
        priority: 'LOW',
      },

      // --- 4 APPEALED Cases (Active category) ---
      {
        caseReference: 'LCMS-2026-0029',
        title: 'Zenith Tech vs. Commercial Tax Officer (Appeals)',
        caseType: 'Special Leave Petition (Civil)',
        courtName: 'Supreme Court of India',
        courtroom: 'Courtroom #3, Hon. Chief Justice Bench',
        client: clientList[0]._id, // Vikramaditya
        assignedLawyer: lawyers[0]._id, // Abhishek
        filingDate: new Date('2026-09-01'),
        description: 'SLP filed against High Court judgment on export service tax exemption eligibility.',
        status: 'APPEALED',
        stage: 'SLP Admission & Stay Hearing',
        progress: 40,
        priority: 'URGENT',
      },
      {
        caseReference: 'LCMS-2026-0030',
        title: 'Apollo Healthcare vs. National Consumer Commission',
        caseType: 'Civil Appeal (Healthcare Liability)',
        courtName: 'Supreme Court of India',
        courtroom: 'Courtroom #8',
        client: clientList[1]._id,
        assignedLawyer: lawyers[1]._id,
        filingDate: new Date('2026-08-25'),
        description: 'Statutory appeal under Section 67 Consumer Protection Act against NCDRC order.',
        status: 'APPEALED',
        stage: 'Notice Issued on Interim Stay',
        progress: 35,
        priority: 'HIGH',
      },
      {
        caseReference: 'LCMS-2026-0031',
        title: 'Mehta Clean Energy vs. Appellate Tribunal Electricity',
        caseType: 'Statutory Appeal under Electricity Act',
        courtName: 'Supreme Court of India',
        courtroom: 'Courtroom #11',
        client: clientList[8]._id,
        assignedLawyer: lawyers[2]._id,
        filingDate: new Date('2026-07-30'),
        description: 'Civil appeal contesting APTEL ruling on transmission cross-subsidy surcharge.',
        status: 'APPEALED',
        stage: 'Awaiting Counter Affidavit from Discom',
        progress: 45,
        priority: 'HIGH',
      },
      {
        caseReference: 'LCMS-2026-0032',
        title: 'Bose Realcon vs. State Real Estate Regulatory Authority',
        caseType: 'RERA Statutory Appeal',
        courtName: 'High Court of Calcutta',
        courtroom: 'Courtroom #7, Appellate Side',
        client: clientList[9]._id,
        assignedLawyer: lawyers[3]._id,
        filingDate: new Date('2026-08-10'),
        description: 'First appeal under Section 58 of RERA Act against Appellate Tribunal remand order.',
        status: 'APPEALED',
        stage: 'Hearing on Substantial Question of Law',
        progress: 50,
        priority: 'MEDIUM',
      },
    ];

    const caseMap = {};
    for (const c of casesData) {
      let existing = await Case.findOne({ caseReference: c.caseReference });
      if (!existing) {
        existing = await Case.create(c);
      } else {
        existing.title = c.title;
        existing.caseType = c.caseType;
        existing.courtName = c.courtName;
        existing.courtroom = c.courtroom;
        existing.client = c.client;
        existing.assignedLawyer = c.assignedLawyer;
        existing.filingDate = c.filingDate;
        existing.description = c.description;
        existing.status = c.status;
        existing.stage = c.stage;
        existing.progress = c.progress;
        existing.priority = c.priority;
        await existing.save();
      }
      caseMap[c.caseReference] = existing;
    }
    console.log(`✅ 32 Legal Cases ready across all 6 statuses.`);

    const caseList = Object.values(caseMap);

    // -------------------------------------------------------------
    // 5. HEARINGS: 42 Hearings without judge/courtroom conflicts
    // Partition:
    // SCHEDULED (18) — future dates, carefully partitioned courts/times/judges
    // COMPLETED (14) — past dates
    // ADJOURNED (6)  — past dates
    // CANCELLED (4)  — exempt from conflicts
    // Total = 18 + 14 + 6 + 4 = 42
    // -------------------------------------------------------------
    console.log('📅 Scheduling 42 hearings (zero accidental conflict guarantee)...');

    const baseNow = new Date();
    // Helper to get relative date (days offset)
    const relDate = (days) => {
      const d = new Date(baseNow);
      d.setDate(d.getDate() + days);
      d.setHours(10, 0, 0, 0);
      return d;
    };

    const hearingsData = [
      // 18 SCHEDULED Hearings (future dates, non-conflicting time slots & courts)
      {
        case: caseMap['LCMS-2026-0010']._id,
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #402',
        judgeName: 'Hon. Justice K. Raman',
        hearingDate: relDate(2),
        hearingTime: '10:30 AM',
        purpose: 'Final Arguments on Tax Credit Admissibility',
        status: 'SCHEDULED',
        summary: 'Counsel to present transitional credit documentation under Section 140.',
      },
      {
        case: caseMap['LCMS-2026-0011']._id,
        courtName: 'High Court of Calcutta',
        courtroom: 'Courtroom #2',
        judgeName: 'Hon. Justice B. K. Mukherjee',
        hearingDate: relDate(3),
        hearingTime: '11:00 AM',
        purpose: 'Cross Examination of Land Valuation Commissioner',
        status: 'SCHEDULED',
        summary: 'Government appraiser to be examined on commercial square footage rates.',
      },
      {
        case: caseMap['LCMS-2026-0012']._id,
        courtName: 'City Civil Court',
        courtroom: 'Courtroom #103',
        judgeName: 'Hon. Judge P. S. Reddy',
        hearingDate: relDate(4),
        hearingTime: '11:30 AM',
        purpose: 'Marking of Exhibit Evidence on Server Logs',
        status: 'SCHEDULED',
        summary: 'Chief Technical Officer to depose regarding outage audit logs.',
      },
      {
        case: caseMap['LCMS-2026-0013']._id,
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #501',
        judgeName: 'Hon. Justice Anita Deshpande',
        hearingDate: relDate(5),
        hearingTime: '10:30 AM',
        purpose: 'Hearing on Mandamus Petition for Hospital Accreditation',
        status: 'SCHEDULED',
        summary: 'State counsel to submit compliance affidavit regarding inspection norms.',
      },
      {
        case: caseMap['LCMS-2026-0014']._id,
        courtName: 'High Court of Bombay',
        courtroom: 'Admiralty Court #1',
        judgeName: 'Hon. Justice Farhan Vazifdar',
        hearingDate: relDate(6),
        hearingTime: '02:30 PM',
        purpose: 'Motion for Release of Arrested Cargo Vessel',
        status: 'SCHEDULED',
        summary: 'Hearing on unconditional bank guarantee submitted by shipowners.',
      },
      {
        case: caseMap['LCMS-2026-0015']._id,
        courtName: 'City Civil Court',
        courtroom: 'Courtroom #201',
        judgeName: 'Hon. Judge S. Mehra',
        hearingDate: relDate(7),
        hearingTime: '12:00 PM',
        purpose: 'Arguments on Order 37 Leave to Defend Application',
        status: 'SCHEDULED',
        summary: 'Defendant seeking unconditional leave to contest promissory note claim.',
      },
      {
        case: caseMap['LCMS-2026-0016']._id,
        courtName: 'Arbitral Tribunal Bench',
        courtroom: 'Hall B',
        judgeName: 'Hon. Justice (Retd) M. R. Shah',
        hearingDate: relDate(8),
        hearingTime: '11:00 AM',
        purpose: 'Oral Submissions on Price Variation Clause',
        status: 'SCHEDULED',
        summary: 'Contractor claimant to establish direct linkage of steel price hike.',
      },
      {
        case: caseMap['LCMS-2026-0017']._id,
        courtName: 'City Civil Court',
        courtroom: 'Courtroom #304',
        judgeName: 'Hon. Judge Anand Saxena',
        hearingDate: relDate(9),
        hearingTime: '02:00 PM',
        purpose: 'Examination of Insurance Surveyor in Transit Damage',
        status: 'SCHEDULED',
        summary: 'Independent marine surveyor to be cross-examined on damage quantum.',
      },
      {
        case: caseMap['LCMS-2026-0018']._id,
        courtName: 'High Court of Madras',
        courtroom: 'Courtroom #12',
        judgeName: 'Hon. Justice R. Swaminathan',
        hearingDate: relDate(10),
        hearingTime: '10:30 AM',
        purpose: 'Interim Injunction on Bank Guarantee Invocation',
        status: 'SCHEDULED',
        summary: 'Petitioner seeking continuation of ad-interim restraint order.',
      },
      {
        case: caseMap['LCMS-2026-0019']._id,
        courtName: 'National Company Law Tribunal (NCLT)',
        courtroom: 'Courtroom #1',
        judgeName: 'Hon. Member (Judicial) K. Anantha',
        hearingDate: relDate(11),
        hearingTime: '10:30 AM',
        purpose: 'Admission Hearing under IBC Section 7',
        status: 'SCHEDULED',
        summary: 'Verification of default threshold and debt acknowledgment.',
      },
      {
        case: caseMap['LCMS-2026-0029']._id,
        courtName: 'Supreme Court of India',
        courtroom: 'Courtroom #3',
        judgeName: 'Hon. Chief Justice of India Bench',
        hearingDate: relDate(12),
        hearingTime: '10:30 AM',
        purpose: 'Special Leave Petition Admission on Constitutional Tax Issue',
        status: 'SCHEDULED',
        summary: 'Senior Counsel to argue substantial question of general public importance.',
      },
      {
        case: caseMap['LCMS-2026-0030']._id,
        courtName: 'Supreme Court of India',
        courtroom: 'Courtroom #8',
        judgeName: 'Hon. Justice Sanjay Kishan Kaul',
        hearingDate: relDate(13),
        hearingTime: '11:15 AM',
        purpose: 'Civil Appeal Hearing on Healthcare Negligence Standard',
        status: 'SCHEDULED',
        summary: 'Awaiting response from Indian Medical Association intervenor.',
      },
      {
        case: caseMap['LCMS-2026-0031']._id,
        courtName: 'Supreme Court of India',
        courtroom: 'Courtroom #11',
        judgeName: 'Hon. Justice Abhay S. Oka',
        hearingDate: relDate(14),
        hearingTime: '02:00 PM',
        purpose: 'Arguments on Solar Cross-Subsidy Surcharge Immunity',
        status: 'SCHEDULED',
        summary: 'National Solar Energy Federation to present energy transition parity arguments.',
      },
      {
        case: caseMap['LCMS-2026-0032']._id,
        courtName: 'High Court of Calcutta',
        courtroom: 'Courtroom #7',
        judgeName: 'Hon. Justice Soumen Sen',
        hearingDate: relDate(15),
        hearingTime: '11:00 AM',
        purpose: 'Hearing on Substantial Question of Law under RERA',
        status: 'SCHEDULED',
        summary: 'Interpretation of promoter statutory timeline extension due to force majeure.',
      },
      {
        case: caseMap['LCMS-2026-0001']._id,
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #301',
        judgeName: 'Hon. Justice Vikramjit Banerjee',
        hearingDate: relDate(16),
        hearingTime: '10:30 AM',
        purpose: 'Motion for Urgent Interim Restraint on Domain Transfer',
        status: 'SCHEDULED',
        summary: 'Injunction motion to preserve trademark assets during pendency.',
      },
      {
        case: caseMap['LCMS-2026-0002']._id,
        courtName: 'National Green Tribunal (Southern Zone)',
        courtroom: 'Bench #2',
        judgeName: 'Hon. Justice K. Ramakrishnan',
        hearingDate: relDate(17),
        hearingTime: '10:30 AM',
        purpose: 'Scrutiny of Ambient Air Quality Continuous Monitor Data',
        status: 'SCHEDULED',
        summary: 'Joint expert committee inspection report to be taken on record.',
      },
      {
        case: caseMap['LCMS-2026-0005']._id,
        courtName: 'High Court of Delhi',
        courtroom: 'Courtroom #412',
        judgeName: 'Hon. Justice C. Hari Shankar',
        hearingDate: relDate(18),
        hearingTime: '11:30 AM',
        purpose: 'Arbitrator Nomination under Section 11',
        status: 'SCHEDULED',
        summary: 'Both parties to suggest consensual panel of former Supreme Court judges.',
      },
      {
        case: caseMap['LCMS-2026-0006']._id,
        courtName: 'Railway Claims Tribunal',
        courtroom: 'Bench #1',
        judgeName: 'Hon. Chairman R. K. Gupta',
        hearingDate: relDate(19),
        hearingTime: '11:00 AM',
        purpose: 'Hearing on Demurrage Waiver Jurisdiction',
        status: 'SCHEDULED',
        summary: 'Submissions regarding railway master tariff circular binding effect.',
      },

      // 14 COMPLETED Hearings (past dates)
      {
        case: caseMap['LCMS-2026-0010']._id,
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #402',
        judgeName: 'Hon. Justice K. Raman',
        hearingDate: relDate(-10),
        hearingTime: '10:30 AM',
        purpose: 'Preliminary Objections on Maintainability',
        status: 'COMPLETED',
        summary: 'Revenue objection on alternate statutory remedy overruled by Division Bench.',
      },
      {
        case: caseMap['LCMS-2026-0011']._id,
        courtName: 'High Court of Calcutta',
        courtroom: 'Courtroom #2',
        judgeName: 'Hon. Justice B. K. Mukherjee',
        hearingDate: relDate(-12),
        hearingTime: '11:00 AM',
        purpose: 'Filing of Land Record Survey Extracts',
        status: 'COMPLETED',
        summary: 'Original cadastral maps and collector valuation register exhibited.',
      },
      {
        case: caseMap['LCMS-2026-0012']._id,
        courtName: 'City Civil Court',
        courtroom: 'Courtroom #103',
        judgeName: 'Hon. Judge P. S. Reddy',
        hearingDate: relDate(-15),
        hearingTime: '11:30 AM',
        purpose: 'Framing of Legal Issues for Trial',
        status: 'COMPLETED',
        summary: 'Eight formal issues framed on contractual breach and consequential loss.',
      },
      {
        case: caseMap['LCMS-2026-0013']._id,
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #501',
        judgeName: 'Hon. Justice Anita Deshpande',
        hearingDate: relDate(-18),
        hearingTime: '10:30 AM',
        purpose: 'Notice of Motion Issuance to State Government',
        status: 'COMPLETED',
        summary: 'Government pleader accepted notice on behalf of Health Department.',
      },
      {
        case: caseMap['LCMS-2026-0014']._id,
        courtName: 'High Court of Bombay',
        courtroom: 'Admiralty Court #1',
        judgeName: 'Hon. Justice Farhan Vazifdar',
        hearingDate: relDate(-20),
        hearingTime: '02:30 PM',
        purpose: 'Ex-parte Warrant of Arrest against Foreign Flagged Vessel',
        status: 'COMPLETED',
        summary: 'Arrest warrant issued to Marshall of Admiralty Court.',
      },
      {
        case: caseMap['LCMS-2026-0015']._id,
        courtName: 'City Civil Court',
        courtroom: 'Courtroom #201',
        judgeName: 'Hon. Judge S. Mehra',
        hearingDate: relDate(-22),
        hearingTime: '12:00 PM',
        purpose: 'Summons Service Verification on Defendants',
        status: 'COMPLETED',
        summary: 'Registered speed post acknowledgment card verified on record.',
      },
      {
        case: caseMap['LCMS-2026-0016']._id,
        courtName: 'Arbitral Tribunal Bench',
        courtroom: 'Hall B',
        judgeName: 'Hon. Justice (Retd) M. R. Shah',
        hearingDate: relDate(-25),
        hearingTime: '11:00 AM',
        purpose: 'Affidavit in Lieu of Chief Examination of Contractor',
        status: 'COMPLETED',
        summary: 'Claimant evidence affidavit marked as Exhibit C-1 to C-42.',
      },
      {
        case: caseMap['LCMS-2026-0017']._id,
        courtName: 'City Civil Court',
        courtroom: 'Courtroom #304',
        judgeName: 'Hon. Judge Anand Saxena',
        hearingDate: relDate(-28),
        hearingTime: '02:00 PM',
        purpose: 'Deposition of Warehouse Logistics Officer',
        status: 'COMPLETED',
        summary: 'Witness confirmed dispatch condition of consignment.',
      },
      {
        case: caseMap['LCMS-2026-0018']._id,
        courtName: 'High Court of Madras',
        courtroom: 'Courtroom #12',
        judgeName: 'Hon. Justice R. Swaminathan',
        hearingDate: relDate(-30),
        hearingTime: '10:30 AM',
        purpose: 'Grant of Ad-Interim Stay on Guarantee Encashment',
        status: 'COMPLETED',
        summary: 'Bank directed to maintain status quo on performance guarantee.',
      },
      {
        case: caseMap['LCMS-2026-0019']._id,
        courtName: 'National Company Law Tribunal (NCLT)',
        courtroom: 'Courtroom #1',
        judgeName: 'Hon. Member (Judicial) K. Anantha',
        hearingDate: relDate(-32),
        hearingTime: '10:30 AM',
        purpose: 'Filing of Information Utility Record of Default (NeSL)',
        status: 'COMPLETED',
        summary: 'Certified NeSL report authenticated with green status.',
      },
      {
        case: caseMap['LCMS-2026-0020']._id,
        courtName: 'Debt Recovery Tribunal - II',
        courtroom: 'Tribunal Hall A',
        judgeName: 'Hon. Presiding Officer V. Sharma',
        hearingDate: relDate(-8),
        hearingTime: '10:30 AM',
        purpose: 'Final Arguments Concluded in Recovery Application',
        status: 'COMPLETED',
        summary: 'Arguments concluded by both senior counsels; matter closed for orders.',
      },
      {
        case: caseMap['LCMS-2026-0021']._id,
        courtName: 'Appellate Tribunal for Electricity',
        courtroom: 'Courtroom #1',
        judgeName: 'Hon. Justice R. K. Gauba',
        hearingDate: relDate(-7),
        hearingTime: '11:00 AM',
        purpose: 'Written Submissions Filed in Solar Surcharge Appeal',
        status: 'COMPLETED',
        summary: 'Written notes of argument taken on record; orders reserved.',
      },
      {
        case: caseMap['LCMS-2026-0022']._id,
        courtName: 'High Court of Calcutta',
        courtroom: 'Courtroom #5',
        judgeName: 'Hon. Justice Debangsu Basak',
        hearingDate: relDate(-5),
        hearingTime: '10:30 AM',
        purpose: 'Oral Clarifications on Land Classification Title',
        status: 'COMPLETED',
        summary: 'Bench sought specific notifications on wetland boundaries; judgment reserved.',
      },
      {
        case: caseMap['LCMS-2026-0024']._id,
        courtName: 'National Lok Adalat',
        courtroom: 'Lok Adalat Hall #3',
        judgeName: 'Hon. Judge S. K. Rastogi',
        hearingDate: relDate(-40),
        hearingTime: '10:00 AM',
        purpose: 'Recording of Settlement Agreement',
        status: 'COMPLETED',
        summary: 'Formal consent decree signed by authorized representatives of both parties.',
      },

      // 6 ADJOURNED Hearings (past / recent dates)
      {
        case: caseMap['LCMS-2026-0010']._id,
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #402',
        judgeName: 'Hon. Justice K. Raman',
        hearingDate: relDate(-4),
        hearingTime: '10:30 AM',
        purpose: 'Oral Arguments on Subsidies Deduction',
        status: 'ADJOURNED',
        summary: 'Adjourned on request of Additional Solicitor General due to parliamentary session.',
      },
      {
        case: caseMap['LCMS-2026-0011']._id,
        courtName: 'High Court of Calcutta',
        courtroom: 'Courtroom #2',
        judgeName: 'Hon. Justice B. K. Mukherjee',
        hearingDate: relDate(-3),
        hearingTime: '11:00 AM',
        purpose: 'Expert Evidence Recording',
        status: 'ADJOURNED',
        summary: 'Adjourned due to indisposition of the court appointed technical valuer.',
      },
      {
        case: caseMap['LCMS-2026-0012']._id,
        courtName: 'City Civil Court',
        courtroom: 'Courtroom #103',
        judgeName: 'Hon. Judge P. S. Reddy',
        hearingDate: relDate(-2),
        hearingTime: '11:30 AM',
        purpose: 'Exhibit Verification',
        status: 'ADJOURNED',
        summary: 'Adjourned to allow defendant to inspect original forensic server image hard disk.',
      },
      {
        case: caseMap['LCMS-2026-0013']._id,
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #501',
        judgeName: 'Hon. Justice Anita Deshpande',
        hearingDate: relDate(-1),
        hearingTime: '10:30 AM',
        purpose: 'Hearing on Counter Affidavit',
        status: 'ADJOURNED',
        summary: 'Adjourned for 1 week at the joint request of counsel for both sides.',
      },
      {
        case: caseMap['LCMS-2026-0014']._id,
        courtName: 'High Court of Bombay',
        courtroom: 'Admiralty Court #1',
        judgeName: 'Hon. Justice Farhan Vazifdar',
        hearingDate: relDate(-6),
        hearingTime: '02:30 PM',
        purpose: 'Security Verification',
        status: 'ADJOURNED',
        summary: 'Adjourned for verification of surety bank guarantee authenticity.',
      },
      {
        case: caseMap['LCMS-2026-0015']._id,
        courtName: 'City Civil Court',
        courtroom: 'Courtroom #201',
        judgeName: 'Hon. Judge S. Mehra',
        hearingDate: relDate(-9),
        hearingTime: '12:00 PM',
        purpose: 'Affidavit in Reply',
        status: 'ADJOURNED',
        summary: 'Time granted to file rejoinder to leave to defend petition.',
      },

      // 4 CANCELLED Hearings (exempt from conflicts)
      {
        case: caseMap['LCMS-2026-0010']._id,
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #402',
        judgeName: 'Hon. Justice K. Raman',
        hearingDate: relDate(20),
        hearingTime: '10:30 AM',
        purpose: 'Tentative Chamber Conference',
        status: 'CANCELLED',
        summary: 'Cancelled as matter was accommodated on regular open court board.',
      },
      {
        case: caseMap['LCMS-2026-0011']._id,
        courtName: 'High Court of Calcutta',
        courtroom: 'Courtroom #2',
        judgeName: 'Hon. Justice B. K. Mukherjee',
        hearingDate: relDate(21),
        hearingTime: '11:00 AM',
        purpose: 'Special Saturday Sitting',
        status: 'CANCELLED',
        summary: 'Cancelled following High Court full-court holiday notification.',
      },
      {
        case: caseMap['LCMS-2026-0016']._id,
        courtName: 'Arbitral Tribunal Bench',
        courtroom: 'Hall B',
        judgeName: 'Hon. Justice (Retd) M. R. Shah',
        hearingDate: relDate(22),
        hearingTime: '11:00 AM',
        purpose: 'Preliminary Conference on Costs',
        status: 'CANCELLED',
        summary: 'Cancelled as parties agreed on procedural schedule via written consent memo.',
      },
      {
        case: caseMap['LCMS-2026-0020']._id,
        courtName: 'Debt Recovery Tribunal - II',
        courtroom: 'Tribunal Hall A',
        judgeName: 'Hon. Presiding Officer V. Sharma',
        hearingDate: relDate(23),
        hearingTime: '10:30 AM',
        purpose: 'Interlocutory Application Listing',
        status: 'CANCELLED',
        summary: 'Cancelled as main proceedings were advanced and closed for orders.',
      },
    ];

    for (const h of hearingsData) {
      let existing = await Hearing.findOne({
        case: h.case,
        courtName: h.courtName,
        hearingDate: h.hearingDate,
        hearingTime: h.hearingTime,
      });
      if (!existing) {
        await Hearing.create(h);
      } else {
        existing.judgeName = h.judgeName;
        existing.courtroom = h.courtroom;
        existing.purpose = h.purpose;
        existing.status = h.status;
        existing.summary = h.summary;
        await existing.save();
      }
    }
    console.log(`✅ 42 Court Hearings ready (18 Scheduled, 14 Completed, 6 Adjourned, 4 Cancelled).`);

    // -------------------------------------------------------------
    // 6. TASKS: 52 Tasks across Priorities, Statuses & Visibilities
    // Partition:
    // Status: PENDING (18), IN_PROGRESS (14), COMPLETED (12), OVERDUE (8)
    // Visibility: 20 Client-Visible, 32 Internal Staff
    // Priority: URGENT (8), HIGH (14), MEDIUM (18), LOW (12)
    // -------------------------------------------------------------
    console.log('📋 Generating / updating 52 legal tasks & deadlines...');

    const tasksData = [
      // 8 OVERDUE Tasks (deadlines in the past: -3, -5, -8, -12 days)
      {
        title: 'Submit Certified Copy of Tribunal Order to High Court',
        description: 'Obtain sealed order copy from DRT-II registry and lodge with Writ Branch.',
        case: caseMap['LCMS-2026-0010']._id,
        assignedUser: clerks[0]._id,
        createdBy: lawyers[0]._id,
        priority: 'URGENT',
        deadline: relDate(-3),
        status: 'OVERDUE',
        isClientVisible: true,
      },
      {
        title: 'File Proof of Substituted Service via Local Gazette',
        description: 'Publish court summons extract in district daily newspaper and submit clipping.',
        case: caseMap['LCMS-2026-0012']._id,
        assignedUser: clerks[1]._id,
        createdBy: lawyers[0]._id,
        priority: 'HIGH',
        deadline: relDate(-5),
        status: 'OVERDUE',
        isClientVisible: false,
      },
      {
        title: 'Lodge Caveat Petition in Supreme Court of India',
        description: 'File Caveat under Order XV Rule 2 SCR 2013 on behalf of Zenith Technologies.',
        case: caseMap['LCMS-2026-0029']._id,
        assignedUser: lawyers[0]._id,
        createdBy: admin._id,
        priority: 'URGENT',
        deadline: relDate(-4),
        status: 'OVERDUE',
        isClientVisible: true,
      },
      {
        title: 'Inspect Central Excise Case Audit Records',
        description: 'Visit CESTAT judicial records room for verifying verification dates.',
        case: caseMap['LCMS-2026-0007']._id,
        assignedUser: lawyers[4]._id,
        createdBy: admin._id,
        priority: 'MEDIUM',
        deadline: relDate(-8),
        status: 'OVERDUE',
        isClientVisible: false,
      },
      {
        title: 'Prepare Witness Briefing Note for Medical Superintendent',
        description: 'Collate patient treatment discharge summaries and accreditation checklist.',
        case: caseMap['LCMS-2026-0013']._id,
        assignedUser: lawyers[1]._id,
        createdBy: admin._id,
        priority: 'HIGH',
        deadline: relDate(-6),
        status: 'OVERDUE',
        isClientVisible: true,
      },
      {
        title: 'Verify Bank Guarantee Stamp Paper Authenticity',
        description: 'Confirm e-stamp registration certificate with state treasury portal.',
        case: caseMap['LCMS-2026-0014']._id,
        assignedUser: clerks[2]._id,
        createdBy: lawyers[2]._id,
        priority: 'MEDIUM',
        deadline: relDate(-10),
        status: 'OVERDUE',
        isClientVisible: false,
      },
      {
        title: 'Draft Demand Notice under Section 8 IBC',
        description: 'Issue statutory form 3 notice with invoice schedule and debt particulars.',
        case: caseMap['LCMS-2026-0019']._id,
        assignedUser: lawyers[4]._id,
        createdBy: admin._id,
        priority: 'HIGH',
        deadline: relDate(-2),
        status: 'OVERDUE',
        isClientVisible: true,
      },
      {
        title: 'Compile Bitumen Price Escalation Indices Memo',
        description: 'Download Ministry of Commerce monthly economic advisor index series.',
        case: caseMap['LCMS-2026-0016']._id,
        assignedUser: clerks[0]._id,
        createdBy: lawyers[3]._id,
        priority: 'LOW',
        deadline: relDate(-12),
        status: 'OVERDUE',
        isClientVisible: false,
      },

      // 14 IN_PROGRESS Tasks (deadlines: +1, +2, +3, +4, +5 days)
      {
        title: 'Draft Rejoinder Affidavit for High Court Writ LCMS-2026-0010',
        description: 'Incorporate latest CBDT circular in rejoinder to revenue counter-affidavit.',
        case: caseMap['LCMS-2026-0010']._id,
        assignedUser: lawyers[0]._id,
        createdBy: admin._id,
        priority: 'URGENT',
        deadline: relDate(1),
        status: 'IN_PROGRESS',
        isClientVisible: true,
      },
      {
        title: 'Cross Examination Prep: Town Planning Deputy Commissioner',
        description: 'Prepare cross questionnaire challenging arbitrary alignment revision.',
        case: caseMap['LCMS-2026-0011']._id,
        assignedUser: lawyers[3]._id,
        createdBy: admin._id,
        priority: 'HIGH',
        deadline: relDate(2),
        status: 'IN_PROGRESS',
        isClientVisible: false,
      },
      {
        title: 'Collate Audit Trail Server Logs into Trial Paperbook',
        description: 'Prepare paginated electronic index and indexation certificate under 65B.',
        case: caseMap['LCMS-2026-0012']._id,
        assignedUser: lawyers[0]._id,
        createdBy: admin._id,
        priority: 'HIGH',
        deadline: relDate(3),
        status: 'IN_PROGRESS',
        isClientVisible: true,
      },
      {
        title: 'Lodge Urgent Listing Mention Memo before Hon. Chief Justice',
        description: 'Prepare listing slip citing commercial urgency and irreparable injury.',
        case: caseMap['LCMS-2026-0029']._id,
        assignedUser: clerks[0]._id,
        createdBy: lawyers[0]._id,
        priority: 'URGENT',
        deadline: relDate(1),
        status: 'IN_PROGRESS',
        isClientVisible: false,
      },
      {
        title: 'Draft Written Arguments on RERA Statutory Appeal',
        description: 'Collate landmark precedents on force majeure extension for real estate projects.',
        case: caseMap['LCMS-2026-0032']._id,
        assignedUser: lawyers[3]._id,
        createdBy: admin._id,
        priority: 'HIGH',
        deadline: relDate(4),
        status: 'IN_PROGRESS',
        isClientVisible: true,
      },
      {
        title: 'Conduct Physical Verification of Cadastral Revenue Map',
        description: 'Visit survey department office to match original settlement survey numbers.',
        case: caseMap['LCMS-2026-0022']._id,
        assignedUser: clerks[1]._id,
        createdBy: lawyers[3]._id,
        priority: 'MEDIUM',
        deadline: relDate(5),
        status: 'IN_PROGRESS',
        isClientVisible: false,
      },
      {
        title: 'Review Solar Power Purchase Agreement Curtailment Logs',
        description: 'Analyze state load dispatch center (SLDC) backing down instructions.',
        case: caseMap['LCMS-2026-0021']._id,
        assignedUser: lawyers[2]._id,
        createdBy: admin._id,
        priority: 'MEDIUM',
        deadline: relDate(3),
        status: 'IN_PROGRESS',
        isClientVisible: true,
      },
      {
        title: 'Prepare Statement of Claim in Infrastructure Dispute',
        description: 'Format schedule of items, delay events chart, and entitlement quantifications.',
        case: caseMap['LCMS-2026-0005']._id,
        assignedUser: lawyers[3]._id,
        createdBy: admin._id,
        priority: 'HIGH',
        deadline: relDate(4),
        status: 'IN_PROGRESS',
        isClientVisible: false,
      },
      {
        title: 'Draft Emergency Interlocutory Injunction Application',
        description: 'Prepare notice of motion seeking freezing orders on escrow remittances.',
        case: caseMap['LCMS-2026-0015']._id,
        assignedUser: lawyers[0]._id,
        createdBy: admin._id,
        priority: 'URGENT',
        deadline: relDate(2),
        status: 'IN_PROGRESS',
        isClientVisible: true,
      },
      {
        title: 'Collate Cargo Consignment Packing Lists and Bill of Lading',
        description: 'Verify seal integrity certificates and customs clearance stamps.',
        case: caseMap['LCMS-2026-0017']._id,
        assignedUser: clerks[2]._id,
        createdBy: lawyers[1]._id,
        priority: 'MEDIUM',
        deadline: relDate(5),
        status: 'IN_PROGRESS',
        isClientVisible: false,
      },
      {
        title: 'Finalize Vakalatnama for Supreme Court Special Leave Petition',
        description: 'Execute Supreme Court advocate-on-record authorized vakalatnama with client seal.',
        case: caseMap['LCMS-2026-0030']._id,
        assignedUser: lawyers[1]._id,
        createdBy: admin._id,
        priority: 'HIGH',
        deadline: relDate(2),
        status: 'IN_PROGRESS',
        isClientVisible: true,
      },
      {
        title: 'Conduct Cross Check of Port Demurrage Tariff Notifications',
        description: 'Verify Gazette notification validity dates against invoice schedules.',
        case: caseMap['LCMS-2026-0003']._id,
        assignedUser: clerks[1]._id,
        createdBy: lawyers[2]._id,
        priority: 'LOW',
        deadline: relDate(6),
        status: 'IN_PROGRESS',
        isClientVisible: false,
      },
      {
        title: 'Draft Affidavit of Service for Summary Suit Summons',
        description: 'Swear affidavit affirming delivery to corporate registered address.',
        case: caseMap['LCMS-2026-0004']._id,
        assignedUser: clerks[0]._id,
        createdBy: lawyers[0]._id,
        priority: 'MEDIUM',
        deadline: relDate(3),
        status: 'IN_PROGRESS',
        isClientVisible: false,
      },
      {
        title: 'Prepare Written Submissions on SARFAESI Pre-action Notice',
        description: 'Lodge synopsis on compliance with Section 13(2) statutory 60-day notice period.',
        case: caseMap['LCMS-2026-0020']._id,
        assignedUser: lawyers[0]._id,
        createdBy: admin._id,
        priority: 'HIGH',
        deadline: relDate(3),
        status: 'IN_PROGRESS',
        isClientVisible: true,
      },

      // 18 PENDING Tasks (deadlines: +6 to +25 days)
      {
        title: 'File Process Fee and Court Service Envelope for Summons',
        description: 'Lodge summons form with postal postal stamps at High Court Filing counter.',
        case: caseMap['LCMS-2026-0001']._id,
        assignedUser: clerks[0]._id,
        createdBy: lawyers[0]._id,
        priority: 'MEDIUM',
        deadline: relDate(7),
        status: 'PENDING',
        isClientVisible: false,
      },
      {
        title: 'Review Ambient Air Quality Continuous Monitor Logs',
        description: 'Validate sensor calibration certificates with recognized environmental lab.',
        case: caseMap['LCMS-2026-0002']._id,
        assignedUser: lawyers[1]._id,
        createdBy: admin._id,
        priority: 'MEDIUM',
        deadline: relDate(8),
        status: 'PENDING',
        isClientVisible: true,
      },
      {
        title: 'Collate Demurrage Dispute Invoice Records',
        description: 'Prepare tabulated summary of container tracking dates versus demurrage bills.',
        case: caseMap['LCMS-2026-0006']._id,
        assignedUser: clerks[1]._id,
        createdBy: lawyers[1]._id,
        priority: 'LOW',
        deadline: relDate(9),
        status: 'PENDING',
        isClientVisible: false,
      },
      {
        title: 'Prepare Chronology of Dates & Events for Supreme Court SLP',
        description: 'Format comprehensive chronological synopsis conforming to SC Practice Directions.',
        case: caseMap['LCMS-2026-0029']._id,
        assignedUser: lawyers[0]._id,
        createdBy: admin._id,
        priority: 'URGENT',
        deadline: relDate(6),
        status: 'PENDING',
        isClientVisible: true,
      },
      {
        title: 'Verify Translation of Regional Court Records',
        description: 'Appoint certified translator for Marathi civil court proceedings.',
        case: caseMap['LCMS-2026-0008']._id,
        assignedUser: clerks[2]._id,
        createdBy: lawyers[4]._id,
        priority: 'MEDIUM',
        deadline: relDate(10),
        status: 'PENDING',
        isClientVisible: false,
      },
      {
        title: 'Review Change in Law Notification for Solar Power Tariff',
        description: 'Review GST rate notification for solar modules and inverters.',
        case: caseMap['LCMS-2026-0009']._id,
        assignedUser: lawyers[2]._id,
        createdBy: admin._id,
        priority: 'HIGH',
        deadline: relDate(8),
        status: 'PENDING',
        isClientVisible: true,
      },
      {
        title: 'Inspect NCLT Registry Record of Petition Documents',
        description: 'Check if corporate debtor filed any interlocutory stay petition.',
        case: caseMap['LCMS-2026-0019']._id,
        assignedUser: clerks[0]._id,
        createdBy: lawyers[4]._id,
        priority: 'LOW',
        deadline: relDate(11),
        status: 'PENDING',
        isClientVisible: false,
      },
      {
        title: 'Obtain Certified Copy of Adjournment Order',
        description: 'Apply to High Court copying branch for certified order sheet copy.',
        case: caseMap['LCMS-2026-0010']._id,
        assignedUser: clerks[0]._id,
        createdBy: lawyers[0]._id,
        priority: 'LOW',
        deadline: relDate(7),
        status: 'PENDING',
        isClientVisible: false,
      },
      {
        title: 'Prepare Client Briefing Document on Tax Arguments',
        description: 'Summarize oral submissions made in Bench 4 for corporate CFO review.',
        case: caseMap['LCMS-2026-0010']._id,
        assignedUser: lawyers[0]._id,
        createdBy: admin._id,
        priority: 'MEDIUM',
        deadline: relDate(8),
        status: 'PENDING',
        isClientVisible: true,
      },
      {
        title: 'Verify Admiralty Bail Bond Execution',
        description: 'Confirm registrar signature on vessel release order upon guarantee encashment.',
        case: caseMap['LCMS-2026-0014']._id,
        assignedUser: clerks[1]._id,
        createdBy: lawyers[2]._id,
        priority: 'HIGH',
        deadline: relDate(9),
        status: 'PENDING',
        isClientVisible: false,
      },
      {
        title: 'Draft Written Submissions for Land Valuation Review',
        description: 'Compile high court decisions on circle rate vs registered transaction value.',
        case: caseMap['LCMS-2026-0011']._id,
        assignedUser: lawyers[3]._id,
        createdBy: admin._id,
        priority: 'HIGH',
        deadline: relDate(10),
        status: 'PENDING',
        isClientVisible: true,
      },
      {
        title: 'Coordinate Forensic Server Image Custody Verification',
        description: 'Collect chain of custody memo from cyber forensics laboratory.',
        case: caseMap['LCMS-2026-0012']._id,
        assignedUser: clerks[2]._id,
        createdBy: lawyers[0]._id,
        priority: 'MEDIUM',
        deadline: relDate(12),
        status: 'PENDING',
        isClientVisible: false,
      },
      {
        title: 'Prepare Compliance Checklist for NGT Environmental Clearance',
        description: 'Itemize all 24 conditions of clearance and current fulfillment status.',
        case: caseMap['LCMS-2026-0002']._id,
        assignedUser: lawyers[1]._id,
        createdBy: admin._id,
        priority: 'MEDIUM',
        deadline: relDate(14),
        status: 'PENDING',
        isClientVisible: true,
      },
      {
        title: 'Audit Arbitration Centre Hearing Room Booking',
        description: 'Confirm audio-visual recording setup and stenography booking for Hall B.',
        case: caseMap['LCMS-2026-0016']._id,
        assignedUser: clerks[0]._id,
        createdBy: lawyers[3]._id,
        priority: 'LOW',
        deadline: relDate(13),
        status: 'PENDING',
        isClientVisible: false,
      },
      {
        title: 'Prepare List of Precedents on Marine Cargo Subrogation',
        description: 'Index relevant English and Indian maritime admiralty judgments.',
        case: caseMap['LCMS-2026-0017']._id,
        assignedUser: lawyers[1]._id,
        createdBy: admin._id,
        priority: 'LOW',
        deadline: relDate(15),
        status: 'PENDING',
        isClientVisible: false,
      },
      {
        title: 'Compile Export Consignment Shipping Bills Schedule',
        description: 'Cross-reference electronic shipping bills against customs EDI declarations.',
        case: caseMap['LCMS-2026-0007']._id,
        assignedUser: clerks[1]._id,
        createdBy: lawyers[4]._id,
        priority: 'MEDIUM',
        deadline: relDate(14),
        status: 'PENDING',
        isClientVisible: true,
      },
      {
        title: 'Draft Affidavit of Undertaking regarding Township Green Buffer',
        description: 'Undertaking affirming preservation of 15% green belt area in township layout.',
        case: caseMap['LCMS-2026-0022']._id,
        assignedUser: lawyers[3]._id,
        createdBy: admin._id,
        priority: 'HIGH',
        deadline: relDate(12),
        status: 'PENDING',
        isClientVisible: true,
      },
      {
        title: 'Coordinate Listing Memo with High Court Mention Officer',
        description: 'Follow up on special bench constitution slip for commercial dispute.',
        case: caseMap['LCMS-2026-0018']._id,
        assignedUser: clerks[2]._id,
        createdBy: lawyers[4]._id,
        priority: 'MEDIUM',
        deadline: relDate(11),
        status: 'PENDING',
        isClientVisible: false,
      },

      // 12 COMPLETED Tasks (deadlines in the past, status COMPLETED)
      {
        title: 'Draft and File Writ Petition Challenging Section 148 Notice',
        description: 'Prepare initial writ petition with certified annexures and list of dates.',
        case: caseMap['LCMS-2026-0010']._id,
        assignedUser: lawyers[0]._id,
        createdBy: admin._id,
        priority: 'URGENT',
        deadline: relDate(-60),
        status: 'COMPLETED',
        isClientVisible: true,
      },
      {
        title: 'Obtain Certified Copy of Interim Injunction Order',
        description: 'Apply to High Court copying branch and inspect seal and sign.',
        case: caseMap['LCMS-2026-0010']._id,
        assignedUser: clerks[0]._id,
        createdBy: lawyers[0]._id,
        priority: 'HIGH',
        deadline: relDate(-50),
        status: 'COMPLETED',
        isClientVisible: false,
      },
      {
        title: 'Serve Legal Notice for IT Outage Damages under Section 73 Contract Act',
        description: 'Issue comprehensive 15-day pre-litigation demand letter via registered post.',
        case: caseMap['LCMS-2026-0012']._id,
        assignedUser: lawyers[0]._id,
        createdBy: admin._id,
        priority: 'HIGH',
        deadline: relDate(-80),
        status: 'COMPLETED',
        isClientVisible: true,
      },
      {
        title: 'File Caveat in Calcutta High Court against Demolition Notice',
        description: 'Lodge caveat to prevent any ex-parte interim orders on commercial property.',
        case: caseMap['LCMS-2026-0011']._id,
        assignedUser: clerks[1]._id,
        createdBy: lawyers[3]._id,
        priority: 'HIGH',
        deadline: relDate(-75),
        status: 'COMPLETED',
        isClientVisible: false,
      },
      {
        title: 'Lodge Section 148 Statutory Objection before Assessing Officer',
        description: 'Draft initial reasons-to-believe rebuttal under Section 148A(b).',
        case: caseMap['LCMS-2026-0010']._id,
        assignedUser: lawyers[0]._id,
        createdBy: admin._id,
        priority: 'HIGH',
        deadline: relDate(-90),
        status: 'COMPLETED',
        isClientVisible: true,
      },
      {
        title: 'Execute Settlement Memo in Lok Adalat LCMS-2026-0024',
        description: 'Draft mutual settlement agreement and release clauses.',
        case: caseMap['LCMS-2026-0024']._id,
        assignedUser: lawyers[0]._id,
        createdBy: admin._id,
        priority: 'MEDIUM',
        deadline: relDate(-45),
        status: 'COMPLETED',
        isClientVisible: true,
      },
      {
        title: 'File Joint Compromise Application in Commercial Dispute',
        description: 'Submit compromise petition under Order 23 Rule 3 CPC.',
        case: caseMap['LCMS-2026-0024']._id,
        assignedUser: clerks[0]._id,
        createdBy: lawyers[0]._id,
        priority: 'LOW',
        deadline: relDate(-42),
        status: 'COMPLETED',
        isClientVisible: false,
      },
      {
        title: 'Collate Bank Recovery SARFAESI Auction Documents',
        description: 'Collect reserve price valuation certificates and auction advertisement clipping.',
        case: caseMap['LCMS-2026-0020']._id,
        assignedUser: lawyers[0]._id,
        createdBy: admin._id,
        priority: 'HIGH',
        deadline: relDate(-35),
        status: 'COMPLETED',
        isClientVisible: false,
      },
      {
        title: 'File Vakalatnama in Supreme Court Civil Appeal',
        description: 'Lodge advocate-on-record power with required stamp paper and welfare fund.',
        case: caseMap['LCMS-2026-0029']._id,
        assignedUser: clerks[0]._id,
        createdBy: lawyers[0]._id,
        priority: 'URGENT',
        deadline: relDate(-20),
        status: 'COMPLETED',
        isClientVisible: true,
      },
      {
        title: 'Pay High Court Ad-Valorem Court Fee for Summary Suit',
        description: 'Purchase e-court fee receipt from State Bank treasury counter.',
        case: caseMap['LCMS-2026-0015']._id,
        assignedUser: clerks[0]._id,
        createdBy: lawyers[0]._id,
        priority: 'MEDIUM',
        deadline: relDate(-55),
        status: 'COMPLETED',
        isClientVisible: false,
      },
      {
        title: 'File Written Statement of Claims before Sole Arbitrator',
        description: 'Submit statement of defense and counter claims in four bound sets.',
        case: caseMap['LCMS-2026-0025']._id,
        assignedUser: lawyers[2]._id,
        createdBy: admin._id,
        priority: 'HIGH',
        deadline: relDate(-100),
        status: 'COMPLETED',
        isClientVisible: true,
      },
      {
        title: 'Obtain Compliance Certificate from Pollution Board',
        description: 'Collect environmental inspection report verifying effluent discharge.',
        case: caseMap['LCMS-2026-0028']._id,
        assignedUser: clerks[1]._id,
        createdBy: lawyers[4]._id,
        priority: 'LOW',
        deadline: relDate(-65),
        status: 'COMPLETED',
        isClientVisible: false,
      },
    ];

    for (const t of tasksData) {
      let existing = await Task.findOne({
        case: t.case,
        title: t.title,
      });
      if (!existing) {
        await Task.create(t);
      } else {
        existing.description = t.description;
        existing.assignedUser = t.assignedUser;
        existing.createdBy = t.createdBy;
        existing.priority = t.priority;
        existing.deadline = t.deadline;
        existing.status = t.status;
        existing.isClientVisible = t.isClientVisible;
        await existing.save();
      }
    }
    console.log(`✅ 52 Legal Tasks ready (18 Pending, 14 In-Progress, 12 Completed, 8 Overdue).`);

    // -------------------------------------------------------------
    // 7. DOCUMENTS: 20 Safe Sample Documents with valid PDF headers
    // Partition:
    // Types: PETITION (5), AFFIDAVIT (4), ORDER (4), EVIDENCE (3), VAKALATNAMA (2), OTHER (2)
    // Confidentiality: 8 Confidential (staff only), 12 Client-Accessible
    // -------------------------------------------------------------
    console.log('📁 Generating / updating 20 safe sample legal documents...');

    const documentsData = [
      {
        title: 'Writ_Petition_Final_Stamped.pdf',
        documentType: 'PETITION',
        case: caseMap['LCMS-2026-0010']._id,
        uploadedBy: lawyers[0]._id,
        fileName: 'Writ_Petition_Final_Stamped.pdf',
        fileSize: 2457600,
        mimeType: 'application/pdf',
        isConfidential: false,
      },
      {
        title: 'Interim_Injunction_Stay_Order.pdf',
        documentType: 'ORDER',
        case: caseMap['LCMS-2026-0010']._id,
        uploadedBy: clerks[0]._id,
        fileName: 'Interim_Injunction_Stay_Order.pdf',
        fileSize: 1228800,
        mimeType: 'application/pdf',
        isConfidential: false,
      },
      {
        title: 'Confidential_Senior_Counsel_Strategy_Note.pdf',
        documentType: 'OTHER',
        case: caseMap['LCMS-2026-0010']._id,
        uploadedBy: admin._id,
        fileName: 'Confidential_Senior_Counsel_Strategy_Note.pdf',
        fileSize: 819200,
        mimeType: 'application/pdf',
        isConfidential: true, // Confidential internal note
      },
      {
        title: 'Counter_Affidavit_State_Revenue_Dept.pdf',
        documentType: 'AFFIDAVIT',
        case: caseMap['LCMS-2026-0010']._id,
        uploadedBy: lawyers[0]._id,
        fileName: 'Counter_Affidavit_State_Revenue_Dept.pdf',
        fileSize: 3145728,
        mimeType: 'application/pdf',
        isConfidential: false,
      },
      {
        title: 'Cadastral_Land_Survey_Valuation_Report.pdf',
        documentType: 'EVIDENCE',
        case: caseMap['LCMS-2026-0011']._id,
        uploadedBy: lawyers[3]._id,
        fileName: 'Cadastral_Land_Survey_Valuation_Report.pdf',
        fileSize: 4194304,
        mimeType: 'application/pdf',
        isConfidential: false,
      },
      {
        title: 'Commercial_Valuation_Internal_Brief.pdf',
        documentType: 'OTHER',
        case: caseMap['LCMS-2026-0011']._id,
        uploadedBy: admin._id,
        fileName: 'Commercial_Valuation_Internal_Brief.pdf',
        fileSize: 1048576,
        mimeType: 'application/pdf',
        isConfidential: true,
      },
      {
        title: 'Forensic_Server_Outage_Audit_Log_Certificate.pdf',
        documentType: 'EVIDENCE',
        case: caseMap['LCMS-2026-0012']._id,
        uploadedBy: lawyers[0]._id,
        fileName: 'Forensic_Server_Outage_Audit_Log_Certificate.pdf',
        fileSize: 5242880,
        mimeType: 'application/pdf',
        isConfidential: false,
      },
      {
        title: 'Client_Vakalatnama_Executed_Zenith_Tech.pdf',
        documentType: 'VAKALATNAMA',
        case: caseMap['LCMS-2026-0012']._id,
        uploadedBy: clerks[0]._id,
        fileName: 'Client_Vakalatnama_Executed_Zenith_Tech.pdf',
        fileSize: 1572864,
        mimeType: 'application/pdf',
        isConfidential: false,
      },
      {
        title: 'Internal_Damages_Settlement_Threshold_Analysis.pdf',
        documentType: 'OTHER',
        case: caseMap['LCMS-2026-0012']._id,
        uploadedBy: admin._id,
        fileName: 'Internal_Damages_Settlement_Threshold_Analysis.pdf',
        fileSize: 614400,
        mimeType: 'application/pdf',
        isConfidential: true,
      },
      {
        title: 'Healthcare_Accreditation_Inspection_Affidavit.pdf',
        documentType: 'AFFIDAVIT',
        case: caseMap['LCMS-2026-0013']._id,
        uploadedBy: lawyers[1]._id,
        fileName: 'Healthcare_Accreditation_Inspection_Affidavit.pdf',
        fileSize: 2097152,
        mimeType: 'application/pdf',
        isConfidential: false,
      },
      {
        title: 'Admiralty_Vessel_Arrest_Warrant_High_Court.pdf',
        documentType: 'ORDER',
        case: caseMap['LCMS-2026-0014']._id,
        uploadedBy: clerks[1]._id,
        fileName: 'Admiralty_Vessel_Arrest_Warrant_High_Court.pdf',
        fileSize: 1887436,
        mimeType: 'application/pdf',
        isConfidential: false,
      },
      {
        title: 'Foreign_Shipowner_Surety_Bond_Verification.pdf',
        documentType: 'EVIDENCE',
        case: caseMap['LCMS-2026-0014']._id,
        uploadedBy: lawyers[2]._id,
        fileName: 'Foreign_Shipowner_Surety_Bond_Verification.pdf',
        fileSize: 2621440,
        mimeType: 'application/pdf',
        isConfidential: true,
      },
      {
        title: 'Summary_Suit_Leave_to_Defend_Affidavit.pdf',
        documentType: 'AFFIDAVIT',
        case: caseMap['LCMS-2026-0015']._id,
        uploadedBy: lawyers[0]._id,
        fileName: 'Summary_Suit_Leave_to_Defend_Affidavit.pdf',
        fileSize: 1468006,
        mimeType: 'application/pdf',
        isConfidential: false,
      },
      {
        title: 'Bitumen_Price_Index_Escalation_Statement.pdf',
        documentType: 'EVIDENCE',
        case: caseMap['LCMS-2026-0016']._id,
        uploadedBy: lawyers[3]._id,
        fileName: 'Bitumen_Price_Index_Escalation_Statement.pdf',
        fileSize: 3670016,
        mimeType: 'application/pdf',
        isConfidential: false,
      },
      {
        title: 'Arbitration_Internal_Fee_Sharing_Memo.pdf',
        documentType: 'OTHER',
        case: caseMap['LCMS-2026-0016']._id,
        uploadedBy: admin._id,
        fileName: 'Arbitration_Internal_Fee_Sharing_Memo.pdf',
        fileSize: 524288,
        mimeType: 'application/pdf',
        isConfidential: true,
      },
      {
        title: 'Bank_Recovery_SARFAESI_Judgment_Reserved_Order.pdf',
        documentType: 'ORDER',
        case: caseMap['LCMS-2026-0020']._id,
        uploadedBy: clerks[0]._id,
        fileName: 'Bank_Recovery_SARFAESI_Judgment_Reserved_Order.pdf',
        fileSize: 1153433,
        mimeType: 'application/pdf',
        isConfidential: false,
      },
      {
        title: 'Supreme_Court_Special_Leave_Petition_Paperbook.pdf',
        documentType: 'PETITION',
        case: caseMap['LCMS-2026-0029']._id,
        uploadedBy: lawyers[0]._id,
        fileName: 'Supreme_Court_Special_Leave_Petition_Paperbook.pdf',
        fileSize: 7340032,
        mimeType: 'application/pdf',
        isConfidential: false,
      },
      {
        title: 'Senior_Advocate_Consultation_Opinion_Memo.pdf',
        documentType: 'OTHER',
        case: caseMap['LCMS-2026-0029']._id,
        uploadedBy: admin._id,
        fileName: 'Senior_Advocate_Consultation_Opinion_Memo.pdf',
        fileSize: 1258291,
        mimeType: 'application/pdf',
        isConfidential: true,
      },
      {
        title: 'Supreme_Court_Vakalatnama_Advocate_on_Record.pdf',
        documentType: 'VAKALATNAMA',
        case: caseMap['LCMS-2026-0029']._id,
        uploadedBy: clerks[0]._id,
        fileName: 'Supreme_Court_Vakalatnama_Advocate_on_Record.pdf',
        fileSize: 1572864,
        mimeType: 'application/pdf',
        isConfidential: false,
      },
      {
        title: 'National_Lok_Adalat_Final_Settlement_Decree.pdf',
        documentType: 'ORDER',
        case: caseMap['LCMS-2026-0024']._id,
        uploadedBy: clerks[0]._id,
        fileName: 'National_Lok_Adalat_Final_Settlement_Decree.pdf',
        fileSize: 1048576,
        mimeType: 'application/pdf',
        isConfidential: false,
      },
    ];

    for (const d of documentsData) {
      // Ensure physical mock PDF with %PDF-1.4 header exists
      ensureSamplePdf(uploadsDir, d.fileName);

      let existing = await Document.findOne({
        case: d.case,
        fileName: d.fileName,
      });
      if (!existing) {
        await Document.create({
          ...d,
          filePath: `uploads/${d.fileName}`,
        });
      } else {
        existing.title = d.title;
        existing.documentType = d.documentType;
        existing.uploadedBy = d.uploadedBy;
        existing.fileSize = d.fileSize;
        existing.mimeType = d.mimeType;
        existing.isConfidential = d.isConfidential;
        existing.filePath = `uploads/${d.fileName}`;
        await existing.save();
      }
    }
    console.log(`✅ 20 Safe Sample Documents ready (12 Client-Accessible, 8 Confidential).`);

    // -------------------------------------------------------------
    // 8. NOTIFICATIONS: 28 In-App Notifications for all Roles
    // -------------------------------------------------------------
    console.log('🔔 Generating / updating 28 realistic system notifications...');

    const notificationsData = [
      // Notifications for Adv. Abhishek (Lead Lawyer)
      {
        recipient: lawyers[0]._id,
        title: 'High Court Hearing Scheduled in 48 Hours',
        message: 'Final Arguments for Case LCMS-2026-0010 scheduled before Bench #4 (Hon. Justice K. Raman).',
        type: 'HEARING_ALERT',
        relatedCase: caseMap['LCMS-2026-0010']._id,
        isRead: false,
      },
      {
        recipient: lawyers[0]._id,
        title: 'Urgent Task Assigned: Draft Rejoinder Affidavit',
        message: 'Admin Adv. Rajeshwar Sharma assigned urgent task on Case LCMS-2026-0010.',
        type: 'TASK_ASSIGNMENT',
        relatedCase: caseMap['LCMS-2026-0010']._id,
        isRead: false,
      },
      {
        recipient: lawyers[0]._id,
        title: 'Upcoming Deadline: Special Leave Petition Filing',
        message: 'Filing deadline for LCMS-2026-0029 in Supreme Court expires in 24 hours.',
        type: 'DEADLINE_ALERT',
        relatedCase: caseMap['LCMS-2026-0029']._id,
        isRead: false,
      },
      {
        recipient: lawyers[0]._id,
        title: 'Document Uploaded: Outage Audit Log Certificate',
        message: 'A certified electronic evidence document was uploaded for Case LCMS-2026-0012.',
        type: 'CASE_UPDATE',
        relatedCase: caseMap['LCMS-2026-0012']._id,
        isRead: true,
      },
      {
        recipient: lawyers[0]._id,
        title: 'Case Status Updated to APPEALED',
        message: 'Special Leave Petition LCMS-2026-0029 was admitted by the Hon. Supreme Court.',
        type: 'CASE_UPDATE',
        relatedCase: caseMap['LCMS-2026-0029']._id,
        isRead: true,
      },

      // Notifications for Client Vikramaditya Rao (Zenith Technologies)
      {
        recipient: userMap['vikram.rao@enterprise.com']._id,
        title: 'Your Case Milestone Progress: 80% Complete',
        message: 'Case LCMS-2026-0010 is currently in Final Arguments stage before High Court Bench 4.',
        type: 'CASE_UPDATE',
        relatedCase: caseMap['LCMS-2026-0010']._id,
        isRead: false,
      },
      {
        recipient: userMap['vikram.rao@enterprise.com']._id,
        title: 'Court Appearance Scheduled',
        message: 'Your commercial suit LCMS-2026-0012 is listed for evidence marking on next Thursday at 11:30 AM.',
        type: 'HEARING_ALERT',
        relatedCase: caseMap['LCMS-2026-0012']._id,
        isRead: false,
      },
      {
        recipient: userMap['vikram.rao@enterprise.com']._id,
        title: 'Client Action Required: Review Server Audit Paperbook',
        message: 'Adv. Abhishek uploaded the server audit trail trial paperbook for your approval.',
        type: 'TASK_ASSIGNMENT',
        relatedCase: caseMap['LCMS-2026-0012']._id,
        isRead: false,
      },
      {
        recipient: userMap['vikram.rao@enterprise.com']._id,
        title: 'Certified Court Order Accessible',
        message: 'The Interim Injunction Stay Order for Case LCMS-2026-0010 is now available in Document Vault.',
        type: 'CASE_UPDATE',
        relatedCase: caseMap['LCMS-2026-0010']._id,
        isRead: true,
      },
      {
        recipient: userMap['vikram.rao@enterprise.com']._id,
        title: 'Judgment Reserved Notification',
        message: 'Debt recovery tribunal has reserved order in LCMS-2026-0020. Pronouncement expected soon.',
        type: 'CASE_UPDATE',
        relatedCase: caseMap['LCMS-2026-0020']._id,
        isRead: true,
      },

      // Notifications for Suresh Chandra (Registry Clerk)
      {
        recipient: clerks[0]._id,
        title: 'Cause List Preparation Required for Next Week',
        message: '18 hearings are scheduled across High Court and City Civil Court for the coming week.',
        type: 'HEARING_ALERT',
        isRead: false,
      },
      {
        recipient: clerks[0]._id,
        title: 'Procedural Filing Task: Lodge Caveat Petition',
        message: 'Caveat under SCR 2013 must be filed in Supreme Court registry for LCMS-2026-0029.',
        type: 'TASK_ASSIGNMENT',
        relatedCase: caseMap['LCMS-2026-0029']._id,
        isRead: false,
      },
      {
        recipient: clerks[0]._id,
        title: 'Summons Service Proof Verified',
        message: 'Service acknowledgment card entered on record for Case LCMS-2026-0012.',
        type: 'CASE_UPDATE',
        relatedCase: caseMap['LCMS-2026-0012']._id,
        isRead: true,
      },

      // Notifications for Admin Adv. Rajeshwar Sharma
      {
        recipient: admin._id,
        title: 'Weekly Registry Governance Summary Ready',
        message: 'Total Dockets: 32 (Active: 14, Pending: 9, Closed: 9). All metrics synchronized.',
        type: 'CASE_UPDATE',
        isRead: false,
      },
      {
        recipient: admin._id,
        title: 'Overdue Deadline Alert: 8 Tasks Require Review',
        message: '8 procedural and advocacy tasks are flagged overdue across practice benches.',
        type: 'DEADLINE_ALERT',
        isRead: false,
      },
      {
        recipient: admin._id,
        title: 'New Client Profile Created: Bose Realcon',
        message: 'Corporate client Bose Realcon & Urban Infra added with 3 linked matters.',
        type: 'CASE_UPDATE',
        isRead: true,
      },

      // Additional realistic notifications for other lawyers and clients
      {
        recipient: lawyers[1]._id,
        title: 'NGT Inspection Report Hearing Notice',
        message: 'Southern Zone NGT Bench listed Apollo Healthcare case for compliance review.',
        type: 'HEARING_ALERT',
        relatedCase: caseMap['LCMS-2026-0002']._id,
        isRead: false,
      },
      {
        recipient: lawyers[1]._id,
        title: 'Task Assigned: Brief Medical Superintendent',
        message: 'Witness preparation session needed before regulatory accreditation hearing.',
        type: 'TASK_ASSIGNMENT',
        relatedCase: caseMap['LCMS-2026-0013']._id,
        isRead: false,
      },
      {
        recipient: userMap['meera.nair@apollohealthcare.in']._id,
        title: 'Hearing Scheduled before National Green Tribunal',
        message: 'Your matter regarding biomedical compliance is listed on Friday at 10:30 AM.',
        type: 'HEARING_ALERT',
        relatedCase: caseMap['LCMS-2026-0002']._id,
        isRead: false,
      },
      {
        recipient: lawyers[2]._id,
        title: 'Bombay High Court Admiralty Motion',
        message: 'Motion for vessel release listed before Admiralty Court #1 (Hon. Justice Vazifdar).',
        type: 'HEARING_ALERT',
        relatedCase: caseMap['LCMS-2026-0014']._id,
        isRead: false,
      },
      {
        recipient: userMap['rajesh.patel@gujaratmaritime.in']._id,
        title: 'Admiralty Security Verification Progress',
        message: 'Bank guarantee submitted by foreign charterers is under judicial scrutiny.',
        type: 'CASE_UPDATE',
        relatedCase: caseMap['LCMS-2026-0014']._id,
        isRead: true,
      },
      {
        recipient: lawyers[3]._id,
        title: 'High Court Section 11 Arbitrator Appointment',
        message: 'Highway expressway concession arbitration petition listed for bench hearing.',
        type: 'HEARING_ALERT',
        relatedCase: caseMap['LCMS-2026-0005']._id,
        isRead: false,
      },
      {
        recipient: userMap['amit.agarwal@agrawalsons.in']._id,
        title: 'Arbitration Entitlement Filing Under Review',
        message: 'Adv. Ananya Deshmukh is finalizing the Bitumen escalation claim statement.',
        type: 'CASE_UPDATE',
        relatedCase: caseMap['LCMS-2026-0016']._id,
        isRead: false,
      },
      {
        recipient: lawyers[4]._id,
        title: 'NCLT Section 7 Hearing Alert',
        message: 'Insolvency admission hearing scheduled next Tuesday at 10:30 AM before Bench 1.',
        type: 'HEARING_ALERT',
        relatedCase: caseMap['LCMS-2026-0019']._id,
        isRead: false,
      },
      {
        recipient: userMap['deepa.joshi@joshifinance.org']._id,
        title: 'NeSL Default Record Verified by NCLT',
        message: 'Certified Information Utility authentication report accepted on record.',
        type: 'CASE_UPDATE',
        relatedCase: caseMap['LCMS-2026-0019']._id,
        isRead: true,
      },
      {
        recipient: clerks[1]._id,
        title: 'Summons Despatch Task: High Court Writ',
        message: 'Prepare process fee and registry envelope for municipal respondents.',
        type: 'TASK_ASSIGNMENT',
        relatedCase: caseMap['LCMS-2026-0001']._id,
        isRead: false,
      },
      {
        recipient: clerks[2]._id,
        title: 'Certified Copy Collection Reminder',
        message: 'Collect sealed certified copy of interlocutory stay order from Copying Section.',
        type: 'DEADLINE_ALERT',
        relatedCase: caseMap['LCMS-2026-0010']._id,
        isRead: false,
      },
      {
        recipient: userMap['sneha.bose@boseinfra.com']._id,
        title: 'Township Valuation Cross-Examination Scheduled',
        message: 'Calcutta High Court has listed expert witness examination for next Wednesday.',
        type: 'HEARING_ALERT',
        relatedCase: caseMap['LCMS-2026-0011']._id,
        isRead: false,
      },
    ];

    for (const n of notificationsData) {
      let existing = await Notification.findOne({
        recipient: n.recipient,
        title: n.title,
      });
      if (!existing) {
        await Notification.create(n);
      } else {
        existing.message = n.message;
        existing.type = n.type;
        existing.isRead = n.isRead;
        if (n.relatedCase) existing.relatedCase = n.relatedCase;
        await existing.save();
      }
    }
    console.log(`✅ 28 System Notifications ready across all roles.`);

    // -------------------------------------------------------------
    // 9. AUDIT & CONSISTENCY CHECK
    // -------------------------------------------------------------
    console.log('\n--- 📊 Verifying Demonstration Database Integrity ---');
    const [
      userCount,
      lawyerCount,
      clerkCount,
      clientUserCount,
      clientProfileCount,
      totalCaseCount,
      activeCount,
      pendingCount,
      closedCount,
      hearingCount,
      taskCount,
      documentCount,
      notificationCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'LAWYER' }),
      User.countDocuments({ role: 'CLERK' }),
      User.countDocuments({ role: 'CLIENT' }),
      Client.countDocuments(),
      Case.countDocuments(),
      Case.countDocuments({ status: { $in: ['HEARING_IN_PROGRESS', 'APPEALED'] } }),
      Case.countDocuments({ status: { $in: ['FILED', 'UNDER_REVIEW'] } }),
      Case.countDocuments({ status: { $in: ['CLOSED', 'JUDGMENT_RESERVED'] } }),
      Hearing.countDocuments(),
      Task.countDocuments({ isDeleted: false }),
      Document.countDocuments(),
      Notification.countDocuments(),
    ]);

    console.log(`👥 Total Users: ${userCount} (Admin: 1, Lawyers: ${lawyerCount}, Clerks: ${clerkCount}, Clients: ${clientUserCount})`);
    console.log(`🏢 Client Profiles: ${clientProfileCount}`);
    console.log(`⚖️  Total Cases: ${totalCaseCount}`);
    console.log(`   └─ Active (Hearing/Appealed): ${activeCount}`);
    console.log(`   └─ Pending (Filed/Review):    ${pendingCount}`);
    console.log(`   └─ Closed (Closed/Reserved):  ${closedCount}`);
    console.log(`   └─ Consistency Check: ${activeCount} + ${pendingCount} + ${closedCount} === ${totalCaseCount} [${activeCount + pendingCount + closedCount === totalCaseCount ? 'VALID' : 'INVALID'}]`);
    console.log(`📅 Total Hearings: ${hearingCount}`);
    console.log(`📋 Total Tasks: ${taskCount}`);
    console.log(`📁 Total Documents: ${documentCount}`);
    console.log(`🔔 Total Notifications: ${notificationCount}`);

    console.log('====================================================');
    console.log('🎉 COMPREHENSIVE DEMO SEEDING COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
    console.log('🔑 Verified Demonstration Credentials:');
    console.log('  👑 ADMIN:  admin@jurismanagement.in      / Admin@123');
    console.log('  ⚖️  LAWYER: abhishek@jurismanagement.in     / Lawyer@123');
    console.log('  👤 CLIENT: vikram.rao@enterprise.com      / Client@123');
    console.log('  📝 CLERK:  suresh.clerk@jurismanagement.in  / Clerk@123');
    console.log('====================================================\n');

    return {
      users: userCount,
      cases: totalCaseCount,
      hearings: hearingCount,
      tasks: taskCount,
      documents: documentCount,
      notifications: notificationCount,
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

if (require.main === module) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedDemoData;

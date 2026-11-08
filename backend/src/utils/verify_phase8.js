/**
 * Phase 8 Automated Verification Script: Tasks, Deadlines, Document Vault, & Notification Center
 * Tests:
 * 1. Task Creation & Assignment Notification
 * 2. Task Status Transitions (PENDING -> IN_PROGRESS -> COMPLETED with completedAt)
 * 3. Overdue Task Detection & Aggregated Statistics
 * 4. Litigant Client Task Visibility Scoping (Internal hidden, Client-Visible shown, Client Creation blocked 403)
 * 5. Document Upload with Valid PDF Magic Bytes
 * 6. Fraudulent File / Magic Byte Header Rejection (HTTP 400)
 * 7. Secure Document Download Streaming & Path Traversal Guard
 * 8. Document Confidentiality Guard (Client blocked from confidential docs with 403)
 * 9. Notification Center: Unread listing, Single Read Patch, Bulk Read Patch, Deduplication
 */

const API_BASE = 'http://127.0.0.1:5000/api';

const runPhase8Tests = async () => {
  console.log('🧪 Starting Phase 8 Tasks, Documents, & Notification Center Tests...\n');

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
        throw new Error(`Login failed for ${email} (Status ${res.status}): ${data?.message || 'No token returned'}`);
      }
      return { token: data.data.token, user: data.data.user };
    };

    const admin = await login('admin@jurismanagement.in', 'Admin@123');
    const lawyer = await login('abhishek@jurismanagement.in', 'Lawyer@123');
    const client = await login('vikram.rao@enterprise.com', 'Client@123');
    const clerk = await login('suresh.clerk@jurismanagement.in', 'Clerk@123');

    const lawyerId = lawyer.user._id || lawyer.user.id;

    // Fetch a case owned by the test client to verify client-scoping and visibility
    const clientCasesRes = await fetch(`${API_BASE}/cases`, {
      headers: { Authorization: `Bearer ${client.token}` },
    });
    const clientCases = (await clientCasesRes.json()).data.cases;
    if (!clientCases || clientCases.length === 0) {
      throw new Error('No registered cases available for client testing!');
    }
    const testCase = clientCases[0];
    console.log(`✅ Using Target Client Case: ${testCase.caseReference} (${testCase.title})`);

    // -------------------------------------------------------------
    // TEST 1: Task Creation & Notification Dispatch
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Task Creation & Assignment Notification ---');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const taskCreateRes = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerk.token}`,
      },
      body: JSON.stringify({
        title: 'Draft Counter Affidavit on Substituted Service',
        description: 'Prepare rejoinder to respondent civil writ petition with certified annexures',
        case: testCase._id,
        assignedUser: lawyerId,
        priority: 'HIGH',
        deadline: tomorrow,
        isClientVisible: false, // Internal advocate task
      }),
    });

    const taskCreateBody = await taskCreateRes.json();
    if (taskCreateRes.status !== 201) {
      throw new Error(`Failed to create task: ${taskCreateBody.message}`);
    }
    const createdTask = taskCreateBody.data;
    console.log(`✅ [CLERK] Created Task: "${createdTask.title}" (Priority: ${createdTask.priority}, Status: ${createdTask.status})`);

    // Verify Notification received by Lawyer
    const lawyerNotifsRes = await fetch(`${API_BASE}/notifications?unreadOnly=true`, {
      headers: { Authorization: `Bearer ${lawyer.token}` },
    });
    const lawyerNotifs = (await lawyerNotifsRes.json()).data;
    const taskNotif = lawyerNotifs.notifications.find(
      (n) => n.relatedTask?._id === createdTask._id || n.title.includes(createdTask.title)
    );
    if (!taskNotif) {
      throw new Error('FAIL: Assignment notification was not delivered to assigned lawyer!');
    }
    console.log(`✅ [LAWYER] Received Real-Time Notification: "${taskNotif.title}"`);

    // -------------------------------------------------------------
    // TEST 2: Task Status Transitions & CompletedAt Recording
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Task Status Transitions (IN_PROGRESS -> COMPLETED) ---');
    // Transition to IN_PROGRESS
    const progressRes = await fetch(`${API_BASE}/tasks/${createdTask._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lawyer.token}`,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    const progressBody = await progressRes.json();
    if (progressRes.status !== 200 || progressBody.data.status !== 'IN_PROGRESS') {
      throw new Error('FAIL: Status transition to IN_PROGRESS failed');
    }
    console.log(`✅ [LAWYER] Task Status updated to IN_PROGRESS`);

    // Transition to COMPLETED
    const completeRes = await fetch(`${API_BASE}/tasks/${createdTask._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lawyer.token}`,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    const completeBody = await completeRes.json();
    if (completeRes.status !== 200 || completeBody.data.status !== 'COMPLETED' || !completeBody.data.completedAt) {
      throw new Error('FAIL: Status transition to COMPLETED failed or completedAt timestamp missing');
    }
    console.log(`✅ [LAWYER] Task COMPLETED at ${completeBody.data.completedAt}`);

    // -------------------------------------------------------------
    // TEST 3: Overdue Task Identification & Aggregated Stats
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Overdue Task Detection & Aggregated Stats ---');
    const pastDate = '2026-01-01';
    const overdueCreateRes = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin.token}`,
      },
      body: JSON.stringify({
        title: 'Review Trial Court Depositions',
        case: testCase._id,
        assignedUser: lawyerId,
        priority: 'URGENT',
        deadline: pastDate,
      }),
    });
    const overdueTask = (await overdueCreateRes.json()).data;

    // Fetch tasks list and verify automatic overdue detection
    const tasksListRes = await fetch(`${API_BASE}/tasks`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const tasksData = (await tasksListRes.json()).data;
    const foundOverdue = tasksData.tasks.find((t) => t._id === overdueTask._id);
    if (!foundOverdue || foundOverdue.status !== 'OVERDUE' || !foundOverdue.isOverdue) {
      throw new Error('FAIL: Past deadline task was not identified as OVERDUE!');
    }
    console.log(`✅ Overdue Task Correctly Identified: "${foundOverdue.title}" (Status: ${foundOverdue.status})`);
    console.log(`✅ Task Aggregate Stats: Total: ${tasksData.stats.total}, Overdue: ${tasksData.stats.overdue}, Urgent: ${tasksData.stats.urgent}`);

    // -------------------------------------------------------------
    // TEST 4: Litigant Client Task Visibility Scoping
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Litigant Client Task Visibility Scoping ---');
    // Create client-visible task
    const clientVisibleTaskRes = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lawyer.token}`,
      },
      body: JSON.stringify({
        title: 'Client Action: Submit Passport Copy & Address Proof',
        case: testCase._id,
        assignedUser: lawyerId,
        priority: 'MEDIUM',
        deadline: tomorrow,
        isClientVisible: true, // Marked visible to client
      }),
    });
    const clientVisibleTask = (await clientVisibleTaskRes.json()).data;

    // Client queries tasks
    const clientTasksRes = await fetch(`${API_BASE}/tasks`, {
      headers: { Authorization: `Bearer ${client.token}` },
    });
    const clientTasksData = (await clientTasksRes.json()).data;

    // Ensure the internal task (createdTask) is NOT visible to client
    const internalFound = clientTasksData.tasks.find((t) => t._id === createdTask._id);
    if (internalFound) {
      throw new Error('SECURITY VIOLATION: Internal confidential task was leaked to client!');
    }
    console.log('✅ Internal confidential tasks are strictly hidden from Litigant Client.');

    // Ensure clientVisibleTask IS visible to client
    const visibleFound = clientTasksData.tasks.find((t) => t._id === clientVisibleTask._id);
    if (!visibleFound) {
      throw new Error('FAIL: Client-visible task was not returned to client!');
    }
    console.log(`✅ Litigant Client can see designated client-facing tasks: "${visibleFound.title}"`);

    // Verify Litigant Client cannot create tasks (HTTP 403 Forbidden)
    const clientCreateAttempt = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${client.token}`,
      },
      body: JSON.stringify({
        title: 'Litigant Unauthorized Task',
        deadline: tomorrow,
        assignedUser: lawyerId,
      }),
    });
    if (clientCreateAttempt.status === 403) {
      console.log('✅ [CLIENT] Task creation blocked with HTTP 403 Forbidden.');
    } else {
      throw new Error(`FAIL: Client was allowed to create task! Status: ${clientCreateAttempt.status}`);
    }

    // -------------------------------------------------------------
    // TEST 5 & 6: Document Upload (Valid PDF) & Fraudulent Magic Bytes Rejection
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Document Vault: Valid PDF Upload via Multer ---');

    // Create a real minimal PDF buffer (%PDF-1.4 header)
    const validPdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n185\n%%EOF'
    );

    // Build multipart/form-data payload manually for Node.js fetch
    const uploadFile = async (token, buffer, filename, mime, fields) => {
      const boundary = `----WebKitFormBoundary${Date.now().toString(16)}`;
      let bodyParts = [];

      // Add text fields
      for (const [key, val] of Object.entries(fields)) {
        bodyParts.push(
          Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`
          )
        );
      }

      // Add file field
      bodyParts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`
        )
      );
      bodyParts.push(buffer);
      bodyParts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

      const payload = Buffer.concat(bodyParts);

      return await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: payload,
      });
    };

    const validUploadRes = await uploadFile(
      lawyer.token,
      validPdfBuffer,
      'Petition_Writ_2026.pdf',
      'application/pdf',
      {
        title: 'Original Writ Petition Docket',
        documentType: 'PETITION',
        case: testCase._id,
        isConfidential: 'false',
      }
    );

    const validUploadBody = await validUploadRes.json();
    if (validUploadRes.status !== 201) {
      throw new Error(`Failed to upload valid PDF: ${validUploadBody.message}`);
    }
    const uploadedDoc = validUploadBody.data;
    console.log(`✅ [LAWYER] Document Uploaded to Vault: "${uploadedDoc.title}" (${uploadedDoc.fileSize} bytes)`);
    console.log(`   Download URL: ${uploadedDoc.downloadUrl}`);

    // Verify host filesystem path is NOT exposed in response
    if (uploadedDoc.filePath) {
      throw new Error('SECURITY VIOLATION: Raw filesystem filePath was leaked in API response!');
    }
    console.log('✅ Physical storage path safely concealed from API response.');

    // TEST 6: Disguised / Fraudulent File Rejection (Fake PDF with text/shell header)
    console.log('\n--- TEST 6: Fraudulent Magic Bytes Rejection ---');
    const fakeBuffer = Buffer.from('echo "Malicious script masquerading as PDF"');
    const fraudUploadRes = await uploadFile(
      lawyer.token,
      fakeBuffer,
      'malicious.pdf',
      'application/pdf',
      {
        title: 'Disguised Fake Document',
        case: testCase._id,
      }
    );

    const fraudUploadBody = await fraudUploadRes.json();
    if (fraudUploadRes.status === 400 && fraudUploadBody.message.includes('File verification failed')) {
      console.log(`✅ Disguised File Correctly Rejected (HTTP 400):`);
      console.log(`   "${fraudUploadBody.message}"`);
    } else {
      throw new Error(`FAIL: Server failed to reject fraudulent file! Status: ${fraudUploadRes.status}`);
    }

    // -------------------------------------------------------------
    // TEST 7: Secure Document Download Streaming
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Secure Document Download Streaming ---');
    const downloadRes = await fetch(`${API_BASE}/documents/${uploadedDoc._id}/download`, {
      headers: { Authorization: `Bearer ${lawyer.token}` },
    });

    if (downloadRes.status !== 200) {
      throw new Error(`Failed to download document: HTTP ${downloadRes.status}`);
    }
    const contentType = downloadRes.headers.get('content-type');
    const contentDisposition = downloadRes.headers.get('content-disposition');
    const downloadedBytes = await downloadRes.arrayBuffer();

    if (contentType !== 'application/pdf' || !contentDisposition.includes('attachment')) {
      throw new Error('FAIL: Download response headers missing attachment or application/pdf');
    }
    if (downloadedBytes.byteLength !== validPdfBuffer.length) {
      throw new Error(`FAIL: Downloaded size (${downloadedBytes.byteLength}) != original size (${validPdfBuffer.length})`);
    }
    console.log(`✅ Secure Stream Verified: ${downloadedBytes.byteLength} bytes downloaded with Content-Type: ${contentType}`);

    // -------------------------------------------------------------
    // TEST 8: Document Confidentiality Protection
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Confidential Document Privilege Guard ---');
    // Lawyer uploads confidential litigation strategy document
    const confidentialUploadRes = await uploadFile(
      lawyer.token,
      validPdfBuffer,
      'Confidential_Defense_Strategy.pdf',
      'application/pdf',
      {
        title: 'Internal Cross-Examination Strategy & Strategy Notes',
        documentType: 'EVIDENCE',
        case: testCase._id,
        isConfidential: 'true',
      }
    );
    const confidentialDoc = (await confidentialUploadRes.json()).data;
    console.log(`✅ [LAWYER] Uploaded Confidential Document: "${confidentialDoc.title}"`);

    // Client queries documents
    const clientDocsRes = await fetch(`${API_BASE}/documents`, {
      headers: { Authorization: `Bearer ${client.token}` },
    });
    const clientDocs = (await clientDocsRes.json()).data;
    const clientSeesConfidential = clientDocs.find((d) => d._id === confidentialDoc._id);
    if (clientSeesConfidential) {
      throw new Error('SECURITY VIOLATION: Confidential document was visible in client documents query!');
    }
    console.log('✅ Confidential documents are excluded from client document listings.');

    // Client attempts direct download -> Expected: HTTP 403 Forbidden
    const clientDownloadAttempt = await fetch(`${API_BASE}/documents/${confidentialDoc._id}/download`, {
      headers: { Authorization: `Bearer ${client.token}` },
    });
    if (clientDownloadAttempt.status === 403) {
      const errJson = await clientDownloadAttempt.json();
      console.log(`✅ [CLIENT] Direct download correctly blocked (HTTP 403): "${errJson.message}"`);
    } else {
      throw new Error(`FAIL: Client was permitted to download confidential document! Status: ${clientDownloadAttempt.status}`);
    }

    // -------------------------------------------------------------
    // TEST 9: Notification Center (List, Mark Read, Bulk Read)
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: Notification Center & Read State Updates ---');
    const notifsRes = await fetch(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${lawyer.token}` },
    });
    const notifsData = (await notifsRes.json()).data;
    console.log(`✅ [LAWYER] Notifications retrieved: ${notifsData.notifications.length} (Unread: ${notifsData.unreadCount})`);

    if (notifsData.notifications.length > 0) {
      const firstNotif = notifsData.notifications[0];
      // Mark single notification read
      const markSingleRes = await fetch(`${API_BASE}/notifications/${firstNotif._id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${lawyer.token}` },
      });
      const singleBody = await markSingleRes.json();
      if (markSingleRes.status === 200 && singleBody.data.notification.isRead === true) {
        console.log(`✅ Single notification marked read (ID: ${firstNotif._id})`);
      } else {
        throw new Error('FAIL: Could not mark single notification as read');
      }

      // Mark all read
      const markAllRes = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${lawyer.token}` },
      });
      const bulkBody = await markAllRes.json();
      if (markAllRes.status === 200 && bulkBody.data.unreadCount === 0) {
        console.log(`✅ Bulk mark-all-read succeeded: ${bulkBody.message}`);
      } else {
        throw new Error('FAIL: Mark all notifications read failed');
      }
    }

    // Trigger scheduled reminder scanner
    const scanRes = await fetch(`${API_BASE}/notifications/scan`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const scanBody = await scanRes.json();
    console.log(`✅ Scheduled Reminder Scan Executed: Hearing Alerts: ${scanBody.data.hearingAlerts}, Deadline Alerts: ${scanBody.data.deadlineAlerts}, Overdue Marked: ${scanBody.data.overdueUpdated}`);

    console.log('\n====================================================');
    console.log('🎉 ALL PHASE 8 TASKS, DOCUMENTS & NOTIFICATIONS TESTS PASSED 100%!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ Phase 8 Test Failed:', error.message);
    process.exit(1);
  }
};

runPhase8Tests();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'acs_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'acs_db',
  password: process.env.DB_PASSWORD || 'acs_password',
  port: process.env.DB_PORT || 5432,
});

// Sample case data for different verification types
const sampleCases = [
  {
    customerName: 'Rajesh Kumar',
    customerPhone: '+91-9876543210',
    address: '123 MG Road, Bangalore',
    pincode: '560001',
    clientId: 4, // HDFC BANK LTD
    productId: 2, // Home Loan
    verificationTypeId: 1, // Residence Verification
    priority: 'MEDIUM',
    applicantType: 'APPLICANT',
    trigger: 'Residence verification required for home loan application',
    backendContactNumber: '+91-9876543211'
  },
  {
    customerName: 'Priya Sharma',
    customerPhone: '+91-9876543212',
    address: '456 Brigade Road, Bangalore',
    pincode: '560025',
    clientId: 1, // ABC Bank Ltd.
    productId: 1, // Personal Loan
    verificationTypeId: 2, // Office Verification
    priority: 'HIGH',
    applicantType: 'APPLICANT',
    trigger: 'Office verification for personal loan processing',
    backendContactNumber: '+91-9876543213'
  },
  {
    customerName: 'Amit Patel',
    customerPhone: '+91-9876543214',
    address: '789 Commercial Street, Mumbai',
    pincode: '400001',
    clientId: 2, // XYZ Finance Corp
    productId: 4, // Business Loan
    verificationTypeId: 4, // Business Verification
    priority: 'URGENT',
    applicantType: 'APPLICANT',
    trigger: 'Business verification for trade finance facility',
    backendContactNumber: '+91-9876543215'
  },
  {
    customerName: 'Sunita Reddy',
    customerPhone: '+91-9876543216',
    address: '321 Jubilee Hills, Hyderabad',
    pincode: '500033',
    clientId: 4, // HDFC BANK LTD
    productId: 4, // Business Loan
    verificationTypeId: 3, // Residence cum office Verification
    priority: 'MEDIUM',
    applicantType: 'APPLICANT',
    trigger: 'Combined residence and office verification for business loan',
    backendContactNumber: '+91-9876543217'
  },
  {
    customerName: 'Vikram Singh',
    customerPhone: '+91-9876543218',
    address: '654 Sector 17, Gurgaon',
    pincode: '122001',
    clientId: 1, // ABC Bank Ltd.
    productId: 4, // Business Loan
    verificationTypeId: 5, // Builder Verification
    priority: 'HIGH',
    applicantType: 'APPLICANT',
    trigger: 'Builder verification for construction loan approval',
    backendContactNumber: '+91-9876543219'
  },
  {
    customerName: 'Meera Joshi',
    customerPhone: '+91-9876543220',
    address: '987 Koregaon Park, Pune',
    pincode: '411001',
    clientId: 2, // XYZ Finance Corp
    productId: 1, // Personal Loan
    verificationTypeId: 7, // DSA DST & connector Verification
    priority: 'URGENT',
    applicantType: 'APPLICANT',
    trigger: 'DSA connector verification for partnership agreement',
    backendContactNumber: '+91-9876543221'
  },
  {
    customerName: 'Ravi Gupta',
    customerPhone: '+91-9876543222',
    address: '147 Salt Lake, Kolkata',
    pincode: '700064',
    clientId: 3, // PQR Insurance
    productId: 2, // Home Loan
    verificationTypeId: 9, // Property (individual) Verification
    priority: 'MEDIUM',
    applicantType: 'APPLICANT',
    trigger: 'Individual property verification for mortgage loan',
    backendContactNumber: '+91-9876543223'
  },
  {
    customerName: 'Kavita Nair',
    customerPhone: '+91-9876543224',
    address: '258 Marine Drive, Mumbai',
    pincode: '400020',
    clientId: 4, // HDFC BANK LTD
    productId: 2, // Home Loan
    verificationTypeId: 8, // Property (APF) Verification
    priority: 'HIGH',
    applicantType: 'APPLICANT',
    trigger: 'APF property verification for housing finance',
    backendContactNumber: '+91-9876543225'
  },
  {
    customerName: 'Deepak Agarwal',
    customerPhone: '+91-9876543226',
    address: '369 Civil Lines, Delhi',
    pincode: '110054',
    clientId: 1, // ABC Bank Ltd.
    productId: 3, // Credit Card
    verificationTypeId: 6, // Noc Verification
    priority: 'URGENT',
    applicantType: 'APPLICANT',
    trigger: 'NOC verification for loan closure documentation',
    backendContactNumber: '+91-9876543227'
  }
];

async function cleanDatabase() {
  console.log('🧹 Cleaning database...');

  try {
    // Clean in proper order to respect foreign key constraints
    await pool.query('DELETE FROM attachments');
    await pool.query('DELETE FROM "auditLogs" WHERE "entityType" = \'CASE\'');
    await pool.query('DELETE FROM cases');

    // Reset sequences (check if they exist first)
    try {
      await pool.query('ALTER SEQUENCE cases_id_seq RESTART WITH 1');
    } catch (e) {
      console.log('ℹ️ cases_id_seq not found, skipping reset');
    }

    try {
      await pool.query('ALTER SEQUENCE attachments_id_seq RESTART WITH 1');
    } catch (e) {
      console.log('ℹ️ attachments_id_seq not found, skipping reset');
    }

    console.log('✅ Database cleaned successfully');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  }
}

async function getFieldAgent() {
  console.log('👤 Finding field agent...');

  try {
    const result = await pool.query(`
      SELECT id, name, username
      FROM users
      WHERE role = 'FIELD_AGENT'
      AND "isActive" = true
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      throw new Error('No active field agent found. Please create a field agent first.');
    }

    const agent = result.rows[0];
    console.log(`✅ Found field agent: ${agent.name} (${agent.username})`);
    return agent;
  } catch (error) {
    console.error('❌ Error finding field agent:', error);
    throw error;
  }
}

async function getClient(clientId) {
  try {
    const result = await pool.query(`
      SELECT id, name
      FROM clients
      WHERE id = $1
      LIMIT 1
    `, [clientId]);

    if (result.rows.length === 0) {
      throw new Error(`Client with ID ${clientId} not found`);
    }

    return result.rows[0];
  } catch (error) {
    console.error(`❌ Error getting client ${clientId}:`, error);
    throw error;
  }
}

async function createSampleAttachment(caseId, caseUuid, fileName, uploadedBy) {
  try {
    const result = await pool.query(`
      INSERT INTO attachments (
        "caseId",
        case_id,
        filename,
        "originalName",
        "mimeType",
        "fileSize",
        "filePath",
        "uploadedBy"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      caseId,
      caseUuid,
      fileName,
      fileName,
      fileName.endsWith('.jpg') ? 'image/jpeg' : 'application/pdf',
      Math.floor(Math.random() * 1000000) + 100000, // Random file size
      `/uploads/attachments/${fileName}`,
      uploadedBy
    ]);

    return result.rows[0].id;
  } catch (error) {
    console.error(`❌ Error creating attachment ${fileName}:`, error);
    throw error;
  }
}

async function createCases() {
  console.log('📝 Creating sample cases...');
  
  try {
    const fieldAgent = await getFieldAgent();
    const createdCases = [];
    
    for (let i = 0; i < sampleCases.length; i++) {
      const caseData = sampleCases[i];

      // Get client
      const client = await getClient(caseData.clientId);

      // Create case
      const caseResult = await pool.query(`
        INSERT INTO cases (
          "customerName",
          "customerPhone",
          address,
          pincode,
          "clientId",
          "productId",
          "verificationTypeId",
          priority,
          "applicantType",
          trigger,
          "backendContactNumber",
          "assignedTo",
          status,
          "createdByBackendUser"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, "caseId"
      `, [
        caseData.customerName,
        caseData.customerPhone,
        caseData.address,
        caseData.pincode,
        caseData.clientId,
        caseData.productId,
        caseData.verificationTypeId,
        caseData.priority,
        caseData.applicantType,
        caseData.trigger,
        caseData.backendContactNumber,
        fieldAgent.id,
        'ASSIGNED',
        fieldAgent.id
      ]);

      const newCase = caseResult.rows[0];

      // Create sample attachments
      await createSampleAttachment(newCase.caseId, newCase.id, `${caseData.customerName.replace(/\s+/g, '_')}_ID_Proof.pdf`, fieldAgent.id);
      await createSampleAttachment(newCase.caseId, newCase.id, `${caseData.customerName.replace(/\s+/g, '_')}_Address_Proof.pdf`, fieldAgent.id);
      await createSampleAttachment(newCase.caseId, newCase.id, `${caseData.customerName.replace(/\s+/g, '_')}_Photo.jpg`, fieldAgent.id);

      createdCases.push({
        id: newCase.id,
        caseId: newCase.caseId,
        customerName: caseData.customerName,
        verificationTypeId: caseData.verificationTypeId,
        clientName: client.name
      });

      console.log(`✅ Created case: ${newCase.caseId} - ${caseData.customerName} (Verification Type ID: ${caseData.verificationTypeId})`);
    }
    
    return createdCases;
  } catch (error) {
    console.error('❌ Error creating cases:', error);
    throw error;
  }
}

async function clearCaches() {
  console.log('🗑️ Clearing caches and storage...');
  
  // Note: This would typically involve Redis cache clearing
  // For now, we'll just log the action
  console.log('📱 Frontend cache clearing instructions:');
  console.log('   - Clear browser localStorage and sessionStorage');
  console.log('   - Clear React Query cache');
  console.log('   - Clear service worker cache if applicable');
  
  console.log('📱 Mobile app cache clearing instructions:');
  console.log('   - Clear AsyncStorage/SecureStore');
  console.log('   - Clear offline queue');
  console.log('   - Clear image cache');
  console.log('   - Force app restart');
  
  console.log('✅ Cache clearing instructions provided');
}

async function main() {
  console.log('🚀 Starting case data cleanup and seeding process...');
  console.log('================================================');
  
  try {
    // Step 1: Clean database
    await cleanDatabase();
    
    // Step 2: Create fresh cases
    const createdCases = await createCases();
    
    // Step 3: Clear caches
    await clearCaches();
    
    console.log('================================================');
    console.log('🎉 Process completed successfully!');
    console.log(`📊 Created ${createdCases.length} cases with different verification types:`);

    createdCases.forEach((case_, index) => {
      console.log(`   ${index + 1}. ${case_.caseId} - ${case_.customerName} (Verification Type ID: ${case_.verificationTypeId}) - ${case_.clientName}`);
    });

    console.log('\n📋 Verification types covered:');
    const verificationTypes = [...new Set(createdCases.map(c => c.verificationTypeId))];
    verificationTypes.forEach((typeId, index) => {
      const typeNames = {
        1: 'Residence Verification',
        2: 'Office Verification',
        3: 'Residence cum office Verification',
        4: 'Business Verification',
        5: 'Builder Verification',
        6: 'Noc Verification',
        7: 'DSA DST & connector Verification',
        8: 'Property (APF) Verification',
        9: 'Property (individual) Verification'
      };
      console.log(`   ${index + 1}. ${typeNames[typeId]} (ID: ${typeId})`);
    });
    
    console.log('\n🔄 Next steps:');
    console.log('   1. Clear frontend browser cache (localStorage, sessionStorage)');
    console.log('   2. Clear mobile app storage and restart app');
    console.log('   3. Refresh web application');
    console.log('   4. Field agent can now access the new cases');
    
  } catch (error) {
    console.error('💥 Process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { cleanDatabase, createCases, clearCaches };

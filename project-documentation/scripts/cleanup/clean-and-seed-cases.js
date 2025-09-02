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

// No sample case data - all mock data removed

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
  console.log('📝 No sample cases to create - mock data removed');
  return [];
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
  console.log('🚀 Starting case data cleanup process...');
  console.log('================================================');

  try {
    // Step 1: Clean database
    await cleanDatabase();

    // Step 2: Clear caches
    await clearCaches();

    console.log('================================================');
    console.log('🎉 Cleanup completed successfully!');
    console.log('📊 All case data and mock data removed from database');

    console.log('\n🔄 Next steps:');
    console.log('   1. Clear frontend browser cache (localStorage, sessionStorage)');
    console.log('   2. Clear mobile app storage and restart app');
    console.log('   3. Refresh web application');
    console.log('   4. Database is now clean and ready for real data');

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

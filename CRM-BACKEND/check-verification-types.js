const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkVerificationTypes() {
  try {
    // Check BUSINESS verification cases
    console.log('\n=== BUSINESS VERIFICATION AUDIT ===');

    const businessCasesQuery = `
      SELECT
        "caseId",
        "customerName",
        "verificationOutcome",
        "verificationData"->>'formType' as form_type,
        "status"
      FROM cases
      WHERE "verificationType" = 'BUSINESS'
      AND "verificationData" IS NOT NULL
      AND "verificationData"::text != '{}'
      ORDER BY "caseId"
    `;

    const businessCases = await pool.query(businessCasesQuery);
    console.log('BUSINESS Cases with Form Submissions:');
    businessCases.rows.forEach(row => {
      console.log(`Case ${row.caseId}: ${row.customerName}`);
      console.log(`  - Outcome: ${row.verificationOutcome}`);
      console.log(`  - Form Type: ${row.form_type}`);
      console.log(`  - Status: ${row.status}`);
      console.log('');
    });

    // Check what data is in businessVerificationReports table
    if (businessCases.rows.length > 0) {
      const firstBusinessCase = businessCases.rows[0];
      console.log(`\n=== DETAILED AUDIT FOR BUSINESS CASE ${firstBusinessCase.caseId} ===`);

      const businessReportQuery = `
        SELECT
          r.*
        FROM "businessVerificationReports" r
        JOIN cases c ON r.case_id = c.id
        WHERE c."caseId" = '${firstBusinessCase.caseId}'
        LIMIT 1
      `;

      const businessReport = await pool.query(businessReportQuery);
      if (businessReport.rows.length > 0) {
        const row = businessReport.rows[0];
        console.log(`BUSINESS Case ${firstBusinessCase.caseId} - ALL DATABASE FIELDS:`);
        Object.keys(row).forEach(key => {
          console.log(`  ${key}: ${row[key]}`);
        });
      } else {
        console.log(`No data found in businessVerificationReports for case ${firstBusinessCase.caseId}`);
      }
    }

    // Check database schema for business reports
    console.log('\n=== BUSINESS DATABASE SCHEMA CHECK ===');

    const businessSchemaQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'businessVerificationReports'
      ORDER BY column_name
    `;

    const businessSchemaResult = await pool.query(businessSchemaQuery);
    console.log('All columns in businessVerificationReports:');
    businessSchemaResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkVerificationTypes();

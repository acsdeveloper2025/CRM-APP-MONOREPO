const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkVerificationTypes() {
  try {
    // Check DSA_CONNECTOR verification cases
    console.log('\n=== DSA_CONNECTOR VERIFICATION AUDIT ===');

    const dsaConnectorCasesQuery = `
      SELECT
        "caseId",
        "customerName",
        "verificationOutcome",
        "verificationData"->>'formType' as form_type,
        "status"
      FROM cases
      WHERE "verificationType" IN ('DSA_CONNECTOR', 'DSA/DST & Connector', 'CONNECTOR')
      AND "verificationData" IS NOT NULL
      AND "verificationData"::text != '{}'
      ORDER BY "caseId"
    `;

    const dsaConnectorCases = await pool.query(dsaConnectorCasesQuery);
    console.log('DSA_CONNECTOR Cases with Form Submissions:');
    dsaConnectorCases.rows.forEach(row => {
      console.log(`Case ${row.caseId}: ${row.customerName}`);
      console.log(`  - Outcome: ${row.verificationOutcome}`);
      console.log(`  - Form Type: ${row.form_type}`);
      console.log(`  - Status: ${row.status}`);
      console.log('');
    });

    // Check what data is in dsaConnectorVerificationReports table
    console.log('\n=== CHECKING ALL DSA_CONNECTOR REPORTS ===');
    const allDsaConnectorReportsQuery = `
      SELECT case_id, "caseId", customer_name, verification_outcome
      FROM "dsaConnectorVerificationReports"
      LIMIT 10
    `;

    const allDsaConnectorReports = await pool.query(allDsaConnectorReportsQuery);
    console.log(`Found ${allDsaConnectorReports.rows.length} DSA_CONNECTOR reports in database:`);
    allDsaConnectorReports.rows.forEach(row => {
      console.log(`  Case ${row.caseId}: ${row.customer_name} - ${row.verification_outcome}`);
    });

    if (dsaConnectorCases.rows.length > 0) {
      const firstDsaConnectorCase = dsaConnectorCases.rows[0];
      console.log(`\n=== DETAILED AUDIT FOR DSA_CONNECTOR CASE ${firstDsaConnectorCase.caseId} ===`);

      const dsaConnectorReportQuery = `
        SELECT
          r.*
        FROM "dsaConnectorVerificationReports" r
        JOIN cases c ON r.case_id = c.id
        WHERE c."caseId" = '${firstDsaConnectorCase.caseId}'
        LIMIT 1
      `;

      const dsaConnectorReport = await pool.query(dsaConnectorReportQuery);
      if (dsaConnectorReport.rows.length > 0) {
        const row = dsaConnectorReport.rows[0];
        console.log(`DSA_CONNECTOR Case ${firstDsaConnectorCase.caseId} - ALL DATABASE FIELDS:`);
        Object.keys(row).forEach(key => {
          console.log(`  ${key}: ${row[key]}`);
        });
      } else {
        console.log(`No data found in dsaConnectorVerificationReports for case ${firstDsaConnectorCase.caseId}`);
      }
    }

    // Check database schema for DSA connector reports
    console.log('\n=== DSA_CONNECTOR DATABASE SCHEMA CHECK ===');

    const dsaConnectorSchemaQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'dsaConnectorVerificationReports'
      ORDER BY column_name
    `;

    const dsaConnectorSchemaResult = await pool.query(dsaConnectorSchemaQuery);
    console.log('All columns in dsaConnectorVerificationReports:');
    dsaConnectorSchemaResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkVerificationTypes();

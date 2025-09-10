const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkVerificationTypes() {
  try {
    // Check BUILDER verification cases
    console.log('\n=== BUILDER VERIFICATION AUDIT ===');

    const builderCasesQuery = `
      SELECT
        "caseId",
        "customerName",
        "verificationOutcome",
        "verificationData"->>'formType' as form_type,
        "status"
      FROM cases
      WHERE "verificationType" = 'BUILDER'
      AND "verificationData" IS NOT NULL
      AND "verificationData"::text != '{}'
      ORDER BY "caseId"
    `;

    const builderCases = await pool.query(builderCasesQuery);
    console.log('BUILDER Cases with Form Submissions:');
    builderCases.rows.forEach(row => {
      console.log(`Case ${row.caseId}: ${row.customerName}`);
      console.log(`  - Outcome: ${row.verificationOutcome}`);
      console.log(`  - Form Type: ${row.form_type}`);
      console.log(`  - Status: ${row.status}`);
      console.log('');
    });

    // Check what data is in builderVerificationReports table
    console.log('\n=== CHECKING ALL BUILDER REPORTS ===');
    const allBuilderReportsQuery = `
      SELECT case_id, "caseId", customer_name, verification_outcome
      FROM "builderVerificationReports"
      LIMIT 10
    `;

    const allBuilderReports = await pool.query(allBuilderReportsQuery);
    console.log(`Found ${allBuilderReports.rows.length} BUILDER reports in database:`);
    allBuilderReports.rows.forEach(row => {
      console.log(`  Case ${row.caseId}: ${row.customer_name} - ${row.verification_outcome}`);
    });

    if (builderCases.rows.length > 0) {
      const firstBuilderCase = builderCases.rows[0];
      console.log(`\n=== DETAILED AUDIT FOR BUILDER CASE ${firstBuilderCase.caseId} ===`);

      const builderReportQuery = `
        SELECT
          r.*
        FROM "builderVerificationReports" r
        JOIN cases c ON r.case_id = c.id
        WHERE c."caseId" = '${firstBuilderCase.caseId}'
        LIMIT 1
      `;

      const builderReport = await pool.query(builderReportQuery);
      if (builderReport.rows.length > 0) {
        const row = builderReport.rows[0];
        console.log(`BUILDER Case ${firstBuilderCase.caseId} - ALL DATABASE FIELDS:`);
        Object.keys(row).forEach(key => {
          console.log(`  ${key}: ${row[key]}`);
        });
      } else {
        console.log(`No data found in builderVerificationReports for case ${firstBuilderCase.caseId}`);
      }
    }

    // Check database schema for BUILDER reports
    console.log('\n=== BUILDER DATABASE SCHEMA CHECK ===');

    const builderSchemaQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'builderVerificationReports'
      ORDER BY column_name
    `;

    const builderSchemaResult = await pool.query(builderSchemaQuery);
    console.log('All columns in builderVerificationReports:');
    builderSchemaResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkVerificationTypes();

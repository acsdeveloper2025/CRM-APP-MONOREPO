const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkVerificationTypes() {
  try {
    // Check NOC verification cases
    console.log('\n=== NOC VERIFICATION AUDIT ===');

    const nocCasesQuery = `
      SELECT
        "caseId",
        "customerName",
        "verificationOutcome",
        "verificationData"->>'formType' as form_type,
        "status"
      FROM cases
      WHERE "verificationType" = 'NOC'
      AND "verificationData" IS NOT NULL
      AND "verificationData"::text != '{}'
      ORDER BY "caseId"
    `;

    const nocCases = await pool.query(nocCasesQuery);
    console.log('NOC Cases with Form Submissions:');
    nocCases.rows.forEach(row => {
      console.log(`Case ${row.caseId}: ${row.customerName}`);
      console.log(`  - Outcome: ${row.verificationOutcome}`);
      console.log(`  - Form Type: ${row.form_type}`);
      console.log(`  - Status: ${row.status}`);
      console.log('');
    });

    // Check what data is in nocVerificationReports table
    console.log('\n=== CHECKING ALL NOC REPORTS ===');
    const allNocReportsQuery = `
      SELECT case_id, "caseId", customer_name, verification_outcome
      FROM "nocVerificationReports"
      LIMIT 10
    `;

    const allNocReports = await pool.query(allNocReportsQuery);
    console.log(`Found ${allNocReports.rows.length} NOC reports in database:`);
    allNocReports.rows.forEach(row => {
      console.log(`  Case ${row.caseId}: ${row.customer_name} - ${row.verification_outcome}`);
    });

    if (nocCases.rows.length > 0) {
      const firstNocCase = nocCases.rows[0];
      console.log(`\n=== DETAILED AUDIT FOR NOC CASE ${firstNocCase.caseId} ===`);

      const nocReportQuery = `
        SELECT
          r.*
        FROM "nocVerificationReports" r
        JOIN cases c ON r.case_id = c.id
        WHERE c."caseId" = '${firstNocCase.caseId}'
        LIMIT 1
      `;

      const nocReport = await pool.query(nocReportQuery);
      if (nocReport.rows.length > 0) {
        const row = nocReport.rows[0];
        console.log(`NOC Case ${firstNocCase.caseId} - ALL DATABASE FIELDS:`);
        Object.keys(row).forEach(key => {
          console.log(`  ${key}: ${row[key]}`);
        });
      } else {
        console.log(`No data found in nocVerificationReports for case ${firstNocCase.caseId}`);
      }
    }

    // Check database schema for NOC reports
    console.log('\n=== NOC DATABASE SCHEMA CHECK ===');

    const nocSchemaQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'nocVerificationReports'
      ORDER BY column_name
    `;

    const nocSchemaResult = await pool.query(nocSchemaQuery);
    console.log('All columns in nocVerificationReports:');
    nocSchemaResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkVerificationTypes();

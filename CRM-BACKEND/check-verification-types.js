const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkVerificationTypes() {
  try {
    // Check OFFICE verification cases
    console.log('\n=== OFFICE VERIFICATION AUDIT ===');

    const officeCasesQuery = `
      SELECT
        "caseId",
        "customerName",
        "verificationOutcome",
        "verificationData"->>'formType' as form_type,
        "status"
      FROM cases
      WHERE "verificationType" = 'OFFICE'
      AND "verificationData" IS NOT NULL
      AND "verificationData"::text != '{}'
      ORDER BY "caseId"
    `;

    const officeCases = await pool.query(officeCasesQuery);
    console.log('OFFICE Cases with Form Submissions:');
    officeCases.rows.forEach(row => {
      console.log(`Case ${row.caseId}: ${row.customerName}`);
      console.log(`  - Outcome: ${row.verificationOutcome}`);
      console.log(`  - Form Type: ${row.form_type}`);
      console.log(`  - Status: ${row.status}`);
      console.log('');
    });

    // Check what data is in officeVerificationReports table
    if (officeCases.rows.length > 0) {
      const firstOfficeCase = officeCases.rows[0];
      console.log(`\n=== DETAILED AUDIT FOR OFFICE CASE ${firstOfficeCase.caseId} ===`);

      const officeReportQuery = `
        SELECT
          r.*
        FROM "officeVerificationReports" r
        JOIN cases c ON r.case_id = c.id
        WHERE c."caseId" = '${firstOfficeCase.caseId}'
        LIMIT 1
      `;

      const officeReport = await pool.query(officeReportQuery);
      if (officeReport.rows.length > 0) {
        const row = officeReport.rows[0];
        console.log(`OFFICE Case ${firstOfficeCase.caseId} - ALL DATABASE FIELDS:`);
        Object.keys(row).forEach(key => {
          console.log(`  ${key}: ${row[key]}`);
        });
      } else {
        console.log(`No data found in officeVerificationReports for case ${firstOfficeCase.caseId}`);
      }
    }

    // Check database schema for office reports
    console.log('\n=== OFFICE DATABASE SCHEMA CHECK ===');

    const officeSchemaQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'officeVerificationReports'
      ORDER BY column_name
    `;

    const officeSchemaResult = await pool.query(officeSchemaQuery);
    console.log('All columns in officeVerificationReports:');
    officeSchemaResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkVerificationTypes();

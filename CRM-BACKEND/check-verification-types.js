const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkVerificationTypes() {
  try {
    // Check PROPERTY_APF verification cases
    console.log('\n=== PROPERTY_APF VERIFICATION AUDIT ===');

    const propertyApfCasesQuery = `
      SELECT
        "caseId",
        "customerName",
        "verificationOutcome",
        "verificationData"->>'formType' as form_type,
        "status"
      FROM cases
      WHERE "verificationType" = 'PROPERTY_APF'
      AND "verificationData" IS NOT NULL
      AND "verificationData"::text != '{}'
      ORDER BY "caseId"
    `;

    const propertyApfCases = await pool.query(propertyApfCasesQuery);
    console.log('PROPERTY_APF Cases with Form Submissions:');
    propertyApfCases.rows.forEach(row => {
      console.log(`Case ${row.caseId}: ${row.customerName}`);
      console.log(`  - Outcome: ${row.verificationOutcome}`);
      console.log(`  - Form Type: ${row.form_type}`);
      console.log(`  - Status: ${row.status}`);
      console.log('');
    });

    // Check what data is in propertyApfVerificationReports table
    if (propertyApfCases.rows.length > 0) {
      const firstPropertyApfCase = propertyApfCases.rows[0];
      console.log(`\n=== DETAILED AUDIT FOR PROPERTY_APF CASE ${firstPropertyApfCase.caseId} ===`);

      const propertyApfReportQuery = `
        SELECT
          r.*
        FROM "propertyApfVerificationReports" r
        JOIN cases c ON r.case_id = c.id
        WHERE c."caseId" = '${firstPropertyApfCase.caseId}'
        LIMIT 1
      `;

      const propertyApfReport = await pool.query(propertyApfReportQuery);
      if (propertyApfReport.rows.length > 0) {
        const row = propertyApfReport.rows[0];
        console.log(`PROPERTY_APF Case ${firstPropertyApfCase.caseId} - ALL DATABASE FIELDS:`);
        Object.keys(row).forEach(key => {
          console.log(`  ${key}: ${row[key]}`);
        });
      } else {
        console.log(`No data found in propertyApfVerificationReports for case ${firstPropertyApfCase.caseId}`);
      }
    }

    // Check database schema for property APF reports
    console.log('\n=== PROPERTY_APF DATABASE SCHEMA CHECK ===');

    const propertyApfSchemaQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'propertyApfVerificationReports'
      ORDER BY column_name
    `;

    const propertyApfSchemaResult = await pool.query(propertyApfSchemaQuery);
    console.log('All columns in propertyApfVerificationReports:');
    propertyApfSchemaResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkVerificationTypes();

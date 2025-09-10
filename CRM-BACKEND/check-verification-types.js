const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkVerificationTypes() {
  try {
    // Check PROPERTY_INDIVIDUAL verification cases
    console.log('\n=== PROPERTY_INDIVIDUAL VERIFICATION AUDIT ===');

    const propertyIndividualCasesQuery = `
      SELECT
        "caseId",
        "customerName",
        "verificationOutcome",
        "verificationData"->>'formType' as form_type,
        "status"
      FROM cases
      WHERE "verificationType" = 'PROPERTY_INDIVIDUAL'
      AND "verificationData" IS NOT NULL
      AND "verificationData"::text != '{}'
      ORDER BY "caseId"
    `;

    const propertyIndividualCases = await pool.query(propertyIndividualCasesQuery);
    console.log('PROPERTY_INDIVIDUAL Cases with Form Submissions:');
    propertyIndividualCases.rows.forEach(row => {
      console.log(`Case ${row.caseId}: ${row.customerName}`);
      console.log(`  - Outcome: ${row.verificationOutcome}`);
      console.log(`  - Form Type: ${row.form_type}`);
      console.log(`  - Status: ${row.status}`);
      console.log('');
    });

    // Check what data is in propertyIndividualVerificationReports table
    console.log('\n=== CHECKING ALL PROPERTY_INDIVIDUAL REPORTS ===');
    const allPropertyIndividualReportsQuery = `
      SELECT case_id, "caseId", customer_name, verification_outcome
      FROM "propertyIndividualVerificationReports"
      LIMIT 10
    `;

    const allPropertyIndividualReports = await pool.query(allPropertyIndividualReportsQuery);
    console.log(`Found ${allPropertyIndividualReports.rows.length} PROPERTY_INDIVIDUAL reports in database:`);
    allPropertyIndividualReports.rows.forEach(row => {
      console.log(`  Case ${row.caseId}: ${row.customer_name} - ${row.verification_outcome}`);
    });

    if (propertyIndividualCases.rows.length > 0) {
      const firstPropertyIndividualCase = propertyIndividualCases.rows[0];
      console.log(`\n=== DETAILED AUDIT FOR PROPERTY_INDIVIDUAL CASE ${firstPropertyIndividualCase.caseId} ===`);

      const propertyIndividualReportQuery = `
        SELECT
          r.*
        FROM "propertyIndividualVerificationReports" r
        JOIN cases c ON r.case_id = c.id
        WHERE c."caseId" = '${firstPropertyIndividualCase.caseId}'
        LIMIT 1
      `;

      const propertyIndividualReport = await pool.query(propertyIndividualReportQuery);
      if (propertyIndividualReport.rows.length > 0) {
        const row = propertyIndividualReport.rows[0];
        console.log(`PROPERTY_INDIVIDUAL Case ${firstPropertyIndividualCase.caseId} - ALL DATABASE FIELDS:`);
        Object.keys(row).forEach(key => {
          console.log(`  ${key}: ${row[key]}`);
        });
      } else {
        console.log(`No data found in propertyIndividualVerificationReports for case ${firstPropertyIndividualCase.caseId}`);
      }
    }

    // Check database schema for property individual reports
    console.log('\n=== PROPERTY_INDIVIDUAL DATABASE SCHEMA CHECK ===');

    const propertyIndividualSchemaQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'propertyIndividualVerificationReports'
      ORDER BY column_name
    `;

    const propertyIndividualSchemaResult = await pool.query(propertyIndividualSchemaQuery);
    console.log('All columns in propertyIndividualVerificationReports:');
    propertyIndividualSchemaResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkVerificationTypes();

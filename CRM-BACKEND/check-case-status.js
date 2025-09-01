const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkCaseStatus() {
  try {
    console.log('Connecting to database...');
    
    // First, let's check the table structure
    console.log('Checking cases table structure...');
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cases'
      ORDER BY ordinal_position;
    `;

    const schemaResult = await pool.query(schemaQuery);
    console.log('\nCases table columns:');
    schemaResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Query for Test Customer Playwright cases
    const query = `
      SELECT *
      FROM cases
      WHERE "customerName" ILIKE '%Test Customer Playwright%'
      ORDER BY "createdAt" DESC
      LIMIT 5;
    `;
    
    const result = await pool.query(query);
    
    console.log('\n=== Test Customer Playwright Cases ===');
    console.log(`Found ${result.rows.length} cases:`);
    
    if (result.rows.length === 0) {
      console.log('No cases found for "Test Customer Playwright"');
    } else {
      result.rows.forEach((row, index) => {
        console.log(`\n--- Case ${index + 1} ---`);
        Object.keys(row).forEach(key => {
          console.log(`${key}: ${row[key]}`);
        });
      });
    }
    
    // Also check recent cases to see if there are any other patterns
    console.log('\n=== Recent Cases (Last 10) ===');
    const recentQuery = `
      SELECT *
      FROM cases
      ORDER BY "createdAt" DESC
      LIMIT 10;
    `;

    const recentResult = await pool.query(recentQuery);
    recentResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. Case ${row.caseId || row.id}: ${row.customerName} - Status: ${row.status} (Created: ${row.createdAt})`);
    });
    
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await pool.end();
  }
}

checkCaseStatus();

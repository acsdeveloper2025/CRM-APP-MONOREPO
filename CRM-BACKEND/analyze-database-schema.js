/**
 * Database Schema Analysis Script
 * 
 * This script analyzes the database schema compatibility with our field mapping
 */

const { Pool } = require('pg');
const { getAvailableDbColumns, getMappedMobileFields, mapFormDataToDatabase } = require('./dist/utils/residenceFormFieldMapping');

// Database connection
const pool = new Pool({
  user: 'acs_user',
  password: 'acs_password',
  host: 'localhost',
  port: 5432,
  database: 'acs_db'
});

async function analyzeSchema() {
  console.log('🔍 Database Schema Analysis for Residence Verification\n');

  try {
    // Get actual database columns
    const dbResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'residenceVerificationReports' 
      AND column_name NOT IN ('id', 'created_at', 'updated_at')
      ORDER BY column_name
    `);
    
    const dbColumns = dbResult.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      default: row.column_default
    }));

    // Get mapped fields from our utility
    const mappedColumns = getAvailableDbColumns();
    const mobileFields = getMappedMobileFields();

    console.log('📊 Schema Comparison:\n');
    console.log(`Database Columns: ${dbColumns.length}`);
    console.log(`Mapped Columns: ${mappedColumns.length}`);
    console.log(`Mobile Fields: ${mobileFields.length}\n`);

    // Find columns that exist in database but not in mapping
    const dbColumnNames = dbColumns.map(col => col.name);
    const unmappedDbColumns = dbColumnNames.filter(col => !mappedColumns.includes(col));
    
    console.log('🔍 Database Columns NOT in Field Mapping:');
    if (unmappedDbColumns.length > 0) {
      unmappedDbColumns.forEach(col => {
        const dbCol = dbColumns.find(c => c.name === col);
        console.log(`   ❌ ${col} (${dbCol.type})`);
      });
    } else {
      console.log('   ✅ All database columns are mapped');
    }
    console.log('');

    // Find mapped columns that don't exist in database
    const missingDbColumns = mappedColumns.filter(col => !dbColumnNames.includes(col));
    
    console.log('🔍 Mapped Columns NOT in Database:');
    if (missingDbColumns.length > 0) {
      missingDbColumns.forEach(col => {
        console.log(`   ❌ ${col}`);
      });
    } else {
      console.log('   ✅ All mapped columns exist in database');
    }
    console.log('');

    // System/metadata columns that are handled separately
    const systemColumns = [
      'case_id', 'caseId', 'form_type', 'verification_outcome', 
      'customer_name', 'customer_phone', 'customer_email', 'full_address',
      'verification_date', 'verification_time', 'verified_by', 
      'total_images', 'total_selfies'
    ];

    console.log('🔧 System/Metadata Columns (handled separately):');
    systemColumns.forEach(col => {
      const exists = dbColumnNames.includes(col);
      console.log(`   ${exists ? '✅' : '❌'} ${col}`);
    });
    console.log('');

    // Test actual field mapping with sample data
    console.log('🧪 Testing Field Mapping with Sample Data:\n');
    
    const sampleFormData = {
      outcome: 'VERIFIED',
      addressLocatable: 'Easy',
      addressRating: 'Excellent',
      houseStatus: 'Opened',
      metPersonName: 'John Doe',
      metPersonRelation: 'Self',
      totalFamilyMembers: 4,
      totalEarning: 50000,
      applicantAge: 34,
      workingStatus: 'Employed',
      companyName: 'ABC Corp',
      stayingPeriod: '5 years',
      locality: 'Urban',
      politicalConnection: 'No',
      dominatedArea: 'No',
      feedbackFromNeighbour: 'NoAdverse',
      otherObservation: 'Test observation',
      finalStatus: 'Positive'
    };

    const mappedData = mapFormDataToDatabase(sampleFormData);
    
    console.log('Sample Form Data Mapping:');
    console.log(`   Input fields: ${Object.keys(sampleFormData).length}`);
    console.log(`   Mapped fields: ${Object.keys(mappedData).length}`);
    
    // Check if all mapped fields exist in database
    const mappedFieldNames = Object.keys(mappedData);
    const invalidFields = mappedFieldNames.filter(field => !dbColumnNames.includes(field));
    
    if (invalidFields.length > 0) {
      console.log(`   ❌ Invalid fields: ${invalidFields.join(', ')}`);
    } else {
      console.log(`   ✅ All mapped fields are valid database columns`);
    }
    console.log('');

    // Generate comprehensive INSERT statement
    console.log('📝 Sample INSERT Statement Generation:\n');
    
    const allSystemData = {
      case_id: 'test-case-id',
      caseId: 12345,
      form_type: 'POSITIVE',
      verification_outcome: 'Positive & Door Locked',
      customer_name: 'Test Customer',
      customer_phone: '+1234567890',
      customer_email: null,
      full_address: 'Test Address',
      verification_date: '2025-09-04',
      verification_time: '10:30:00',
      verified_by: 'test-user-id',
      total_images: 5,
      total_selfies: 1,
      remarks: 'Test verification',
      ...mappedData
    };

    const insertColumns = Object.keys(allSystemData);
    const validInsertColumns = insertColumns.filter(col => dbColumnNames.includes(col));
    const invalidInsertColumns = insertColumns.filter(col => !dbColumnNames.includes(col));

    console.log(`Total fields for INSERT: ${insertColumns.length}`);
    console.log(`Valid database columns: ${validInsertColumns.length}`);
    
    if (invalidInsertColumns.length > 0) {
      console.log(`❌ Invalid columns: ${invalidInsertColumns.join(', ')}`);
    } else {
      console.log(`✅ All INSERT columns are valid`);
    }

    // Check data type compatibility
    console.log('\n🔍 Data Type Compatibility Check:\n');
    
    const typeIssues = [];
    
    Object.entries(mappedData).forEach(([field, value]) => {
      const dbCol = dbColumns.find(col => col.name === field);
      if (dbCol) {
        const valueType = typeof value;
        const dbType = dbCol.type;
        
        // Check for potential type mismatches
        if (valueType === 'string' && dbType === 'integer') {
          typeIssues.push(`${field}: string value "${value}" for integer column`);
        } else if (valueType === 'number' && dbType.includes('character')) {
          typeIssues.push(`${field}: number value ${value} for text column`);
        }
      }
    });

    if (typeIssues.length > 0) {
      console.log('⚠️ Potential Type Issues:');
      typeIssues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('✅ No obvious type compatibility issues detected');
    }

    // Summary
    console.log('\n📋 Summary:\n');
    console.log(`✅ Database has ${dbColumns.length} columns`);
    console.log(`✅ Field mapping covers ${mappedColumns.length} columns`);
    console.log(`✅ Can insert up to ${validInsertColumns.length} fields per record`);
    console.log(`✅ Schema compatibility: ${invalidInsertColumns.length === 0 ? 'PERFECT' : 'ISSUES FOUND'}`);
    
    if (missingDbColumns.length === 0 && invalidInsertColumns.length === 0) {
      console.log('\n🎉 Database schema is fully compatible with field mapping!');
    } else {
      console.log('\n⚠️ Schema optimization needed for full compatibility');
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run analysis
analyzeSchema().catch(console.error);

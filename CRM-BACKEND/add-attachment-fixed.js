const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addAttachment() {
  try {
    console.log('Adding attachment to case 33...');
    
    const result = await pool.query(`
      INSERT INTO attachments (
        filename,
        "originalName",
        "mimeType",
        "fileSize",
        "filePath",
        "uploadedBy",
        "caseId",
        case_id,
        "createdAt"
      ) VALUES (
        'test-attachment.png',
        'test-attachment.png',
        'image/png',
        70,
        '/uploads/attachments/case_33/test-attachment.png',
        (SELECT id FROM users WHERE username = 'admin' LIMIT 1),
        33,
        '62cb776f-db6f-4e43-a5a9-04aaad802be4',
        NOW()
      ) RETURNING *;
    `);
    
    console.log('Attachment added successfully:', result.rows[0]);
    
    // Verify the attachment was added
    const verify = await pool.query(`
      SELECT * FROM attachments WHERE "caseId" = 33;
    `);
    
    console.log('All attachments for case 33:', verify.rows);
    
  } catch (error) {
    console.error('Error adding attachment:', error);
  } finally {
    await pool.end();
  }
}

addAttachment();

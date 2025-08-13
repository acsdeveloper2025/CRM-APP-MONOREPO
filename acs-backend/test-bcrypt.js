const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function updateAllUsers() {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://acs_user:acs_password@localhost:5432/acs_db'
    });

    // Generate hashes for all users
    const adminHash = await bcrypt.hash('admin123', 12);
    const fieldHash = await bcrypt.hash('field123', 12);
    const backendHash = await bcrypt.hash('backend123', 12);

    console.log('Generated hashes:');
    console.log('Admin hash:', adminHash);
    console.log('Field hash:', fieldHash);
    console.log('Backend hash:', backendHash);

    // Update all users
    await pool.query(
      'UPDATE users SET "passwordHash" = $1 WHERE username = $2',
      [adminHash, 'admin']
    );

    await pool.query(
      'UPDATE users SET "passwordHash" = $1 WHERE username = $2',
      [fieldHash, 'field001']
    );

    await pool.query(
      'UPDATE users SET "passwordHash" = $1 WHERE username = $2',
      [backendHash, 'backend001']
    );

    console.log('Updated all users with new hashes');

    // Test all logins
    const users = [
      { username: 'admin', password: 'admin123' },
      { username: 'field001', password: 'field123' },
      { username: 'backend001', password: 'backend123' }
    ];

    for (const testUser of users) {
      const userRes = await pool.query(
        'SELECT username, "passwordHash" FROM users WHERE username = $1',
        [testUser.username]
      );

      if (userRes.rows.length > 0) {
        const user = userRes.rows[0];
        const loginTest = await bcrypt.compare(testUser.password, user.passwordHash);
        console.log(`${testUser.username} login test:`, loginTest);
      }
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

updateAllUsers();

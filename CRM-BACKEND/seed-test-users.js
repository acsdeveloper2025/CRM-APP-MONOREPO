const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://acs_user:acs_password@localhost:5432/acs_db',
});

const TEST_USERS = {
  admin: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Test Admin',
    username: 'testadmin',
    email: 'admin@test.com',
    role: 'ADMIN',
    password: 'password123'
  },
  fieldAgent: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Test Field Agent',
    username: 'testagent',
    email: 'agent@test.com',
    role: 'FIELD_AGENT',
    password: 'password123'
  },
  manager: {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Test Manager',
    username: 'testmanager',
    email: 'manager@test.com',
    role: 'MANAGER',
    password: 'password123'
  }
};

async function seedTestUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding test users...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Insert test users
    await client.query(`
      INSERT INTO users (id, name, username, email, password, "passwordHash", role, "roleId", "departmentId", "designationId", "employeeId", "isActive") VALUES
      ($1, $2, $3, $4, $5, $6, $7, 1, 1, 1, 'EMP001', true),
      ($8, $9, $10, $11, $12, $13, $14, 3, 2, 3, 'EMP002', true),
      ($15, $16, $17, $18, $19, $20, $21, 2, 1, 2, 'EMP003', true)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        "passwordHash" = EXCLUDED."passwordHash",
        role = EXCLUDED.role,
        "isActive" = true
    `, [
      TEST_USERS.admin.id, TEST_USERS.admin.name, TEST_USERS.admin.username,
      TEST_USERS.admin.email, TEST_USERS.admin.password, hashedPassword, TEST_USERS.admin.role,
      TEST_USERS.fieldAgent.id, TEST_USERS.fieldAgent.name, TEST_USERS.fieldAgent.username,
      TEST_USERS.fieldAgent.email, TEST_USERS.fieldAgent.password, hashedPassword, TEST_USERS.fieldAgent.role,
      TEST_USERS.manager.id, TEST_USERS.manager.name, TEST_USERS.manager.username,
      TEST_USERS.manager.email, TEST_USERS.manager.password, hashedPassword, TEST_USERS.manager.role
    ]);
    
    console.log('✅ Test users created successfully!');
    console.log('📋 Available test credentials:');
    console.log('   Admin: testadmin / password123');
    console.log('   Field Agent: testagent / password123');
    console.log('   Manager: testmanager / password123');
    
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestUsers().catch(console.error);

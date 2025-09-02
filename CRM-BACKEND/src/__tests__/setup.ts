import { Pool } from 'pg';
import { runMigrations } from '../migrations/migrate';
import bcrypt from 'bcrypt';

// Test database configuration
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/crm_test';

export const testPool = new Pool({
  connectionString: TEST_DATABASE_URL,
  max: 5, // Limit connections for testing
});

// Test data constants
export const TEST_USERS = {
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

export const TEST_CLIENTS = {
  client1: {
    id: 1,
    name: 'Test Bank Ltd',
    code: 'TBL001'
  },
  client2: {
    id: 2,
    name: 'Another Financial Corp',
    code: 'AFC002'
  }
};

// Test case data removed - use empty object for tests
export const TEST_CASES = {};

// Global setup - runs once before all tests
beforeAll(async () => {
  try {
    console.log('Setting up test database...');
    
    // Run migrations on test database
    await runMigrations();
    
    // Seed test data
    await seedTestData();
    
    console.log('Test database setup completed');
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
});

// Global teardown - runs once after all tests
afterAll(async () => {
  try {
    console.log('Cleaning up test database...');
    await cleanupTestDatabase();
    await testPool.end();
    console.log('Test database cleanup completed');
  } catch (error) {
    console.error('Test cleanup failed:', error);
  }
});

// Clean up data between test suites
beforeEach(async () => {
  // Clean up transactional data but keep master data
  await cleanupTransactionalData();
});

/**
 * Seed test data into the database
 */
async function seedTestData(): Promise<void> {
  const client = await testPool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert test countries
    await client.query(`
      INSERT INTO countries (id, name, code) VALUES 
      (1, 'India', 'IN')
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Insert test states
    await client.query(`
      INSERT INTO states (id, name, code, "countryId") VALUES 
      (1, 'Maharashtra', 'MH', 1),
      (2, 'Karnataka', 'KA', 1)
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Insert test cities
    await client.query(`
      INSERT INTO cities (id, name, "stateId", "countryId") VALUES 
      (1, 'Mumbai', 1, 1),
      (2, 'Pune', 1, 1),
      (3, 'Bangalore', 2, 1)
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Insert test pincodes
    await client.query(`
      INSERT INTO pincodes (id, code, "cityId") VALUES 
      (1, '400001', 1),
      (2, '411001', 2),
      (3, '560001', 3)
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Insert test roles
    await client.query(`
      INSERT INTO roles (id, name, description, permissions) VALUES 
      (1, 'ADMIN', 'System Administrator', '["all"]'),
      (2, 'MANAGER', 'Manager', '["read", "write", "manage_users"]'),
      (3, 'FIELD_AGENT', 'Field Agent', '["read", "write_cases"]')
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Insert test departments
    await client.query(`
      INSERT INTO departments (id, name, description) VALUES 
      (1, 'Operations', 'Operations Department'),
      (2, 'Field Services', 'Field Services Department')
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Insert test designations
    await client.query(`
      INSERT INTO designations (id, name, description) VALUES 
      (1, 'Administrator', 'System Administrator'),
      (2, 'Manager', 'Department Manager'),
      (3, 'Field Agent', 'Field Verification Agent')
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Insert test users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    await client.query(`
      INSERT INTO users (id, name, username, email, "passwordHash", role, "roleId", "departmentId", "designationId", "employeeId", "isActive") VALUES 
      ($1, $2, $3, $4, $5, $6, 1, 1, 1, 'EMP001', true),
      ($7, $8, $9, $10, $11, $12, 3, 2, 3, 'EMP002', true),
      ($13, $14, $15, $16, $17, $18, 2, 1, 2, 'EMP003', true)
      ON CONFLICT (id) DO NOTHING
    `, [
      TEST_USERS.admin.id, TEST_USERS.admin.name, TEST_USERS.admin.username, 
      TEST_USERS.admin.email, hashedPassword, TEST_USERS.admin.role,
      TEST_USERS.fieldAgent.id, TEST_USERS.fieldAgent.name, TEST_USERS.fieldAgent.username,
      TEST_USERS.fieldAgent.email, hashedPassword, TEST_USERS.fieldAgent.role,
      TEST_USERS.manager.id, TEST_USERS.manager.name, TEST_USERS.manager.username,
      TEST_USERS.manager.email, hashedPassword, TEST_USERS.manager.role
    ]);
    
    // Insert test clients
    await client.query(`
      INSERT INTO clients (id, name, code) VALUES 
      ($1, $2, $3),
      ($4, $5, $6)
      ON CONFLICT (id) DO NOTHING
    `, [
      TEST_CLIENTS.client1.id, TEST_CLIENTS.client1.name, TEST_CLIENTS.client1.code,
      TEST_CLIENTS.client2.id, TEST_CLIENTS.client2.name, TEST_CLIENTS.client2.code
    ]);
    
    // Insert test verification types
    await client.query(`
      INSERT INTO "verificationTypes" (id, name, code, description) VALUES 
      (1, 'Residence Verification', 'RV', 'Residence verification service'),
      (2, 'Office Verification', 'OV', 'Office verification service'),
      (3, 'Business Verification', 'BV', 'Business verification service')
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Insert test products
    await client.query(`
      INSERT INTO products (id, name, code, "clientId") VALUES 
      (1, 'Personal Loan', 'PL', 1),
      (2, 'Home Loan', 'HL', 1),
      (3, 'Business Loan', 'BL', 2)
      ON CONFLICT (id) DO NOTHING
    `);
    
    await client.query('COMMIT');
    console.log('Test data seeded successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to seed test data:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Clean up transactional data between tests
 */
async function cleanupTransactionalData(): Promise<void> {
  const client = await testPool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clean up in reverse dependency order
    await client.query('DELETE FROM "auditLogs"');
    await client.query('DELETE FROM attachments');
    await client.query('DELETE FROM cases');
    await client.query('DELETE FROM performance_metrics');
    await client.query('DELETE FROM query_performance');
    await client.query('DELETE FROM error_logs');
    await client.query('DELETE FROM system_health_metrics');
    
    // Reset sequences
    await client.query('ALTER SEQUENCE cases_"caseId"_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE attachments_id_seq RESTART WITH 1');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to cleanup transactional data:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Complete database cleanup
 */
async function cleanupTestDatabase(): Promise<void> {
  const client = await testPool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Drop all tables in reverse dependency order
    const tables = [
      'performance_metrics',
      'query_performance', 
      'error_logs',
      'system_health_metrics',
      'auditLogs',
      'attachments',
      'cases',
      'userAreaAssignments',
      'userPincodeAssignments',
      'pincodeAreas',
      'clientProducts',
      'productVerificationTypes',
      'products',
      'verificationTypes',
      'clients',
      'users',
      'designations',
      'departments',
      'roles',
      'areas',
      'pincodes',
      'cities',
      'states',
      'countries'
    ];
    
    for (const table of tables) {
      await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
    
    await client.query('COMMIT');
    console.log('Test database cleaned up successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to cleanup test database:', error);
  } finally {
    client.release();
  }
}

/**
 * Helper function to create test case
 */
export async function createTestCase(caseData: Partial<typeof TEST_CASES.case1> = {}): Promise<any> {
  const testCase = { ...TEST_CASES.case1, ...caseData };
  
  const result = await testPool.query(`
    INSERT INTO cases ("caseId", "customerName", "customerPhone", address, "clientId", "assignedTo", status, priority)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [
    testCase.caseId,
    testCase.customerName,
    testCase.customerPhone,
    testCase.address,
    testCase.clientId,
    testCase.assignedTo,
    testCase.status,
    testCase.priority
  ]);
  
  return result.rows[0];
}

/**
 * Helper function to authenticate test user
 */
export function getTestAuthHeader(userType: keyof typeof TEST_USERS = 'admin'): string {
  // In real tests, you would generate a proper JWT token
  // For now, return a mock token that your auth middleware can recognize
  const user = TEST_USERS[userType];
  return `Bearer test-token-${user.id}`;
}

/**
 * Helper function to wait for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export test pool for use in tests
export { testPool as db };

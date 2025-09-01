import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';

/**
 * Global Setup for Playwright Tests
 * Prepares the test environment before running any tests
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3001';
  const apiURL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000';

  try {
    // 1. Create test directories
    await createTestDirectories();

    // 2. Generate test fixtures
    await generateTestFixtures();

    // 3. Setup test database
    await setupTestDatabase(apiURL);

    // 4. Create test users
    await createTestUsers(apiURL);

    // 5. Verify application is running
    await verifyApplicationHealth(baseURL, apiURL);

    // 6. Setup authentication state
    await setupAuthenticationState(baseURL);

    console.log('✅ Global test setup completed successfully');

  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
}

/**
 * Create necessary test directories
 */
async function createTestDirectories() {
  const directories = [
    'test-results',
    'test-results/screenshots',
    'test-results/videos',
    'test-results/traces',
    'test-results/downloads',
    'test-results/html-report',
    'test-results/allure-results',
    'tests/fixtures/generated',
    'tests/auth'
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }
}

/**
 * Generate test fixtures (images, documents, etc.)
 */
async function generateTestFixtures() {
  console.log('📄 Generating test fixtures...');

  // Generate test image (1x1 pixel PNG)
  const testImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==',
    'base64'
  );

  // Generate test PDF (minimal PDF structure)
  const testPDFBuffer = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF',
    'utf8'
  );

  // Save test files
  await fs.writeFile('tests/fixtures/test-image.jpg', testImageBuffer);
  await fs.writeFile('tests/fixtures/test-document.pdf', testPDFBuffer);
  
  // Create a larger test file for upload testing
  const largeFileBuffer = Buffer.alloc(5 * 1024 * 1024, 'A'); // 5MB file
  await fs.writeFile('tests/fixtures/large-test-file.pdf', largeFileBuffer);

  console.log('✅ Test fixtures generated');
}

/**
 * Setup test database with required tables and data
 */
async function setupTestDatabase(apiURL: string) {
  console.log('🗄️ Setting up test database...');

  try {
    // Initialize test database
    const response = await fetch(`${apiURL}/api/test/database/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Database setup failed: ${response.statusText}`);
    }

    console.log('✅ Test database setup completed');
  } catch (error) {
    console.warn('⚠️ Database setup failed, continuing with existing data:', error);
  }
}

/**
 * Create test users for different roles
 */
async function createTestUsers(apiURL: string) {
  console.log('👥 Creating test users...');

  const testUsers = [
    {
      email: 'field_agent_test@example.com',
      password: 'TestPassword123!',
      role: 'FIELD_AGENT',
      name: 'Test Field Agent',
      employeeId: 'FA001'
    },
    {
      email: 'backend_user_test@example.com',
      password: 'TestPassword123!',
      role: 'BACKEND_USER',
      name: 'Test Backend User',
      employeeId: 'BU001'
    },
    {
      email: 'manager_test@example.com',
      password: 'TestPassword123!',
      role: 'MANAGER',
      name: 'Test Manager',
      employeeId: 'MG001'
    },
    {
      email: 'admin_test@example.com',
      password: 'TestPassword123!',
      role: 'ADMIN',
      name: 'Test Admin',
      employeeId: 'AD001'
    }
  ];

  for (const user of testUsers) {
    try {
      const response = await fetch(`${apiURL}/api/test/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
      });

      if (response.ok) {
        console.log(`✅ Created test user: ${user.email}`);
      } else {
        console.log(`ℹ️ Test user already exists: ${user.email}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to create user ${user.email}:`, error);
    }
  }
}

/**
 * Verify that both frontend and backend applications are running
 */
async function verifyApplicationHealth(baseURL: string, apiURL: string) {
  console.log('🏥 Verifying application health...');

  // Check frontend
  try {
    const frontendResponse = await fetch(baseURL);
    if (!frontendResponse.ok) {
      throw new Error(`Frontend not accessible: ${frontendResponse.status}`);
    }
    console.log('✅ Frontend is accessible');
  } catch (error) {
    throw new Error(`Frontend health check failed: ${error}`);
  }

  // Check backend API
  try {
    const backendResponse = await fetch(`${apiURL}/api/health`);
    if (!backendResponse.ok) {
      throw new Error(`Backend API not accessible: ${backendResponse.status}`);
    }
    console.log('✅ Backend API is accessible');
  } catch (error) {
    throw new Error(`Backend health check failed: ${error}`);
  }

  // Wait for applications to be fully ready
  await new Promise(resolve => setTimeout(resolve, 5000));
}

/**
 * Setup authentication state for different user roles
 */
async function setupAuthenticationState(baseURL: string) {
  console.log('🔐 Setting up authentication states...');

  const browser = await chromium.launch();
  
  const userRoles = [
    { email: 'field_agent_test@example.com', password: 'TestPassword123!', role: 'field-agent' },
    { email: 'backend_user_test@example.com', password: 'TestPassword123!', role: 'backend-user' },
    { email: 'manager_test@example.com', password: 'TestPassword123!', role: 'manager' },
    { email: 'admin_test@example.com', password: 'TestPassword123!', role: 'admin' }
  ];

  for (const user of userRoles) {
    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Navigate to login page
      await page.goto(`${baseURL}/login`);
      await page.waitForLoadState('networkidle');

      // Fill login form
      await page.fill('[data-testid="email-input"]', user.email);
      await page.fill('[data-testid="password-input"]', user.password);
      await page.click('[data-testid="login-button"]');

      // Wait for successful login
      await page.waitForURL('**/dashboard', { timeout: 30000 });

      // Save authentication state
      await context.storageState({ 
        path: `tests/auth/${user.role}-auth.json` 
      });

      console.log(`✅ Saved auth state for: ${user.role}`);

      await context.close();
    } catch (error) {
      console.warn(`⚠️ Failed to setup auth for ${user.role}:`, error);
    }
  }

  await browser.close();
}

export default globalSetup;

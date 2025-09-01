import { test, expect, Page, BrowserContext } from '@playwright/test';
import { faker } from '@faker-js/faker';
import path from 'path';

// Test data interfaces
interface TestCase {
  id: string;
  caseNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  propertyAddress: string;
  formType: 'RESIDENCE' | 'OFFICE' | 'BUSINESS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedAgent: string;
}

interface TestUser {
  email: string;
  password: string;
  role: string;
  name: string;
}

// Test configuration
const TEST_CONFIG = {
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
  apiURL: process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000',
  timeout: 30000,
  screenshots: true
};

// Test users
const FIELD_AGENT: TestUser = {
  email: 'field_agent_test@example.com',
  password: 'TestPassword123!',
  role: 'FIELD_AGENT',
  name: 'Test Field Agent'
};

const BACKEND_USER: TestUser = {
  email: 'backend_user_test@example.com',
  password: 'TestPassword123!',
  role: 'BACKEND_USER',
  name: 'Test Backend User'
};

// Generate test case data
const generateTestCase = (): TestCase => ({
  id: faker.string.uuid(),
  caseNumber: `CASE-${faker.number.int({ min: 10000, max: 99999 })}`,
  customerName: faker.person.fullName(),
  customerEmail: faker.internet.email(),
  customerPhone: faker.phone.number(),
  propertyAddress: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
  formType: faker.helpers.arrayElement(['RESIDENCE', 'OFFICE', 'BUSINESS']),
  priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']),
  assignedAgent: FIELD_AGENT.email
});

// Database helper functions
class DatabaseHelper {
  static async createTestCase(testCase: TestCase): Promise<void> {
    const response = await fetch(`${TEST_CONFIG.apiURL}/api/test/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        caseNumber: testCase.caseNumber,
        customerName: testCase.customerName,
        customerEmail: testCase.customerEmail,
        customerPhone: testCase.customerPhone,
        propertyAddress: testCase.propertyAddress,
        formType: testCase.formType,
        priority: testCase.priority,
        assignedAgent: testCase.assignedAgent,
        status: 'ASSIGNED',
        createdAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create test case: ${response.statusText}`);
    }
  }

  static async cleanupTestCase(caseNumber: string): Promise<void> {
    await fetch(`${TEST_CONFIG.apiURL}/api/test/cases/${caseNumber}`, {
      method: 'DELETE'
    });
  }

  static async ensureTestUsers(): Promise<void> {
    // Ensure field agent exists
    await fetch(`${TEST_CONFIG.apiURL}/api/test/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(FIELD_AGENT)
    });

    // Ensure backend user exists
    await fetch(`${TEST_CONFIG.apiURL}/api/test/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(BACKEND_USER)
    });
  }
}

// Page Object Models
class LoginPage {
  constructor(private page: Page) {}

  async login(user: TestUser): Promise<void> {
    await this.page.goto(`${TEST_CONFIG.baseURL}/login`);
    await this.page.waitForLoadState('networkidle');

    // Fill login form
    await this.page.fill('[data-testid="email-input"]', user.email);
    await this.page.fill('[data-testid="password-input"]', user.password);
    
    // Take screenshot before login
    if (TEST_CONFIG.screenshots) {
      await this.page.screenshot({ 
        path: `test-results/login-form-${user.role.toLowerCase()}.png`,
        fullPage: true 
      });
    }

    // Submit login
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for successful login
    await this.page.waitForURL('**/dashboard', { timeout: TEST_CONFIG.timeout });
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible();
  }
}

class CasesPage {
  constructor(private page: Page) {}

  async navigateToAssignedCases(): Promise<void> {
    await this.page.click('[data-testid="nav-cases"]');
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.locator('[data-testid="cases-page"]')).toBeVisible();
  }

  async acceptCase(caseNumber: string): Promise<void> {
    // Find the case in the list
    const caseRow = this.page.locator(`[data-testid="case-row-${caseNumber}"]`);
    await expect(caseRow).toBeVisible();

    // Click accept button
    await caseRow.locator('[data-testid="accept-case-button"]').click();
    
    // Confirm acceptance in modal
    await this.page.click('[data-testid="confirm-accept-button"]');
    
    // Wait for success message
    await expect(this.page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Verify case status changed
    await expect(caseRow.locator('[data-testid="case-status"]')).toHaveText('ACCEPTED');
  }

  async startCase(caseNumber: string): Promise<void> {
    const caseRow = this.page.locator(`[data-testid="case-row-${caseNumber}"]`);
    
    // Click start case button
    await caseRow.locator('[data-testid="start-case-button"]').click();
    
    // Wait for status update
    await expect(caseRow.locator('[data-testid="case-status"]')).toHaveText('IN_PROGRESS');
  }

  async openCaseForm(caseNumber: string): Promise<void> {
    const caseRow = this.page.locator(`[data-testid="case-row-${caseNumber}"]`);
    await caseRow.locator('[data-testid="open-form-button"]').click();
    
    // Wait for form page to load
    await this.page.waitForURL('**/cases/*/form', { timeout: TEST_CONFIG.timeout });
    await expect(this.page.locator('[data-testid="case-form"]')).toBeVisible();
  }
}

class CaseFormPage {
  constructor(private page: Page) {}

  async fillCustomerInformation(testCase: TestCase): Promise<void> {
    // Customer details section
    await this.page.fill('[data-testid="customer-name"]', testCase.customerName);
    await this.page.fill('[data-testid="customer-email"]', testCase.customerEmail);
    await this.page.fill('[data-testid="customer-phone"]', testCase.customerPhone);
    
    // Property address
    await this.page.fill('[data-testid="property-address"]', testCase.propertyAddress);
    
    // Form type selection
    await this.page.selectOption('[data-testid="form-type-select"]', testCase.formType);
    
    // Take screenshot of filled form
    if (TEST_CONFIG.screenshots) {
      await this.page.screenshot({ 
        path: 'test-results/customer-information-filled.png',
        fullPage: true 
      });
    }
  }

  async fillPropertyDetails(): Promise<void> {
    // Property type
    await this.page.selectOption('[data-testid="property-type"]', 'APARTMENT');
    
    // Property size
    await this.page.fill('[data-testid="property-size"]', '1200');
    
    // Number of rooms
    await this.page.fill('[data-testid="room-count"]', '3');
    
    // Property condition
    await this.page.selectOption('[data-testid="property-condition"]', 'GOOD');
    
    // Additional notes
    await this.page.fill('[data-testid="property-notes"]', 
      'Test property details filled by automated test. Property is in good condition with modern amenities.');
  }

  async uploadDocuments(): Promise<void> {
    // Create test files for upload
    const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
    const testDocPath = path.join(__dirname, '../fixtures/test-document.pdf');
    
    // Upload property images
    const imageUpload = this.page.locator('[data-testid="image-upload"]');
    await imageUpload.setInputFiles([testImagePath]);
    
    // Wait for upload to complete
    await expect(this.page.locator('[data-testid="uploaded-image"]')).toBeVisible();
    
    // Upload documents
    const docUpload = this.page.locator('[data-testid="document-upload"]');
    await docUpload.setInputFiles([testDocPath]);
    
    // Wait for document upload
    await expect(this.page.locator('[data-testid="uploaded-document"]')).toBeVisible();
    
    // Take screenshot of uploads
    if (TEST_CONFIG.screenshots) {
      await this.page.screenshot({ 
        path: 'test-results/documents-uploaded.png',
        fullPage: true 
      });
    }
  }

  async completeValidationChecklist(): Promise<void> {
    // Check all validation items
    const checklistItems = [
      'identity-verified',
      'documents-complete',
      'property-inspected',
      'photos-taken',
      'customer-signature'
    ];

    for (const item of checklistItems) {
      await this.page.check(`[data-testid="checklist-${item}"]`);
    }

    // Add validation notes
    await this.page.fill('[data-testid="validation-notes"]', 
      'All validation steps completed successfully. Customer identity verified, documents are complete and authentic, property inspection completed with photos taken.');
  }

  async submitCase(): Promise<void> {
    // Scroll to submit button
    await this.page.locator('[data-testid="submit-case-button"]').scrollIntoViewIfNeeded();
    
    // Take screenshot before submission
    if (TEST_CONFIG.screenshots) {
      await this.page.screenshot({ 
        path: 'test-results/form-before-submission.png',
        fullPage: true 
      });
    }

    // Click submit
    await this.page.click('[data-testid="submit-case-button"]');
    
    // Confirm submission in modal
    await this.page.click('[data-testid="confirm-submit-button"]');
    
    // Wait for success message
    await expect(this.page.locator('[data-testid="submission-success"]')).toBeVisible();
    
    // Verify redirect to cases list
    await this.page.waitForURL('**/cases', { timeout: TEST_CONFIG.timeout });
  }
}

class BackendDashboard {
  constructor(private page: Page) {}

  async navigateToPendingCases(): Promise<void> {
    await this.page.click('[data-testid="nav-pending-cases"]');
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.locator('[data-testid="pending-cases-page"]')).toBeVisible();
  }

  async verifyCaseInQueue(caseNumber: string): Promise<void> {
    // Search for the case
    await this.page.fill('[data-testid="case-search"]', caseNumber);
    await this.page.press('[data-testid="case-search"]', 'Enter');
    
    // Verify case appears in results
    const caseRow = this.page.locator(`[data-testid="pending-case-${caseNumber}"]`);
    await expect(caseRow).toBeVisible();
    
    // Verify case status
    await expect(caseRow.locator('[data-testid="case-status"]')).toHaveText('SUBMITTED');
    
    // Take screenshot of pending case
    if (TEST_CONFIG.screenshots) {
      await this.page.screenshot({ 
        path: 'test-results/case-in-pending-queue.png',
        fullPage: true 
      });
    }
  }

  async reviewCase(caseNumber: string): Promise<void> {
    const caseRow = this.page.locator(`[data-testid="pending-case-${caseNumber}"]`);
    
    // Click review button
    await caseRow.locator('[data-testid="review-case-button"]').click();
    
    // Wait for case review page
    await this.page.waitForURL('**/cases/*/review', { timeout: TEST_CONFIG.timeout });
    await expect(this.page.locator('[data-testid="case-review-page"]')).toBeVisible();
    
    // Verify all form data is present
    await expect(this.page.locator('[data-testid="customer-info"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="property-details"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="uploaded-files"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="validation-checklist"]')).toBeVisible();
  }

  async validateCase(caseNumber: string): Promise<void> {
    // Add review comments
    await this.page.fill('[data-testid="review-comments"]', 
      'Case reviewed and validated. All documentation is complete and accurate. Approved for processing.');
    
    // Select validation status
    await this.page.selectOption('[data-testid="validation-status"]', 'VALID');
    
    // Submit validation
    await this.page.click('[data-testid="submit-validation-button"]');
    
    // Confirm validation
    await this.page.click('[data-testid="confirm-validation-button"]');
    
    // Wait for success message
    await expect(this.page.locator('[data-testid="validation-success"]')).toBeVisible();
    
    // Take final screenshot
    if (TEST_CONFIG.screenshots) {
      await this.page.screenshot({ 
        path: 'test-results/case-validated.png',
        fullPage: true 
      });
    }
  }
}

// Mobile-specific page objects
class MobileCasesPage {
  constructor(private page: Page) {}

  async navigateToMobileApp(): Promise<void> {
    await this.page.goto(`${TEST_CONFIG.baseURL}/mobile`);
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.locator('[data-testid="mobile-app"]')).toBeVisible();
  }

  async openCasesTab(): Promise<void> {
    await this.page.click('[data-testid="nav-submissions"]');
    await expect(this.page.locator('[data-testid="mobile-cases-list"]')).toBeVisible();
  }

  async acceptCaseOnMobile(caseNumber: string): Promise<void> {
    const caseCard = this.page.locator(`[data-testid="mobile-case-${caseNumber}"]`);
    await expect(caseCard).toBeVisible();
    
    // Swipe or click to accept
    await caseCard.locator('[data-testid="mobile-accept-button"]').click();
    
    // Confirm on mobile
    await this.page.click('[data-testid="mobile-confirm-accept"]');
    
    // Verify status update
    await expect(caseCard.locator('[data-testid="mobile-case-status"]')).toHaveText('ACCEPTED');
  }
}

// Main test suite
test.describe('Complete Case Workflow E2E Tests', () => {
  let testCase: TestCase;
  let fieldAgentContext: BrowserContext;
  let backendUserContext: BrowserContext;
  let fieldAgentPage: Page;
  let backendUserPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Generate test case data
    testCase = generateTestCase();

    // Ensure test users exist
    await DatabaseHelper.ensureTestUsers();

    // Create test case in database
    await DatabaseHelper.createTestCase(testCase);

    // Create browser contexts for different users
    fieldAgentContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    backendUserContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    fieldAgentPage = await fieldAgentContext.newPage();
    backendUserPage = await backendUserContext.newPage();
  });

  test.afterAll(async () => {
    // Cleanup test data
    await DatabaseHelper.cleanupTestCase(testCase.caseNumber);

    // Close browser contexts
    await fieldAgentContext.close();
    await backendUserContext.close();
  });

  test('Complete Case Workflow - Desktop Version', async () => {
    // Step 1: Field Agent Login
    test.step('Field Agent Login', async () => {
      const loginPage = new LoginPage(fieldAgentPage);
      await loginPage.login(FIELD_AGENT);

      // Verify dashboard loads
      await expect(fieldAgentPage.locator('[data-testid="dashboard-title"]')).toBeVisible();
      await expect(fieldAgentPage.locator('[data-testid="welcome-message"]')).toContainText(FIELD_AGENT.name);
    });

    // Step 2: Navigate to Cases and Accept Case
    test.step('Accept Assigned Case', async () => {
      const casesPage = new CasesPage(fieldAgentPage);
      await casesPage.navigateToAssignedCases();
      await casesPage.acceptCase(testCase.caseNumber);

      // Take screenshot after acceptance
      await fieldAgentPage.screenshot({
        path: 'test-results/case-accepted.png',
        fullPage: true
      });
    });

    // Step 3: Start Case Progress
    test.step('Start Case Progress', async () => {
      const casesPage = new CasesPage(fieldAgentPage);
      await casesPage.startCase(testCase.caseNumber);

      // Verify case status in UI
      const caseRow = fieldAgentPage.locator(`[data-testid="case-row-${testCase.caseNumber}"]`);
      await expect(caseRow.locator('[data-testid="case-status"]')).toHaveText('IN_PROGRESS');
    });

    // Step 4: Open and Fill Case Form
    test.step('Complete Case Form', async () => {
      const casesPage = new CasesPage(fieldAgentPage);
      const formPage = new CaseFormPage(fieldAgentPage);

      // Open case form
      await casesPage.openCaseForm(testCase.caseNumber);

      // Fill all form sections
      await formPage.fillCustomerInformation(testCase);
      await formPage.fillPropertyDetails();
      await formPage.uploadDocuments();
      await formPage.completeValidationChecklist();

      // Submit the case
      await formPage.submitCase();
    });

    // Step 5: Verify Case Submission
    test.step('Verify Case Submission Status', async () => {
      // Navigate back to cases list
      const casesPage = new CasesPage(fieldAgentPage);
      await casesPage.navigateToAssignedCases();

      // Verify case status updated to SUBMITTED
      const caseRow = fieldAgentPage.locator(`[data-testid="case-row-${testCase.caseNumber}"]`);
      await expect(caseRow.locator('[data-testid="case-status"]')).toHaveText('SUBMITTED');

      // Take screenshot of submitted case
      await fieldAgentPage.screenshot({
        path: 'test-results/case-submitted.png',
        fullPage: true
      });
    });

    // Step 6: Backend User Login and Verification
    test.step('Backend User Review Process', async () => {
      const loginPage = new LoginPage(backendUserPage);
      const backendDashboard = new BackendDashboard(backendUserPage);

      // Login as backend user
      await loginPage.login(BACKEND_USER);

      // Navigate to pending cases
      await backendDashboard.navigateToPendingCases();

      // Verify case appears in pending queue
      await backendDashboard.verifyCaseInQueue(testCase.caseNumber);

      // Review the case
      await backendDashboard.reviewCase(testCase.caseNumber);

      // Validate the case
      await backendDashboard.validateCase(testCase.caseNumber);
    });

    // Step 7: Final Verification
    test.step('Final Status Verification', async () => {
      // Refresh field agent page to see final status
      await fieldAgentPage.reload();
      await fieldAgentPage.waitForLoadState('networkidle');

      const casesPage = new CasesPage(fieldAgentPage);
      await casesPage.navigateToAssignedCases();

      // Verify final case status
      const caseRow = fieldAgentPage.locator(`[data-testid="case-row-${testCase.caseNumber}"]`);
      await expect(caseRow.locator('[data-testid="case-status"]')).toHaveText('VALIDATED');

      // Take final screenshot
      await fieldAgentPage.screenshot({
        path: 'test-results/workflow-complete.png',
        fullPage: true
      });
    });
  });

  test('Mobile Case Workflow', async ({ browser }) => {
    // Create mobile context
    const mobileContext = await browser.newContext({
      ...browser.devices()['iPhone 12'],
      permissions: ['geolocation', 'camera']
    });

    const mobilePage = await mobileContext.newPage();

    try {
      // Generate new test case for mobile
      const mobileTestCase = generateTestCase();
      await DatabaseHelper.createTestCase(mobileTestCase);

      test.step('Mobile Agent Login', async () => {
        const loginPage = new LoginPage(mobilePage);
        await loginPage.login(FIELD_AGENT);
      });

      test.step('Mobile Case Acceptance', async () => {
        const mobileCasesPage = new MobileCasesPage(mobilePage);
        await mobileCasesPage.navigateToMobileApp();
        await mobileCasesPage.openCasesTab();
        await mobileCasesPage.acceptCaseOnMobile(mobileTestCase.caseNumber);

        // Take mobile screenshot
        await mobilePage.screenshot({
          path: 'test-results/mobile-case-accepted.png',
          fullPage: true
        });
      });

      test.step('Mobile Form Completion', async () => {
        // Navigate to mobile form
        await mobilePage.click(`[data-testid="mobile-case-${mobileTestCase.caseNumber}"] [data-testid="open-form-button"]`);

        // Fill mobile form (simplified for mobile)
        await mobilePage.fill('[data-testid="mobile-customer-name"]', mobileTestCase.customerName);
        await mobilePage.fill('[data-testid="mobile-customer-phone"]', mobileTestCase.customerPhone);
        await mobilePage.fill('[data-testid="mobile-property-address"]', mobileTestCase.propertyAddress);

        // Take photo using camera (simulated)
        await mobilePage.click('[data-testid="mobile-camera-button"]');
        await mobilePage.click('[data-testid="mobile-capture-photo"]');

        // Submit mobile form
        await mobilePage.click('[data-testid="mobile-submit-button"]');
        await mobilePage.click('[data-testid="mobile-confirm-submit"]');

        // Verify success
        await expect(mobilePage.locator('[data-testid="mobile-success-message"]')).toBeVisible();
      });

      // Cleanup mobile test case
      await DatabaseHelper.cleanupTestCase(mobileTestCase.caseNumber);

    } finally {
      await mobileContext.close();
    }
  });

  test('Error Handling and Edge Cases', async () => {
    test.step('Handle Network Errors', async () => {
      // Simulate network failure during form submission
      await fieldAgentPage.route('**/api/cases/*/submit', route => {
        route.abort('failed');
      });

      const casesPage = new CasesPage(fieldAgentPage);
      const formPage = new CaseFormPage(fieldAgentPage);

      await casesPage.navigateToAssignedCases();
      await casesPage.openCaseForm(testCase.caseNumber);

      // Try to submit form
      await formPage.submitCase();

      // Verify error handling
      await expect(fieldAgentPage.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(fieldAgentPage.locator('[data-testid="error-message"]')).toContainText('Network error');

      // Remove network simulation
      await fieldAgentPage.unroute('**/api/cases/*/submit');
    });

    test.step('Handle Validation Errors', async () => {
      // Try to submit form with missing required fields
      const formPage = new CaseFormPage(fieldAgentPage);

      // Clear required field
      await fieldAgentPage.fill('[data-testid="customer-name"]', '');

      // Try to submit
      await fieldAgentPage.click('[data-testid="submit-case-button"]');

      // Verify validation error
      await expect(fieldAgentPage.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(fieldAgentPage.locator('[data-testid="validation-error"]')).toContainText('Customer name is required');
    });

    test.step('Handle Large File Uploads', async () => {
      // Test with large file (simulated)
      const largefile = path.join(__dirname, '../fixtures/large-test-file.pdf');

      const fileUpload = fieldAgentPage.locator('[data-testid="document-upload"]');
      await fileUpload.setInputFiles([largefile]);

      // Verify upload progress indicator
      await expect(fieldAgentPage.locator('[data-testid="upload-progress"]')).toBeVisible();

      // Wait for upload completion or timeout
      await expect(fieldAgentPage.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 60000 });
    });
  });

  test('Performance and Load Testing', async () => {
    test.step('Measure Page Load Times', async () => {
      const startTime = Date.now();

      await fieldAgentPage.goto(`${TEST_CONFIG.baseURL}/cases`);
      await fieldAgentPage.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Assert page loads within acceptable time
      expect(loadTime).toBeLessThan(3000); // 3 seconds max

      console.log(`Cases page load time: ${loadTime}ms`);
    });

    test.step('Test Concurrent Form Submissions', async () => {
      // Create multiple test cases
      const concurrentCases = await Promise.all(
        Array(5).fill(null).map(async () => {
          const newCase = generateTestCase();
          await DatabaseHelper.createTestCase(newCase);
          return newCase;
        })
      );

      // Submit all cases concurrently (simulated)
      const submissions = concurrentCases.map(async (caseData) => {
        const response = await fieldAgentPage.request.post(`${TEST_CONFIG.apiURL}/api/cases/${caseData.caseNumber}/submit`, {
          data: {
            customerName: caseData.customerName,
            customerEmail: caseData.customerEmail,
            propertyAddress: caseData.propertyAddress
          }
        });
        return response.ok();
      });

      const results = await Promise.all(submissions);

      // Verify all submissions succeeded
      results.forEach(result => expect(result).toBe(true));

      // Cleanup concurrent test cases
      await Promise.all(
        concurrentCases.map(caseData =>
          DatabaseHelper.cleanupTestCase(caseData.caseNumber)
        )
      );
    });
  });

  test('Accessibility Testing', async () => {
    test.step('Check Form Accessibility', async () => {
      const casesPage = new CasesPage(fieldAgentPage);
      await casesPage.navigateToAssignedCases();
      await casesPage.openCaseForm(testCase.caseNumber);

      // Check for proper ARIA labels
      await expect(fieldAgentPage.locator('[data-testid="customer-name"]')).toHaveAttribute('aria-label');
      await expect(fieldAgentPage.locator('[data-testid="customer-email"]')).toHaveAttribute('aria-label');

      // Check for proper heading structure
      await expect(fieldAgentPage.locator('h1')).toBeVisible();
      await expect(fieldAgentPage.locator('h2')).toBeVisible();

      // Test keyboard navigation
      await fieldAgentPage.keyboard.press('Tab');
      await expect(fieldAgentPage.locator(':focus')).toBeVisible();
    });

    test.step('Check Color Contrast', async () => {
      // This would typically use axe-core or similar tool
      // For now, we'll check that text is visible
      await expect(fieldAgentPage.locator('[data-testid="form-title"]')).toBeVisible();
      await expect(fieldAgentPage.locator('[data-testid="submit-case-button"]')).toBeVisible();
    });
  });
});

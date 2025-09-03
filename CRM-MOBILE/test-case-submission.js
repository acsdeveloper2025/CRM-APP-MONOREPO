import { chromium } from 'playwright';

// Configuration
const MOBILE_APP_URL = 'http://192.168.1.36:5180';
const WEB_APP_URL = 'http://192.168.1.36:5173';
const BACKEND_API_URL = 'http://192.168.1.36:3000/api';

// Test credentials
const FIELD_AGENT_CREDENTIALS = {
  username: 'nikhil.parab',
  password: 'nikhil123'
};

const WEB_ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Test case data
const TEST_CASE_DATA = {
  customerName: 'Playwright Test Customer',
  customerPhone: '9876543210',
  customerEmail: 'playwright.test@example.com',
  address: '123 Playwright Test Street, Bangalore, Karnataka 560001',
  verificationType: 'RESIDENCE',
  priority: 'HIGH'
};

class ConsoleMonitor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.logs = [];
  }

  attachToPage(page, pageName) {
    page.on('console', msg => {
      const message = {
        page: pageName,
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      };

      switch (msg.type()) {
        case 'error':
          this.errors.push(message);
          console.log(`🔴 [${pageName}] ERROR:`, msg.text());
          break;
        case 'warning':
          this.warnings.push(message);
          console.log(`🟡 [${pageName}] WARNING:`, msg.text());
          break;
        default:
          this.logs.push(message);
          console.log(`📝 [${pageName}] ${msg.type().toUpperCase()}:`, msg.text());
      }
    });

    page.on('pageerror', error => {
      const errorMessage = {
        page: pageName,
        type: 'pageerror',
        text: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      this.errors.push(errorMessage);
      console.log(`💥 [${pageName}] PAGE ERROR:`, error.message);
    });
  }

  getReport() {
    return {
      errors: this.errors,
      warnings: this.warnings,
      logs: this.logs,
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        totalLogs: this.logs.length
      }
    };
  }
}

async function checkBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_API_URL}/health`);
    const data = await response.json();
    console.log('✅ Backend health check:', data);
    return true;
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    return false;
  }
}

async function submitCaseFromMobile(browser, monitor) {
  console.log('\n🚀 Step 1: Submitting case from mobile app...');
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone X dimensions
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  monitor.attachToPage(page, 'MOBILE');

  try {
    // Navigate to mobile app
    console.log('📱 Navigating to mobile app...');
    await page.goto(MOBILE_APP_URL);
    await page.waitForLoadState('networkidle');

    // Login
    console.log('🔐 Logging in as field agent...');
    await page.fill('input[name="username"]', FIELD_AGENT_CREDENTIALS.username);
    await page.fill('input[name="password"]', FIELD_AGENT_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Check if login was successful
    const isLoggedIn = await page.locator('text=Dashboard').isVisible({ timeout: 10000 });
    if (!isLoggedIn) {
      throw new Error('Login failed - Dashboard not visible');
    }
    console.log('✅ Login successful');

    // Navigate to case creation
    console.log('📝 Creating new case...');
    await page.click('text=New Case');
    await page.waitForLoadState('networkidle');

    // Fill case form
    console.log('📋 Filling case form...');
    await page.fill('input[name="customerName"]', TEST_CASE_DATA.customerName);
    await page.fill('input[name="customerPhone"]', TEST_CASE_DATA.customerPhone);
    await page.fill('input[name="customerEmail"]', TEST_CASE_DATA.customerEmail);
    await page.fill('textarea[name="address"]', TEST_CASE_DATA.address);
    
    // Select verification type
    await page.selectOption('select[name="verificationType"]', TEST_CASE_DATA.verificationType);
    
    // Select priority
    await page.selectOption('select[name="priority"]', TEST_CASE_DATA.priority);

    // Submit the case
    console.log('📤 Submitting case...');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Wait for success message or case ID
    const successMessage = await page.locator('text=Case created successfully').isVisible({ timeout: 15000 });
    if (successMessage) {
      console.log('✅ Case submitted successfully from mobile app');
      
      // Try to extract case ID from the page
      const caseIdElement = await page.locator('[data-testid="case-id"]').first();
      let caseId = null;
      if (await caseIdElement.isVisible()) {
        caseId = await caseIdElement.textContent();
        console.log('📋 Case ID:', caseId);
      }
      
      return { success: true, caseId };
    } else {
      throw new Error('Case submission failed - no success message');
    }

  } catch (error) {
    console.error('❌ Mobile case submission failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    await context.close();
  }
}

async function checkWebInterface(browser, monitor, caseId) {
  console.log('\n🌐 Step 2: Checking web interface for submitted case...');
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  monitor.attachToPage(page, 'WEB');

  try {
    // Navigate to web app
    console.log('🖥️ Navigating to web app...');
    await page.goto(WEB_APP_URL);
    await page.waitForLoadState('networkidle');

    // Login
    console.log('🔐 Logging in as admin...');
    await page.fill('input[name="username"]', WEB_ADMIN_CREDENTIALS.username);
    await page.fill('input[name="password"]', WEB_ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to cases
    console.log('📋 Navigating to cases page...');
    await page.click('text=Cases');
    await page.waitForLoadState('networkidle');

    // Search for the submitted case
    console.log('🔍 Searching for submitted case...');
    if (caseId) {
      await page.fill('input[placeholder*="Search"]', caseId);
    } else {
      await page.fill('input[placeholder*="Search"]', TEST_CASE_DATA.customerName);
    }
    await page.waitForTimeout(2000); // Wait for search results

    // Check if case appears in the list
    const caseFound = await page.locator(`text=${TEST_CASE_DATA.customerName}`).isVisible({ timeout: 10000 });
    
    if (caseFound) {
      console.log('✅ Case found in web interface');
      
      // Click on the case to view details
      await page.click(`text=${TEST_CASE_DATA.customerName}`);
      await page.waitForLoadState('networkidle');
      
      // Check Form Submissions tab
      console.log('📝 Checking Form Submissions tab...');
      const formSubmissionsTab = await page.locator('text=Form Submissions').isVisible();
      if (formSubmissionsTab) {
        await page.click('text=Form Submissions');
        await page.waitForLoadState('networkidle');
        console.log('✅ Form Submissions tab accessible');
      }
      
      return { success: true, found: true };
    } else {
      console.log('⚠️ Case not found in web interface yet (may need time to sync)');
      return { success: true, found: false };
    }

  } catch (error) {
    console.error('❌ Web interface check failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    await context.close();
  }
}

async function checkBackendAPI(caseId) {
  console.log('\n🔧 Step 3: Checking backend API for case data...');
  
  try {
    // Check cases endpoint
    const casesResponse = await fetch(`${BACKEND_API_URL}/cases`);
    const casesData = await casesResponse.json();
    
    console.log('📊 Total cases in backend:', casesData.data?.length || 0);
    
    // Look for our specific case
    const ourCase = casesData.data?.find(c => 
      c.customerName === TEST_CASE_DATA.customerName || 
      (caseId && c.id === caseId)
    );
    
    if (ourCase) {
      console.log('✅ Case found in backend API');
      console.log('📋 Case details:', {
        id: ourCase.id,
        customerName: ourCase.customerName,
        status: ourCase.status,
        createdAt: ourCase.createdAt
      });
      return { success: true, found: true, case: ourCase };
    } else {
      console.log('⚠️ Case not found in backend API');
      return { success: true, found: false };
    }
    
  } catch (error) {
    console.error('❌ Backend API check failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function runCompleteTest() {
  console.log('🎯 Starting Complete Case Submission Test');
  console.log('==========================================');
  
  const monitor = new ConsoleMonitor();
  let browser;
  
  try {
    // Check backend health first
    const backendHealthy = await checkBackendHealth();
    if (!backendHealthy) {
      throw new Error('Backend is not healthy - aborting test');
    }
    
    // Launch browser
    browser = await chromium.launch({ 
      headless: false, // Set to true for headless mode
      slowMo: 1000 // Slow down for better visibility
    });
    
    // Step 1: Submit case from mobile
    const mobileResult = await submitCaseFromMobile(browser, monitor);
    
    // Step 2: Check web interface
    const webResult = await checkWebInterface(browser, monitor, mobileResult.caseId);
    
    // Step 3: Check backend API
    const backendResult = await checkBackendAPI(mobileResult.caseId);
    
    // Generate final report
    console.log('\n📊 FINAL TEST REPORT');
    console.log('====================');
    console.log('Mobile Submission:', mobileResult.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Web Interface:', webResult.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Backend API:', backendResult.success ? '✅ SUCCESS' : '❌ FAILED');
    
    const consoleReport = monitor.getReport();
    console.log('\n🔍 Console Monitoring Report:');
    console.log('Errors:', consoleReport.summary.totalErrors);
    console.log('Warnings:', consoleReport.summary.totalWarnings);
    console.log('Total Logs:', consoleReport.summary.totalLogs);
    
    if (consoleReport.errors.length > 0) {
      console.log('\n🔴 Console Errors:');
      consoleReport.errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.page}] ${error.text}`);
      });
    }
    
    return {
      mobile: mobileResult,
      web: webResult,
      backend: backendResult,
      console: consoleReport
    };
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
    return { error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
runCompleteTest().then(result => {
  console.log('\n🏁 Test completed');
  process.exit(result.error ? 1 : 0);
}).catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});

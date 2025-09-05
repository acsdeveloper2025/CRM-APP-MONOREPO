const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  baseURL: process.env.API_URL || 'http://localhost:3000',
  frontendURL: process.env.FRONTEND_URL || 'http://localhost:3001',
  testTimeout: 30000,
  maxRetries: 3,
};

// Test results storage
let testResults = {
  startTime: Date.now(),
  endTime: null,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  testSuites: {},
  performanceMetrics: {},
  errors: [],
};

// Utility functions
const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test framework
class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
      metrics: {},
    };
  }

  async test(description, testFn) {
    const startTime = Date.now();
    testResults.totalTests++;
    
    try {
      log(`Running: ${this.name} - ${description}`);
      await testFn();
      
      this.results.passed++;
      testResults.passedTests++;
      
      const duration = Date.now() - startTime;
      this.results.metrics[description] = { duration, status: 'PASSED' };
      
      log(`✅ PASSED: ${description} (${duration}ms)`, 'SUCCESS');
      
    } catch (error) {
      this.results.failed++;
      testResults.failedTests++;
      
      const duration = Date.now() - startTime;
      this.results.metrics[description] = { duration, status: 'FAILED', error: error.message };
      this.results.errors.push({ test: description, error: error.message, stack: error.stack });
      testResults.errors.push({ suite: this.name, test: description, error: error.message });
      
      log(`❌ FAILED: ${description} - ${error.message}`, 'ERROR');
    }
  }

  getResults() {
    return this.results;
  }
}

// API Client with authentication
class TestApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.testTimeout,
    });
    this.authToken = null;
  }

  async authenticate(email, password) {
    try {
      const response = await this.client.post('/api/auth/login', { email, password });
      this.authToken = response.data.token;
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
      return response.data;
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async get(url, config = {}) {
    return await this.client.get(url, config);
  }

  async post(url, data, config = {}) {
    return await this.client.post(url, data, config);
  }

  async put(url, data, config = {}) {
    return await this.client.put(url, data, config);
  }

  async delete(url, config = {}) {
    return await this.client.delete(url, config);
  }
}

// Test data generators
const generateTestUser = (type = 'BACKEND_USER', index = 1) => ({
  firstName: `Test${type}`,
  lastName: `User${index}`,
  email: `test${type.toLowerCase()}${index}@test.com`,
  password: 'TestPassword123!',
  role: type,
  phone: `+1234567${String(index).padStart(3, '0')}`,
});

const generateTestCase = (index = 1) => ({
  customerName: `Test Customer ${index}`,
  customerPhone: `+1234567${String(index).padStart(3, '0')}`,
  customerEmail: `customer${index}@test.com`,
  address: `${index} Test Street, Test City, TC ${String(index).padStart(5, '0')}`,
  verificationType: 'IDENTITY',
  applicantType: 'INDIVIDUAL',
  product: 'LOAN',
  client: 'TEST_CLIENT',
  priority: 'MEDIUM',
  trigger: `Test trigger for case ${index}`,
  customerCallingCode: '+1',
});

// 1. Backend API Testing
async function testBackendAPI() {
  const suite = new TestSuite('Backend API Testing');
  const apiClient = new TestApiClient();

  await suite.test('Health Check Endpoint', async () => {
    const response = await apiClient.get('/api/health');
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.data.status) throw new Error('Health check response missing status');
  });

  await suite.test('Authentication - Valid Credentials', async () => {
    const testUser = generateTestUser('BACKEND_USER', 1);
    // First create a test user (assuming user creation endpoint exists)
    try {
      await apiClient.post('/api/auth/register', testUser);
    } catch (error) {
      // User might already exist, continue with login
    }
    
    const authResponse = await apiClient.authenticate(testUser.email, testUser.password);
    if (!authResponse.token) throw new Error('Authentication response missing token');
  });

  await suite.test('Authentication - Invalid Credentials', async () => {
    try {
      await apiClient.authenticate('invalid@test.com', 'wrongpassword');
      throw new Error('Authentication should have failed');
    } catch (error) {
      if (error.message.includes('should have failed')) throw error;
      // Expected to fail
    }
  });

  await suite.test('Rate Limiting', async () => {
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(apiClient.get('/api/health'));
    }
    
    const responses = await Promise.allSettled(requests);
    const rateLimited = responses.some(r => 
      r.status === 'rejected' && r.reason.response?.status === 429
    );
    
    // Rate limiting should kick in for rapid requests
    log(`Rate limiting test: ${rateLimited ? 'Active' : 'Not triggered'}`);
  });

  await suite.test('Database Connection', async () => {
    const response = await apiClient.get('/api/health/detailed');
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    
    const dbCheck = response.data.checks?.database;
    if (!dbCheck || dbCheck.status !== 'healthy') {
      throw new Error(`Database check failed: ${dbCheck?.message || 'Unknown error'}`);
    }
  });

  return suite.getResults();
}

// 2. User Management Testing
async function testUserManagement() {
  const suite = new TestSuite('User Management Testing');
  const apiClient = new TestApiClient();

  // Authenticate as admin first
  await apiClient.authenticate('admin@test.com', 'admin123');

  await suite.test('Create Backend User', async () => {
    const testUser = generateTestUser('BACKEND_USER', Date.now());
    const response = await apiClient.post('/api/users', testUser);
    
    if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
    if (!response.data.id) throw new Error('User creation response missing ID');
  });

  await suite.test('Create Field Agent', async () => {
    const testUser = generateTestUser('FIELD_AGENT', Date.now());
    const response = await apiClient.post('/api/users', testUser);
    
    if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
    if (!response.data.id) throw new Error('User creation response missing ID');
  });

  await suite.test('Get Users List', async () => {
    const response = await apiClient.get('/api/users');
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!Array.isArray(response.data.data)) throw new Error('Users response should be an array');
  });

  await suite.test('Role-Based Access Control', async () => {
    // Test that field agents can't access admin endpoints
    const fieldAgent = generateTestUser('FIELD_AGENT', Date.now() + 1);
    await apiClient.post('/api/users', fieldAgent);
    
    const fieldApiClient = new TestApiClient();
    await fieldApiClient.authenticate(fieldAgent.email, fieldAgent.password);
    
    try {
      await fieldApiClient.get('/api/users'); // Admin-only endpoint
      throw new Error('Field agent should not access admin endpoints');
    } catch (error) {
      if (error.response?.status !== 403) {
        throw new Error(`Expected 403 Forbidden, got ${error.response?.status || error.message}`);
      }
    }
  });

  return suite.getResults();
}

// 3. Case Management Testing
async function testCaseManagement() {
  const suite = new TestSuite('Case Management Testing');
  const apiClient = new TestApiClient();

  await apiClient.authenticate('admin@test.com', 'admin123');

  let createdCaseId = null;
  let fieldAgentId = null;

  await suite.test('Create New Case', async () => {
    const testCase = generateTestCase(Date.now());
    const response = await apiClient.post('/api/cases', testCase);
    
    if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
    if (!response.data.id) throw new Error('Case creation response missing ID');
    
    createdCaseId = response.data.id;
  });

  await suite.test('Get Cases List', async () => {
    const response = await apiClient.get('/api/cases');
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.data.data || !Array.isArray(response.data.data)) {
      throw new Error('Cases response should contain data array');
    }
  });

  await suite.test('Get Case by ID', async () => {
    if (!createdCaseId) throw new Error('No case ID available for testing');
    
    const response = await apiClient.get(`/api/cases/${createdCaseId}`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (response.data.id !== createdCaseId) throw new Error('Case ID mismatch');
  });

  await suite.test('Assign Case to Field Agent', async () => {
    if (!createdCaseId) throw new Error('No case ID available for testing');
    
    // First get a field agent
    const usersResponse = await apiClient.get('/api/users?role=FIELD_AGENT');
    if (usersResponse.data.data.length === 0) {
      // Create a field agent
      const fieldAgent = generateTestUser('FIELD_AGENT', Date.now());
      const createResponse = await apiClient.post('/api/users', fieldAgent);
      fieldAgentId = createResponse.data.id;
    } else {
      fieldAgentId = usersResponse.data.data[0].id;
    }
    
    const response = await apiClient.put(`/api/cases/${createdCaseId}/assign`, {
      assignToUserId: fieldAgentId,
    });
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });

  await suite.test('Update Case Status', async () => {
    if (!createdCaseId) throw new Error('No case ID available for testing');
    
    const response = await apiClient.put(`/api/cases/${createdCaseId}/status`, {
      status: 'IN_PROGRESS',
      notes: 'Test status update',
    });
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });

  await suite.test('Bulk Case Assignment', async () => {
    // Create multiple test cases
    const caseIds = [];
    for (let i = 0; i < 5; i++) {
      const testCase = generateTestCase(Date.now() + i);
      const response = await apiClient.post('/api/cases', testCase);
      caseIds.push(response.data.id);
    }
    
    if (!fieldAgentId) throw new Error('No field agent ID available');
    
    const response = await apiClient.post('/api/cases/bulk/assign', {
      caseIds,
      assignToUserId: fieldAgentId,
    });
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.data.batchId) throw new Error('Bulk assignment response missing batch ID');
  });

  return suite.getResults();
}

// 4. Performance Testing
async function testPerformance() {
  const suite = new TestSuite('Performance Testing');
  const apiClient = new TestApiClient();

  await apiClient.authenticate('admin@test.com', 'admin123');

  await suite.test('API Response Time - Cases List', async () => {
    const startTime = Date.now();
    const response = await apiClient.get('/api/cases?limit=100');
    const responseTime = Date.now() - startTime;
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (responseTime > 2000) throw new Error(`Response time too slow: ${responseTime}ms`);
    
    testResults.performanceMetrics.casesListResponseTime = responseTime;
  });

  await suite.test('API Response Time - Health Check', async () => {
    const startTime = Date.now();
    const response = await apiClient.get('/api/health');
    const responseTime = Date.now() - startTime;
    
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (responseTime > 500) throw new Error(`Health check too slow: ${responseTime}ms`);
    
    testResults.performanceMetrics.healthCheckResponseTime = responseTime;
  });

  await suite.test('Concurrent Requests Handling', async () => {
    const concurrentRequests = 20;
    const requests = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(apiClient.get('/api/health'));
    }
    
    const startTime = Date.now();
    const responses = await Promise.allSettled(requests);
    const totalTime = Date.now() - startTime;
    
    const successful = responses.filter(r => r.status === 'fulfilled').length;
    const successRate = (successful / concurrentRequests) * 100;
    
    if (successRate < 90) throw new Error(`Low success rate: ${successRate}%`);
    
    testResults.performanceMetrics.concurrentRequestsSuccessRate = successRate;
    testResults.performanceMetrics.concurrentRequestsTotalTime = totalTime;
  });

  return suite.getResults();
}

// 5. Integration Testing
async function testIntegration() {
  const suite = new TestSuite('Integration Testing');
  const apiClient = new TestApiClient();

  await apiClient.authenticate('admin@test.com', 'admin123');

  await suite.test('Complete Case Workflow', async () => {
    // 1. Create a case
    const testCase = generateTestCase(Date.now());
    const caseResponse = await apiClient.post('/api/cases', testCase);
    const caseId = caseResponse.data.id;
    
    // 2. Create a field agent
    const fieldAgent = generateTestUser('FIELD_AGENT', Date.now());
    const agentResponse = await apiClient.post('/api/users', fieldAgent);
    const agentId = agentResponse.data.id;
    
    // 3. Assign case to agent
    await apiClient.put(`/api/cases/${caseId}/assign`, { assignToUserId: agentId });
    
    // 4. Update case status
    await apiClient.put(`/api/cases/${caseId}/status`, { 
      status: 'IN_PROGRESS',
      notes: 'Field work started'
    });
    
    // 5. Complete case
    await apiClient.put(`/api/cases/${caseId}/status`, { 
      status: 'COMPLETED',
      notes: 'Case completed successfully'
    });
    
    // 6. Verify final state
    const finalResponse = await apiClient.get(`/api/cases/${caseId}`);
    if (finalResponse.data.status !== 'COMPLETED') {
      throw new Error('Case workflow completion failed');
    }
  });

  await suite.test('Data Consistency Check', async () => {
    // Create a case and verify it appears in all relevant endpoints
    const testCase = generateTestCase(Date.now());
    const caseResponse = await apiClient.post('/api/cases', testCase);
    const caseId = caseResponse.data.id;
    
    // Check case appears in list
    const listResponse = await apiClient.get('/api/cases');
    const caseInList = listResponse.data.data.find(c => c.id === caseId);
    if (!caseInList) throw new Error('Case not found in list after creation');
    
    // Check case details match
    const detailResponse = await apiClient.get(`/api/cases/${caseId}`);
    if (detailResponse.data.customerName !== testCase.customerName) {
      throw new Error('Case data inconsistency detected');
    }
  });

  return suite.getResults();
}

// Main test execution
async function runComprehensiveTests() {
  log('🧪 Starting Comprehensive End-to-End Testing', 'INFO');
  log(`Test Configuration: ${JSON.stringify(config)}`, 'INFO');
  
  try {
    // Wait for services to be ready
    log('Waiting for services to be ready...', 'INFO');
    await sleep(5000);
    
    // Execute test suites
    testResults.testSuites.backendAPI = await testBackendAPI();
    testResults.testSuites.userManagement = await testUserManagement();
    testResults.testSuites.caseManagement = await testCaseManagement();
    testResults.testSuites.performance = await testPerformance();
    testResults.testSuites.integration = await testIntegration();
    
    testResults.endTime = Date.now();
    
    // Generate final report
    generateTestReport();
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'ERROR');
    testResults.errors.push({ suite: 'EXECUTION', test: 'MAIN', error: error.message });
  }
}

function generateTestReport() {
  const duration = testResults.endTime - testResults.startTime;
  const successRate = testResults.totalTests > 0 ? 
    (testResults.passedTests / testResults.totalTests) * 100 : 0;
  
  const report = {
    summary: {
      totalTests: testResults.totalTests,
      passedTests: testResults.passedTests,
      failedTests: testResults.failedTests,
      successRate: `${successRate.toFixed(2)}%`,
      duration: `${(duration / 1000).toFixed(2)}s`,
      timestamp: new Date().toISOString(),
    },
    testSuites: testResults.testSuites,
    performanceMetrics: testResults.performanceMetrics,
    errors: testResults.errors,
    config,
  };
  
  // Save report to file
  const reportPath = path.join(__dirname, `e2e-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('🧪 COMPREHENSIVE END-TO-END TEST REPORT');
  console.log('='.repeat(80));
  console.log(`📊 Total Tests: ${report.summary.totalTests}`);
  console.log(`✅ Passed: ${report.summary.passedTests}`);
  console.log(`❌ Failed: ${report.summary.failedTests}`);
  console.log(`📈 Success Rate: ${report.summary.successRate}`);
  console.log(`⏱️  Duration: ${report.summary.duration}`);
  console.log(`📁 Report saved: ${reportPath}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    testResults.errors.forEach(error => {
      console.log(`  ${error.suite} - ${error.test}: ${error.error}`);
    });
  }
  
  if (Object.keys(testResults.performanceMetrics).length > 0) {
    console.log('\n📊 PERFORMANCE METRICS:');
    Object.entries(testResults.performanceMetrics).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}${typeof value === 'number' && key.includes('Time') ? 'ms' : ''}`);
    });
  }
  
  console.log('='.repeat(80));
  
  // Exit with appropriate code
  process.exit(testResults.failedTests === 0 ? 0 : 1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('Received SIGINT. Generating test report...', 'INFO');
  testResults.endTime = Date.now();
  generateTestReport();
});

// Run tests if this is the main module
if (require.main === module) {
  runComprehensiveTests().catch(error => {
    log(`Test suite failed: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = { runComprehensiveTests, TestSuite, TestApiClient };

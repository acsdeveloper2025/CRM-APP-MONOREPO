const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load test configuration
const config = {
  baseURL: process.env.API_URL || 'http://localhost:3000',
  totalUsers: parseInt(process.env.TOTAL_USERS) || 1000,
  backendUsers: parseInt(process.env.BACKEND_USERS) || 500,
  fieldAgents: parseInt(process.env.FIELD_AGENTS) || 500,
  testDuration: parseInt(process.env.TEST_DURATION) || 300, // 5 minutes
  rampUpTime: parseInt(process.env.RAMP_UP_TIME) || 60, // 1 minute
  reportInterval: parseInt(process.env.REPORT_INTERVAL) || 10, // 10 seconds
};

// Test scenarios
const scenarios = {
  backendUser: [
    { endpoint: '/api/cases', method: 'GET', weight: 40 },
    { endpoint: '/api/cases', method: 'POST', weight: 15 },
    { endpoint: '/api/cases/bulk/assign', method: 'POST', weight: 10 },
    { endpoint: '/api/cases/analytics/field-agent-workload', method: 'GET', weight: 15 },
    { endpoint: '/api/users/field-agents', method: 'GET', weight: 20 },
  ],
  fieldAgent: [
    { endpoint: '/api/mobile/sync/enterprise', method: 'POST', weight: 30 },
    { endpoint: '/api/mobile/sync/download', method: 'GET', weight: 25 },
    { endpoint: '/api/cases/assigned', method: 'GET', weight: 25 },
    { endpoint: '/api/cases/:id/status', method: 'PUT', weight: 20 },
  ],
};

// Performance metrics
let metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  responseTimeDistribution: {
    '0-100ms': 0,
    '100-500ms': 0,
    '500-1000ms': 0,
    '1000-2000ms': 0,
    '2000ms+': 0,
  },
  errorsByType: {},
  requestsByEndpoint: {},
  activeUsers: 0,
  startTime: Date.now(),
};

// User simulation class
class VirtualUser {
  constructor(id, type, token) {
    this.id = id;
    this.type = type;
    this.token = token;
    this.isActive = false;
    this.requestCount = 0;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': `LoadTest-${type}-${id}`,
      },
    });
  }

  async start() {
    this.isActive = true;
    metrics.activeUsers++;
    
    console.log(`User ${this.id} (${this.type}) started`);
    
    while (this.isActive) {
      try {
        await this.performRandomAction();
        await this.randomDelay();
      } catch (error) {
        console.error(`User ${this.id} error:`, error.message);
      }
    }
    
    metrics.activeUsers--;
    console.log(`User ${this.id} (${this.type}) stopped`);
  }

  stop() {
    this.isActive = false;
  }

  async performRandomAction() {
    const scenario = scenarios[this.type];
    const action = this.selectWeightedAction(scenario);
    
    const startTime = Date.now();
    
    try {
      const response = await this.executeAction(action);
      const responseTime = Date.now() - startTime;
      
      this.recordSuccess(action.endpoint, responseTime);
      this.requestCount++;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordError(action.endpoint, error, responseTime);
    }
  }

  selectWeightedAction(scenario) {
    const totalWeight = scenario.reduce((sum, action) => sum + action.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const action of scenario) {
      random -= action.weight;
      if (random <= 0) {
        return action;
      }
    }
    
    return scenario[0]; // Fallback
  }

  async executeAction(action) {
    const endpoint = this.replacePathParams(action.endpoint);
    const data = this.generateRequestData(action);
    
    switch (action.method) {
      case 'GET':
        return await this.client.get(endpoint);
      case 'POST':
        return await this.client.post(endpoint, data);
      case 'PUT':
        return await this.client.put(endpoint, data);
      case 'DELETE':
        return await this.client.delete(endpoint);
      default:
        throw new Error(`Unsupported method: ${action.method}`);
    }
  }

  replacePathParams(endpoint) {
    // Replace path parameters with mock values
    return endpoint
      .replace(':id', this.generateMockId())
      .replace(':caseId', this.generateMockId());
  }

  generateRequestData(action) {
    // Generate appropriate request data based on endpoint
    switch (action.endpoint) {
      case '/api/cases':
        if (action.method === 'POST') {
          return {
            customerName: `Test Customer ${this.id}`,
            customerPhone: '+1234567890',
            address: '123 Test Street, Test City',
            verificationType: 'IDENTITY',
            applicantType: 'INDIVIDUAL',
            product: 'LOAN',
            client: 'TEST_CLIENT',
            priority: 'MEDIUM',
          };
        }
        break;
      
      case '/api/cases/bulk/assign':
        return {
          caseIds: [this.generateMockId(), this.generateMockId()],
          assignToUserId: this.generateMockId(),
        };
      
      case '/api/mobile/sync/enterprise':
        return {
          deviceId: `device_${this.id}`,
          lastSyncTime: Date.now() - 60000,
          actions: [
            {
              type: 'case_update',
              entityId: this.generateMockId(),
              data: { status: 'IN_PROGRESS' },
            },
          ],
        };
      
      case '/api/cases/:id/status':
        return {
          status: 'COMPLETED',
          notes: 'Load test completion',
        };
      
      default:
        return {};
    }
  }

  generateMockId() {
    return `mock_${Math.random().toString(36).substr(2, 9)}`;
  }

  async randomDelay() {
    // Simulate realistic user behavior with random delays
    const delay = Math.random() * 2000 + 500; // 0.5-2.5 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  recordSuccess(endpoint, responseTime) {
    metrics.totalRequests++;
    metrics.successfulRequests++;
    metrics.totalResponseTime += responseTime;
    metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
    metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
    
    // Response time distribution
    if (responseTime < 100) {
      metrics.responseTimeDistribution['0-100ms']++;
    } else if (responseTime < 500) {
      metrics.responseTimeDistribution['100-500ms']++;
    } else if (responseTime < 1000) {
      metrics.responseTimeDistribution['500-1000ms']++;
    } else if (responseTime < 2000) {
      metrics.responseTimeDistribution['1000-2000ms']++;
    } else {
      metrics.responseTimeDistribution['2000ms+']++;
    }
    
    // Requests by endpoint
    if (!metrics.requestsByEndpoint[endpoint]) {
      metrics.requestsByEndpoint[endpoint] = { success: 0, error: 0 };
    }
    metrics.requestsByEndpoint[endpoint].success++;
  }

  recordError(endpoint, error, responseTime) {
    metrics.totalRequests++;
    metrics.failedRequests++;
    metrics.totalResponseTime += responseTime;
    
    // Error categorization
    const errorType = error.response?.status || error.code || 'UNKNOWN';
    if (!metrics.errorsByType[errorType]) {
      metrics.errorsByType[errorType] = 0;
    }
    metrics.errorsByType[errorType]++;
    
    // Requests by endpoint
    if (!metrics.requestsByEndpoint[endpoint]) {
      metrics.requestsByEndpoint[endpoint] = { success: 0, error: 0 };
    }
    metrics.requestsByEndpoint[endpoint].error++;
  }
}

// Authentication helper
async function authenticateUser(userType, userId) {
  try {
    const response = await axios.post(`${config.baseURL}/api/auth/login`, {
      email: `${userType}${userId}@test.com`,
      password: 'testpassword123',
    });
    
    return response.data.token;
  } catch (error) {
    console.error(`Authentication failed for ${userType}${userId}:`, error.message);
    return null;
  }
}

// Report generation
function generateReport() {
  const duration = (Date.now() - metrics.startTime) / 1000;
  const avgResponseTime = metrics.totalRequests > 0 ? metrics.totalResponseTime / metrics.totalRequests : 0;
  const successRate = metrics.totalRequests > 0 ? (metrics.successfulRequests / metrics.totalRequests) * 100 : 0;
  const requestsPerSecond = metrics.totalRequests / duration;
  
  const report = {
    timestamp: new Date().toISOString(),
    duration: `${duration.toFixed(2)}s`,
    totalRequests: metrics.totalRequests,
    successfulRequests: metrics.successfulRequests,
    failedRequests: metrics.failedRequests,
    successRate: `${successRate.toFixed(2)}%`,
    requestsPerSecond: requestsPerSecond.toFixed(2),
    averageResponseTime: `${avgResponseTime.toFixed(2)}ms`,
    minResponseTime: `${metrics.minResponseTime}ms`,
    maxResponseTime: `${metrics.maxResponseTime}ms`,
    responseTimeDistribution: metrics.responseTimeDistribution,
    errorsByType: metrics.errorsByType,
    requestsByEndpoint: metrics.requestsByEndpoint,
    activeUsers: metrics.activeUsers,
    config,
  };
  
  return report;
}

function printReport() {
  const report = generateReport();
  
  console.log('\n' + '='.repeat(80));
  console.log('ENTERPRISE LOAD TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Duration: ${report.duration}`);
  console.log(`Active Users: ${report.activeUsers}`);
  console.log(`Total Requests: ${report.totalRequests}`);
  console.log(`Success Rate: ${report.successRate}`);
  console.log(`Requests/Second: ${report.requestsPerSecond}`);
  console.log(`Avg Response Time: ${report.averageResponseTime}`);
  console.log(`Min Response Time: ${report.minResponseTime}`);
  console.log(`Max Response Time: ${report.maxResponseTime}`);
  
  console.log('\nResponse Time Distribution:');
  Object.entries(report.responseTimeDistribution).forEach(([range, count]) => {
    console.log(`  ${range}: ${count}`);
  });
  
  if (Object.keys(report.errorsByType).length > 0) {
    console.log('\nErrors by Type:');
    Object.entries(report.errorsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  }
  
  console.log('='.repeat(80));
}

// Main test execution
async function runLoadTest() {
  console.log('Starting Enterprise Load Test...');
  console.log(`Configuration:`, config);
  
  const users = [];
  
  // Create and authenticate users
  console.log('Creating and authenticating users...');
  
  // Backend users
  for (let i = 1; i <= config.backendUsers; i++) {
    const token = await authenticateUser('backend', i);
    if (token) {
      users.push(new VirtualUser(i, 'backendUser', token));
    }
  }
  
  // Field agents
  for (let i = 1; i <= config.fieldAgents; i++) {
    const token = await authenticateUser('field', i);
    if (token) {
      users.push(new VirtualUser(i + config.backendUsers, 'fieldAgent', token));
    }
  }
  
  console.log(`Created ${users.length} virtual users`);
  
  // Start reporting interval
  const reportInterval = setInterval(printReport, config.reportInterval * 1000);
  
  // Ramp up users gradually
  console.log('Ramping up users...');
  const rampUpDelay = (config.rampUpTime * 1000) / users.length;
  
  for (const user of users) {
    user.start();
    await new Promise(resolve => setTimeout(resolve, rampUpDelay));
  }
  
  console.log('All users started. Running test...');
  
  // Run test for specified duration
  await new Promise(resolve => setTimeout(resolve, config.testDuration * 1000));
  
  // Stop all users
  console.log('Stopping all users...');
  users.forEach(user => user.stop());
  
  // Wait for users to finish
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Clear reporting interval
  clearInterval(reportInterval);
  
  // Generate final report
  const finalReport = generateReport();
  
  // Save report to file
  const reportPath = path.join(__dirname, `load-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
  
  console.log('\nFinal Report:');
  printReport();
  console.log(`\nDetailed report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  const successRate = (finalReport.successfulRequests / finalReport.totalRequests) * 100;
  process.exit(successRate >= 95 ? 0 : 1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Generating final report...');
  printReport();
  process.exit(0);
});

// Run the test
if (require.main === module) {
  runLoadTest().catch(error => {
    console.error('Load test failed:', error);
    process.exit(1);
  });
}

module.exports = { runLoadTest, VirtualUser, generateReport };

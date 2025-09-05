const axios = require('axios');

const config = {
  baseURL: 'http://localhost:3000',
  concurrentUsers: 20,
  requestsPerUser: 10,
  testDuration: 30000, // 30 seconds
};

// Test results
let results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  errors: [],
  startTime: Date.now(),
};

// Get auth token
async function getAuthToken() {
  try {
    const response = await axios.post(`${config.baseURL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    return response.data.data.tokens.accessToken;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// Simulate user requests
async function simulateUser(userId, token) {
  const client = axios.create({
    baseURL: config.baseURL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

  const endpoints = [
    { method: 'GET', url: '/api/health', weight: 20 },
    { method: 'GET', url: '/api/cases', weight: 40 },
    { method: 'GET', url: '/api/cases?limit=5', weight: 30 },
    { method: 'GET', url: '/api/auth/me', weight: 10 },
  ];

  for (let i = 0; i < config.requestsPerUser; i++) {
    // Select random endpoint
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    
    const startTime = Date.now();
    results.totalRequests++;
    
    try {
      const response = await client.request({
        method: endpoint.method,
        url: endpoint.url,
      });
      
      const responseTime = Date.now() - startTime;
      results.successfulRequests++;
      results.totalResponseTime += responseTime;
      results.minResponseTime = Math.min(results.minResponseTime, responseTime);
      results.maxResponseTime = Math.max(results.maxResponseTime, responseTime);
      
      console.log(`User ${userId}: ${endpoint.method} ${endpoint.url} - ${responseTime}ms - ${response.status}`);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      results.failedRequests++;
      results.errors.push({
        user: userId,
        endpoint: `${endpoint.method} ${endpoint.url}`,
        error: error.message,
        responseTime,
      });
      
      console.log(`User ${userId}: ${endpoint.method} ${endpoint.url} - FAILED - ${error.message}`);
    }
    
    // Random delay between requests
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  }
}

// Main test function
async function runPerformanceTest() {
  console.log('🚀 Starting Simple Performance Test');
  console.log(`Configuration: ${JSON.stringify(config)}`);
  
  try {
    // Get authentication token
    console.log('Getting authentication token...');
    const token = await getAuthToken();
    console.log('✅ Authentication successful');
    
    // Start concurrent users
    console.log(`Starting ${config.concurrentUsers} concurrent users...`);
    const userPromises = [];
    
    for (let i = 1; i <= config.concurrentUsers; i++) {
      userPromises.push(simulateUser(i, token));
    }
    
    // Wait for all users to complete
    await Promise.all(userPromises);
    
    // Generate report
    const duration = Date.now() - results.startTime;
    const avgResponseTime = results.totalRequests > 0 ? 
      results.totalResponseTime / results.totalRequests : 0;
    const successRate = results.totalRequests > 0 ? 
      (results.successfulRequests / results.totalRequests) * 100 : 0;
    const requestsPerSecond = results.totalRequests / (duration / 1000);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 PERFORMANCE TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Total Requests: ${results.totalRequests}`);
    console.log(`Successful Requests: ${results.successfulRequests}`);
    console.log(`Failed Requests: ${results.failedRequests}`);
    console.log(`Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`Requests/Second: ${requestsPerSecond.toFixed(2)}`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${results.minResponseTime}ms`);
    console.log(`Max Response Time: ${results.maxResponseTime}ms`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      results.errors.slice(0, 10).forEach(error => {
        console.log(`  ${error.endpoint}: ${error.error}`);
      });
      if (results.errors.length > 10) {
        console.log(`  ... and ${results.errors.length - 10} more errors`);
      }
    }
    
    console.log('='.repeat(80));
    
    // Performance assessment
    if (successRate >= 95 && avgResponseTime <= 1000) {
      console.log('✅ PERFORMANCE: EXCELLENT');
      process.exit(0);
    } else if (successRate >= 90 && avgResponseTime <= 2000) {
      console.log('⚠️  PERFORMANCE: GOOD');
      process.exit(0);
    } else {
      console.log('❌ PERFORMANCE: NEEDS IMPROVEMENT');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runPerformanceTest();

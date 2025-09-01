# CRM E2E Testing Suite

## 🧪 Comprehensive End-to-End Testing with Playwright

This directory contains the complete end-to-end testing suite for the CRM Data Visualization & Reporting System, demonstrating the complete case workflow from field agent submission to backend validation.

## 📋 Test Coverage

### Core Workflow Tests
- **Complete Case Workflow**: Field agent login → case acceptance → form completion → backend validation
- **Mobile App Testing**: Touch-optimized mobile interface with offline capabilities
- **Cross-browser Testing**: Chrome, Firefox, Safari compatibility
- **Responsive Design**: Desktop, tablet, and mobile viewports

### Specialized Test Suites
- **API Testing**: Backend API endpoints and data integrity
- **Performance Testing**: Load times, network simulation, concurrent users
- **Accessibility Testing**: WCAG compliance and keyboard navigation
- **Security Testing**: Authentication, authorization, input validation
- **Error Handling**: Network failures, validation errors, edge cases

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run playwright:install
```

### Running Tests

#### Basic Test Execution
```bash
# Run complete test suite
npm run test:e2e

# Run smoke tests (quick validation)
npm run test:e2e:smoke

# Run mobile-specific tests
npm run test:e2e:mobile

# Run with visual debugging
npm run test:e2e:debug
```

#### Advanced Test Execution
```bash
# Run specific test file
npx playwright test case-workflow.spec.ts

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests on specific browser
npx playwright test --project=firefox-desktop

# Run tests with custom configuration
./tests/run-tests.sh full --env=staging --browser=webkit --workers=2
```

## 📁 Test Structure

```
tests/
├── e2e/                          # End-to-end test files
│   ├── case-workflow.spec.ts     # Main workflow test
│   ├── mobile-workflow.spec.ts   # Mobile-specific tests
│   ├── api-tests.spec.ts         # API endpoint tests
│   ├── performance.spec.ts       # Performance benchmarks
│   └── accessibility.spec.ts     # Accessibility compliance
├── fixtures/                     # Test data and files
│   ├── test-data.json            # Test user and case data
│   ├── test-image.jpg            # Sample image for uploads
│   ├── test-document.pdf         # Sample document for uploads
│   └── large-test-file.pdf       # Large file for upload testing
├── setup/                        # Global setup and teardown
│   ├── global-setup.ts           # Pre-test environment setup
│   └── global-teardown.ts        # Post-test cleanup
├── auth/                         # Authentication states
│   ├── field-agent-auth.json     # Field agent login state
│   ├── backend-user-auth.json    # Backend user login state
│   └── admin-auth.json           # Admin login state
└── run-tests.sh                  # Test runner script
```

## 🎯 Test Scenarios

### 1. Complete Case Workflow Test

**Scenario**: End-to-end case processing from field agent to backend validation

**Steps**:
1. **Database Setup**: Create test case assigned to field agent
2. **Field Agent Login**: Authenticate as field agent user
3. **Case Acceptance**: Navigate to assigned cases and accept case
4. **Case Progress**: Change status to "In Progress"
5. **Form Completion**: Fill all required fields, upload documents
6. **Case Submission**: Submit case for backend review
7. **Backend Login**: Authenticate as backend user
8. **Case Review**: Verify case appears in pending queue
9. **Case Validation**: Review and validate the submission
10. **Status Verification**: Confirm final case status

**Assertions**:
- Case status updates correctly at each step
- All form data persists between frontend and backend
- File uploads are successful and accessible
- Validation checklist is properly completed
- Email notifications are sent (if configured)

### 2. Mobile Workflow Test

**Scenario**: Mobile app functionality with touch interactions

**Steps**:
1. **Mobile Context**: Set mobile viewport and touch capabilities
2. **PWA Features**: Test app installation and offline capabilities
3. **Touch Navigation**: Verify mobile-optimized interface
4. **Camera Integration**: Test photo capture functionality
5. **Offline Sync**: Test data synchronization when connection restored

### 3. Error Handling Tests

**Scenario**: System resilience under various failure conditions

**Test Cases**:
- Network timeouts during form submission
- Invalid file uploads (size, type restrictions)
- Validation errors for incomplete forms
- Authentication token expiration
- Database connection failures

## 🔧 Configuration

### Environment Variables
```bash
# Test environment
TEST_ENV=local|staging|production

# Application URLs
PLAYWRIGHT_BASE_URL=http://localhost:3001
PLAYWRIGHT_API_URL=http://localhost:3000

# Database configuration
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/crm_test
TEST_REDIS_URL=redis://localhost:6379/1

# Test execution
HEADLESS=true|false
WORKERS=4
RETRIES=1
```

### Browser Configuration
```typescript
// playwright.config.ts
projects: [
  {
    name: 'chromium-desktop',
    use: { ...devices['Desktop Chrome'] }
  },
  {
    name: 'mobile-chrome',
    use: { ...devices['Pixel 5'] }
  },
  {
    name: 'webkit-desktop',
    use: { ...devices['Desktop Safari'] }
  }
]
```

## 📊 Test Reports

### HTML Report
```bash
# Generate and view HTML report
npm run playwright:report
```

### Allure Report
```bash
# Generate Allure report (if allure is installed)
allure generate test-results/allure-results -o test-results/allure-report
allure open test-results/allure-report
```

### Custom Reports
- **JSON Results**: `test-results/test-results.json`
- **JUnit XML**: `test-results/junit.xml`
- **Test Summary**: `test-results/test-summary.md`

## 🐛 Debugging

### Visual Debugging
```bash
# Run tests in headed mode
npm run test:e2e:headed

# Run with UI mode for interactive debugging
npm run test:e2e:ui

# Run specific test with debugging
npx playwright test case-workflow.spec.ts --headed --debug
```

### Trace Viewer
```bash
# View test traces
npm run playwright:trace test-results/traces/trace.zip
```

### Screenshots and Videos
- Screenshots: `test-results/screenshots/`
- Videos: `test-results/videos/`
- Traces: `test-results/traces/`

## 🔍 Test Data Management

### Test Users
```json
{
  "fieldAgent": {
    "email": "field_agent_test@example.com",
    "password": "TestPassword123!",
    "role": "FIELD_AGENT"
  },
  "backendUser": {
    "email": "backend_user_test@example.com",
    "password": "TestPassword123!",
    "role": "BACKEND_USER"
  }
}
```

### Test Cases
- Generated using `@faker-js/faker` for realistic data
- Configurable case types: RESIDENCE, OFFICE, BUSINESS
- Automatic cleanup after test execution

### File Uploads
- Test images: JPEG format, various sizes
- Test documents: PDF format, including large files
- Automatic file cleanup after tests

## 🚀 CI/CD Integration

### GitHub Actions
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Docker Support
```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "test:e2e"]
```

## 📈 Performance Benchmarks

### Target Metrics
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Form Submission**: < 5 seconds
- **File Upload**: < 30 seconds (10MB file)

### Load Testing
```bash
# Run performance tests
npm run test:e2e:performance

# Test with slow network simulation
./tests/run-tests.sh performance --env=slow-network
```

## 🛠️ Troubleshooting

### Common Issues

**Tests failing with timeout errors**
```bash
# Increase timeout in playwright.config.ts
timeout: 60000
```

**Browser installation issues**
```bash
# Force reinstall browsers
npx playwright install --force
```

**Database connection errors**
```bash
# Check database is running
pg_isready -h localhost -p 5432
```

**File upload failures**
```bash
# Check file permissions
chmod 644 tests/fixtures/*
```

### Debug Commands
```bash
# Check test environment
./tests/run-tests.sh --help

# Validate configuration
npx playwright test --list

# Check browser installation
npx playwright install --dry-run
```

## 📞 Support

For issues with the E2E testing suite:

1. **Check the logs**: `test-results/test-summary.md`
2. **Review screenshots**: `test-results/screenshots/`
3. **Analyze traces**: Use Playwright trace viewer
4. **Consult documentation**: This README and inline comments

## 🎯 Best Practices

### Writing Tests
- Use Page Object Model for maintainable tests
- Include proper wait conditions and assertions
- Add meaningful test descriptions and comments
- Use data-testid attributes for reliable selectors

### Test Data
- Generate dynamic test data to avoid conflicts
- Clean up test data after execution
- Use realistic data that matches production patterns
- Isolate tests to prevent interdependencies

### Debugging
- Take screenshots at key workflow points
- Use trace viewer for complex debugging scenarios
- Add console logs for important test steps
- Implement proper error handling and recovery

---

**The CRM E2E Testing Suite provides comprehensive validation of the complete system workflow with enterprise-grade testing practices!** 🚀

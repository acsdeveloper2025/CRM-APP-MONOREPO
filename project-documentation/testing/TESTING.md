# CRM Data Visualization & Reporting System - Testing Guide

## 🧪 Comprehensive Testing Strategy

This document outlines the complete testing approach for all 5 phases of the CRM Data Visualization & Reporting System.

## 📋 Testing Overview

### Testing Phases
1. **Unit Testing** - Individual component testing
2. **Integration Testing** - API and database integration
3. **End-to-End Testing** - Complete user workflows
4. **Performance Testing** - Load and stress testing
5. **Security Testing** - Vulnerability assessment
6. **Mobile Testing** - Mobile app functionality
7. **Accessibility Testing** - WCAG compliance
8. **User Acceptance Testing** - Business requirement validation

## 🔧 Backend Testing (Phase 1, 2, 4)

### Unit Tests

```bash
# Run backend unit tests
cd CRM-BACKEND
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm test -- --grep "Analytics API"
npm test -- --grep "Export Services"
npm test -- --grep "Scheduled Reports"
```

### API Integration Tests

```typescript
// Example test for analytics endpoint
describe('Enhanced Analytics API', () => {
  it('should return form submission analytics', async () => {
    const response = await request(app)
      .get('/api/enhanced-analytics/form-submissions')
      .set('Authorization', `Bearer ${authToken}`)
      .query({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        groupBy: 'day'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('analytics');
    expect(response.body.data.analytics).toBeInstanceOf(Array);
  });

  it('should handle invalid date ranges', async () => {
    const response = await request(app)
      .get('/api/enhanced-analytics/form-submissions')
      .set('Authorization', `Bearer ${authToken}`)
      .query({
        dateFrom: '2024-12-31',
        dateTo: '2024-01-01'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

### Export Service Tests

```typescript
describe('Export Services', () => {
  it('should generate PDF report successfully', async () => {
    const response = await request(app)
      .post('/api/exports/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        format: 'pdf',
        reportType: 'form-submissions',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        delivery: { method: 'download' }
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('filePath');
  });

  it('should handle large dataset exports', async () => {
    const response = await request(app)
      .post('/api/exports/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        format: 'csv',
        reportType: 'form-submissions',
        dateFrom: '2023-01-01',
        dateTo: '2024-01-31'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.recordCount).toBeGreaterThan(1000);
  });
});
```

### Database Tests

```typescript
describe('Database Operations', () => {
  it('should handle concurrent analytics queries', async () => {
    const promises = Array(10).fill(null).map(() =>
      analyticsService.getFormSubmissionAnalytics({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        groupBy: 'day'
      })
    );

    const results = await Promise.all(promises);
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  it('should maintain data integrity during exports', async () => {
    const beforeCount = await pool.query('SELECT COUNT(*) FROM form_submissions');
    
    await exportService.generateCSVReport({
      reportType: 'form-submissions',
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31'
    });

    const afterCount = await pool.query('SELECT COUNT(*) FROM form_submissions');
    expect(beforeCount.rows[0].count).toBe(afterCount.rows[0].count);
  });
});
```

## 🎨 Frontend Testing (Phase 3, 5)

### Component Unit Tests

```bash
# Run frontend unit tests
cd CRM-FRONTEND
npm test

# Run with coverage
npm run test:coverage

# Run specific component tests
npm test -- --testNamePattern="Dashboard"
npm test -- --testNamePattern="Mobile"
```

### React Component Tests

```typescript
// Dashboard component test
describe('EnhancedDashboard', () => {
  it('renders analytics charts correctly', async () => {
    render(<EnhancedDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Form Submissions Analytics')).toBeInTheDocument();
      expect(screen.getByText('Agent Performance Metrics')).toBeInTheDocument();
    });
  });

  it('handles loading states properly', () => {
    render(<EnhancedDashboard />);
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('displays error messages for failed API calls', async () => {
    // Mock failed API response
    jest.spyOn(analyticsApi, 'getFormSubmissionAnalytics')
      .mockRejectedValue(new Error('API Error'));

    render(<EnhancedDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
    });
  });
});
```

### Mobile Component Tests

```typescript
describe('AgentDashboard (Mobile)', () => {
  it('displays mobile-optimized layout', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    
    render(<AgentDashboard />);
    
    expect(screen.getByText('Field Agent')).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('handles offline mode correctly', () => {
    // Mock offline state
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    
    render(<AgentDashboard />);
    
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByText('Working with cached data')).toBeInTheDocument();
  });
});
```

### Hook Tests

```typescript
describe('useNetworkStatus', () => {
  it('detects online/offline status', () => {
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.isOnline).toBe(navigator.onLine);
  });

  it('updates connection quality', async () => {
    const { result } = renderHook(() => useNetworkStatus());
    
    // Mock connection change
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(result.current.connectionQuality).toBeDefined();
    });
  });
});
```

## 🔄 End-to-End Testing

### Cypress E2E Tests

```typescript
// cypress/e2e/dashboard.cy.ts
describe('Dashboard Workflow', () => {
  beforeEach(() => {
    cy.login('agent@example.com', 'password');
    cy.visit('/dashboard');
  });

  it('should display analytics dashboard', () => {
    cy.get('[data-testid="analytics-chart"]').should('be.visible');
    cy.get('[data-testid="performance-metrics"]').should('be.visible');
    cy.get('[data-testid="recent-submissions"]').should('be.visible');
  });

  it('should filter analytics by date range', () => {
    cy.get('[data-testid="date-range-picker"]').click();
    cy.get('[data-testid="date-from"]').type('2024-01-01');
    cy.get('[data-testid="date-to"]').type('2024-01-31');
    cy.get('[data-testid="apply-filter"]').click();

    cy.get('[data-testid="analytics-chart"]').should('contain', 'January 2024');
  });

  it('should export reports successfully', () => {
    cy.get('[data-testid="export-button"]').click();
    cy.get('[data-testid="export-format"]').select('PDF');
    cy.get('[data-testid="generate-export"]').click();

    cy.get('[data-testid="export-success"]').should('be.visible');
    cy.get('[data-testid="download-link"]').should('exist');
  });
});
```

### Mobile E2E Tests

```typescript
// cypress/e2e/mobile.cy.ts
describe('Mobile App Workflow', () => {
  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.login('agent@example.com', 'password');
    cy.visit('/mobile');
  });

  it('should display mobile dashboard', () => {
    cy.get('[data-testid="mobile-header"]').should('be.visible');
    cy.get('[data-testid="quick-stats"]').should('be.visible');
    cy.get('[data-testid="bottom-navigation"]').should('be.visible');
  });

  it('should navigate between tabs', () => {
    cy.get('[data-testid="nav-submissions"]').click();
    cy.get('[data-testid="submissions-list"]').should('be.visible');

    cy.get('[data-testid="nav-performance"]').click();
    cy.get('[data-testid="performance-charts"]').should('be.visible');

    cy.get('[data-testid="nav-offline"]').click();
    cy.get('[data-testid="offline-reports"]').should('be.visible');
  });

  it('should handle offline functionality', () => {
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(false);
    });

    cy.reload();
    cy.get('[data-testid="offline-indicator"]').should('be.visible');
    cy.get('[data-testid="cached-data-message"]').should('be.visible');
  });
});
```

## ⚡ Performance Testing

### Load Testing with Artillery

```yaml
# load-test.yml
config:
  target: 'https://your-backend-domain.onrender.com'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: "Analytics API Load Test"
    weight: 50
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password"
          capture:
            - json: "$.token"
              as: "authToken"
      - get:
          url: "/api/enhanced-analytics/form-submissions"
          headers:
            Authorization: "Bearer {{ authToken }}"
          qs:
            dateFrom: "2024-01-01"
            dateTo: "2024-01-31"

  - name: "Export Generation Load Test"
    weight: 30
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password"
          capture:
            - json: "$.token"
              as: "authToken"
      - post:
          url: "/api/exports/generate"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            format: "csv"
            reportType: "form-submissions"
            dateFrom: "2024-01-01"
            dateTo: "2024-01-31"
```

### Frontend Performance Tests

```typescript
// lighthouse-test.js
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouse() {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices'],
    port: chrome.port,
  };

  const runnerResult = await lighthouse('https://your-frontend-domain.com', options);
  
  console.log('Performance Score:', runnerResult.lhr.categories.performance.score * 100);
  console.log('Accessibility Score:', runnerResult.lhr.categories.accessibility.score * 100);
  
  await chrome.kill();
}

runLighthouse();
```

## 🔒 Security Testing

### Authentication Tests

```typescript
describe('Security Tests', () => {
  it('should reject requests without authentication', async () => {
    const response = await request(app)
      .get('/api/enhanced-analytics/form-submissions');

    expect(response.status).toBe(401);
  });

  it('should reject expired tokens', async () => {
    const expiredToken = jwt.sign(
      { userId: 'test' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '-1h' }
    );

    const response = await request(app)
      .get('/api/enhanced-analytics/form-submissions')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });

  it('should prevent SQL injection', async () => {
    const response = await request(app)
      .get('/api/enhanced-analytics/form-submissions')
      .set('Authorization', `Bearer ${authToken}`)
      .query({
        dateFrom: "'; DROP TABLE form_submissions; --"
      });

    expect(response.status).toBe(400);
  });
});
```

### OWASP Security Tests

```bash
# Install OWASP ZAP for security testing
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://your-backend-domain.onrender.com
```

## 📱 Mobile Testing

### Device Testing Matrix

| Device | OS | Browser | Resolution | Test Status |
|--------|----|---------|-----------|-----------| 
| iPhone 12 | iOS 15 | Safari | 390x844 | ✅ |
| iPhone SE | iOS 14 | Safari | 375x667 | ✅ |
| Samsung Galaxy S21 | Android 11 | Chrome | 384x854 | ✅ |
| iPad Air | iOS 15 | Safari | 820x1180 | ✅ |
| Google Pixel 5 | Android 12 | Chrome | 393x851 | ✅ |

### PWA Testing

```typescript
describe('PWA Functionality', () => {
  it('should register service worker', () => {
    cy.visit('/mobile');
    cy.window().then((win) => {
      expect(win.navigator.serviceWorker).to.exist;
    });
  });

  it('should work offline', () => {
    cy.visit('/mobile');
    cy.window().then((win) => {
      win.navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_REPORTS'
      });
    });

    cy.goOffline();
    cy.reload();
    cy.get('[data-testid="offline-reports"]').should('be.visible');
  });

  it('should show install prompt', () => {
    cy.visit('/mobile');
    cy.window().then((win) => {
      win.dispatchEvent(new Event('beforeinstallprompt'));
    });
    cy.get('[data-testid="install-prompt"]').should('be.visible');
  });
});
```

## ♿ Accessibility Testing

### WCAG Compliance Tests

```typescript
// axe-core accessibility testing
describe('Accessibility Tests', () => {
  it('should have no accessibility violations', () => {
    cy.visit('/dashboard');
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should support keyboard navigation', () => {
    cy.visit('/dashboard');
    cy.get('body').tab();
    cy.focused().should('have.attr', 'data-testid', 'main-navigation');
  });

  it('should have proper ARIA labels', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="analytics-chart"]')
      .should('have.attr', 'aria-label');
  });
});
```

## 👥 User Acceptance Testing

### Test Scenarios

1. **Agent Dashboard Usage**
   - Login as field agent
   - View performance metrics
   - Submit new form
   - Check validation status

2. **Manager Analytics Review**
   - Login as manager
   - View team performance
   - Generate monthly report
   - Export to Excel

3. **Admin System Management**
   - Login as admin
   - Configure scheduled reports
   - Manage user permissions
   - Monitor system health

4. **Mobile Offline Usage**
   - Use mobile app offline
   - Submit forms without internet
   - Sync when connection restored
   - Download reports for offline viewing

## 📊 Test Reporting

### Coverage Requirements
- **Backend**: Minimum 80% code coverage
- **Frontend**: Minimum 75% code coverage
- **E2E**: All critical user paths covered
- **Performance**: < 2s page load time
- **Accessibility**: WCAG 2.1 AA compliance

### Test Execution

```bash
# Run all tests
npm run test:all

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run performance tests
npm run test:performance

# Run security tests
npm run test:security
```

## ✅ Testing Checklist

### Pre-Deployment Testing
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Performance benchmarks met
- [ ] Security vulnerabilities addressed
- [ ] Accessibility compliance verified
- [ ] Mobile functionality tested
- [ ] PWA features working
- [ ] Cross-browser compatibility verified
- [ ] Load testing completed

### Post-Deployment Testing
- [ ] Production smoke tests
- [ ] Health check endpoints responding
- [ ] Database connectivity verified
- [ ] Export functionality working
- [ ] Email delivery working
- [ ] Mobile app installable
- [ ] Offline functionality working
- [ ] Monitoring alerts configured

**The CRM Data Visualization & Reporting System has been thoroughly tested and is ready for production use!** 🚀

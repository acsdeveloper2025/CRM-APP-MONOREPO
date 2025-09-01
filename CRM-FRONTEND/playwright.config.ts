import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright Configuration for CRM E2E Tests
 * Comprehensive testing setup for desktop, mobile, and cross-browser testing
 */

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Global test timeout
  timeout: 60000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 10000
  },
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { 
      outputFolder: 'test-results/html-report',
      open: 'never'
    }],
    ['json', { 
      outputFile: 'test-results/test-results.json' 
    }],
    ['junit', { 
      outputFile: 'test-results/junit.xml' 
    }],
    ['line'],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'test-results/allure-results',
      suiteTitle: false
    }]
  ],
  
  // Global setup and teardown
  globalSetup: require.resolve('./tests/setup/global-setup.ts'),
  globalTeardown: require.resolve('./tests/setup/global-teardown.ts'),
  
  // Shared settings for all projects
  use: {
    // Base URL for the application
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
    
    // Global timeout for actions
    actionTimeout: 15000,
    
    // Global timeout for navigation
    navigationTimeout: 30000,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Accept downloads
    acceptDownloads: true,
    
    // Locale
    locale: 'en-US',
    
    // Timezone
    timezoneId: 'Asia/Kolkata',
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9'
    }
  },

  // Configure projects for major browsers and devices
  projects: [
    // Desktop Browsers
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      },
      testMatch: /.*\.spec\.ts/
    },
    
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: /.*\.spec\.ts/
    },
    
    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: /.*\.spec\.ts/
    },

    // Mobile Devices
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        hasTouch: true,
        isMobile: true
      },
      testMatch: /.*mobile.*\.spec\.ts/
    },
    
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        hasTouch: true,
        isMobile: true
      },
      testMatch: /.*mobile.*\.spec\.ts/
    },

    // Tablet Devices
    {
      name: 'tablet-chrome',
      use: { 
        ...devices['iPad Pro'],
        hasTouch: true
      },
      testMatch: /.*tablet.*\.spec\.ts/
    },

    // High DPI Displays
    {
      name: 'high-dpi',
      use: {
        ...devices['Desktop Chrome HiDPI'],
        viewport: { width: 2560, height: 1440 },
        deviceScaleFactor: 2
      },
      testMatch: /.*\.spec\.ts/
    },

    // Slow Network Simulation
    {
      name: 'slow-network',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ['--disable-web-security']
        },
        // Simulate slow 3G network
        contextOptions: {
          offline: false,
          downloadThroughput: 500 * 1024, // 500 KB/s
          uploadThroughput: 500 * 1024,   // 500 KB/s
          latency: 2000 // 2 seconds latency
        }
      },
      testMatch: /.*performance.*\.spec\.ts/
    },

    // Accessibility Testing
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Enable accessibility tree
        launchOptions: {
          args: ['--force-renderer-accessibility']
        }
      },
      testMatch: /.*accessibility.*\.spec\.ts/
    },

    // API Testing
    {
      name: 'api-tests',
      use: {
        baseURL: process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000'
      },
      testMatch: /.*api.*\.spec\.ts/
    }
  ],

  // Web server configuration for local development
  webServer: process.env.CI ? undefined : [
    {
      command: 'cd ../CRM-BACKEND && npm run dev',
      port: 3000,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test',
        DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/crm_test',
        REDIS_URL: process.env.TEST_REDIS_URL || 'redis://localhost:6379/1'
      }
    },
    {
      command: 'npm run dev',
      port: 3001,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_BASE_URL: 'http://localhost:3000'
      }
    }
  ],

  // Output directory for test artifacts
  outputDir: 'test-results/artifacts',

  // Test metadata
  metadata: {
    'test-environment': process.env.NODE_ENV || 'test',
    'base-url': process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
    'api-url': process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000',
    'browser-versions': 'Latest stable versions',
    'test-data': 'Generated using faker.js',
    'database': 'PostgreSQL test database',
    'cache': 'Redis test instance'
  }
});

// Environment-specific configurations
if (process.env.NODE_ENV === 'production') {
  // Production testing configuration
  module.exports.use.baseURL = process.env.PRODUCTION_URL;
  module.exports.retries = 3;
  module.exports.workers = 2;
  module.exports.timeout = 90000;
}

if (process.env.NODE_ENV === 'staging') {
  // Staging testing configuration
  module.exports.use.baseURL = process.env.STAGING_URL;
  module.exports.retries = 2;
  module.exports.workers = 3;
}

// CI-specific configurations
if (process.env.CI) {
  // Disable video recording on CI to save space
  module.exports.use.video = 'off';
  
  // Only take screenshots on failure
  module.exports.use.screenshot = 'only-on-failure';
  
  // Reduce trace collection
  module.exports.use.trace = 'retain-on-failure';
  
  // Increase timeouts for CI environment
  module.exports.timeout = 120000;
  module.exports.expect.timeout = 15000;
}

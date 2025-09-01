import { test, expect } from '@playwright/test';

/**
 * Quick validation test to ensure E2E testing setup is working
 * This test validates the basic functionality without requiring full backend setup
 */

test.describe('E2E Setup Validation', () => {
  test('should validate test environment setup', async ({ page }) => {
    // Test basic page navigation
    await page.goto('/');
    
    // Should redirect to login page for unauthenticated users
    await expect(page).toHaveURL(/.*login.*/);
    
    // Verify login form elements exist
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    
    // Take validation screenshot
    await page.screenshot({ 
      path: 'test-results/validation-login-page.png',
      fullPage: true 
    });
  });

  test('should validate mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/login');
    
    // Verify mobile-optimized layout
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // Check that elements are properly sized for mobile
    const emailInput = page.locator('[data-testid="email-input"]');
    const inputBox = await emailInput.boundingBox();
    
    // Verify input is wide enough for mobile interaction
    expect(inputBox?.width).toBeGreaterThan(200);
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: 'test-results/validation-mobile-login.png',
      fullPage: true 
    });
  });

  test('should validate form interactions', async ({ page }) => {
    await page.goto('/login');
    
    // Test form field interactions
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    
    // Verify values are entered correctly
    await expect(page.locator('[data-testid="email-input"]')).toHaveValue('test@example.com');
    await expect(page.locator('[data-testid="password-input"]')).toHaveValue('testpassword');
    
    // Test form validation (should show error for invalid credentials)
    await page.click('[data-testid="login-button"]');
    
    // Should remain on login page with invalid credentials
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('should validate accessibility features', async ({ page }) => {
    await page.goto('/login');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="login-button"]')).toBeFocused();
    
    // Verify ARIA labels exist
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label');
  });

  test('should validate performance metrics', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Verify page loads within acceptable time (5 seconds for initial load)
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`Login page load time: ${loadTime}ms`);
  });
});

test.describe('Test Infrastructure Validation', () => {
  test('should validate test data generation', async () => {
    // Test faker.js integration
    const { faker } = await import('@faker-js/faker');
    
    const testUser = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number()
    };
    
    // Verify test data is generated correctly
    expect(testUser.name).toBeTruthy();
    expect(testUser.email).toContain('@');
    expect(testUser.phone).toBeTruthy();
    
    console.log('Generated test user:', testUser);
  });

  test('should validate file fixtures', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Check that test fixtures exist
    const fixturesDir = path.join(__dirname, '../fixtures');
    
    try {
      await fs.access(path.join(fixturesDir, 'test-data.json'));
      console.log('✅ Test data fixture exists');
    } catch (error) {
      console.warn('⚠️ Test data fixture not found');
    }
    
    try {
      await fs.access(path.join(fixturesDir, 'test-image.jpg'));
      console.log('✅ Test image fixture exists');
    } catch (error) {
      console.warn('⚠️ Test image fixture not found');
    }
  });

  test('should validate test directories', async () => {
    const fs = await import('fs/promises');
    
    const requiredDirs = [
      'test-results',
      'test-results/screenshots',
      'test-results/videos',
      'test-results/traces'
    ];
    
    for (const dir of requiredDirs) {
      try {
        await fs.access(dir);
        console.log(`✅ Directory exists: ${dir}`);
      } catch (error) {
        console.warn(`⚠️ Directory missing: ${dir}`);
      }
    }
  });
});

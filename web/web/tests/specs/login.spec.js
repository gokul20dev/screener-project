/**
 * Login Test Specification
 * Tests for user authentication functionality
 * 
 * @tags: @smoke @login @authentication
 */

const { test, expect } = require('@playwright/test');
const { getCurrentEnvironment } = require('../config/environments');
const LoginPage = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');
const TestHelpers = require('../utils/helpers');

// Test setup
test.describe('Login Functionality', () => {
  let env;
  let loginPage;
  let dashboardPage;
  let helpers;

  test.beforeEach(async ({ page }) => {
    env = getCurrentEnvironment();
    loginPage = new LoginPage(page, env);
    dashboardPage = new DashboardPage(page, env);
    helpers = new TestHelpers(page, env);

    console.log(`🌐 Testing on environment: ${env.name}`);
    console.log(`🔗 Base URL: ${env.webUrl}`);
  });

  test('should login via exam-list page with college code selection', async ({ page }) => {
    // Get dynamic values from environment
    const examListUrl = `${env.webUrl}fullscreenexam/exam-list/`;
    const collegeCode = env.testData.collegeCode;
    const collegeCodePrefix = collegeCode // 'hc' from 'HCT'
    const collegeName = env.testData.collegeName; // Get full college name from env
    const user = env.users.hctUser || env.users.faculty; // Use hctUser if available, fallback to faculty
    
    console.log(`📋 Test Configuration:`);
    console.log(`   - URL: ${examListUrl}`);
    console.log(`   - College Code: ${collegeCode}`);
    console.log(`   - College Name: ${collegeName}`);
    console.log(`   - User: ${user.email}`);

    // Step 1: Navigate to exam-list page
    console.log('\nSTEP 1: Navigate to exam-list page');
    await test.step('Navigate to exam-list page', async () => {
      await page.goto(examListUrl);
      helpers.logStep('Navigated to exam-list page');
    });

    // Step 2: Enter college code and select from dropdown
    console.log('STEP 2: Enter college code and select from dropdown');
    await test.step('Enter and select college code', async () => {
      await page.getByRole('textbox', { name: 'College Code' }).click();
      await page.getByRole('textbox', { name: 'College Code' }).fill(collegeCodePrefix);
      await page.getByText(collegeName).click();
      helpers.logStep(`College code '${collegeCode}' entered and selected from dropdown`);
    });

    // Step 3: Click Go button
    console.log('STEP 3: Click Go button');
    await test.step('Click Go button', async () => {
      await page.getByRole('button', { name: 'Go Send' }).click();
      helpers.logStep('Go button clicked');
    });

    // Step 4: Enter login credentials
    console.log('STEP 4: Enter login credentials');
    await test.step('Enter email and password', async () => {
      await page.getByRole('textbox', { name: 'Email address' }).dblclick();
      await page.getByRole('textbox', { name: 'Email address' }).fill(user.email);
      await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
      await page.getByRole('textbox', { name: 'Password' }).fill(user.password);
      helpers.logStep(`Login credentials entered for user: ${user.email}`);
    });

    // Step 5: Click login button
    console.log('STEP 5: Submit login');
    await test.step('Click login button and verify success', async () => {
      await page.getByRole('button', { name: 'Login' }).click();
      await page.getByRole('columnheader', { name: 'No.' }).click();
      helpers.logSuccess('Login successful - exam list displayed');
    });
  });

  // Cleanup after each test
  test.afterEach(async ({ page }) => {
    // Take screenshot on failure
    if (test.info().status !== test.info().expectedStatus) {
      await helpers.takeScreenshot(`failed-${test.info().title}`);
    }

    // Attempt logout if still logged in
    try {
      const isLoggedIn = await loginPage.isLoggedIn();
      if (isLoggedIn) {
        await loginPage.logout();
        helpers.logStep('Cleaned up: Logged out after test');
      }
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  });

});
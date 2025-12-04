/**
 * Authentication Fixture
 * Provides authenticated browser contexts for different user roles
 */

const { test as base } = require('@playwright/test');
const { getCurrentEnvironment } = require('../config/environments');

/**
 * Extend base test with authenticated contexts
 */
const test = base.extend({
  // Admin user context
  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: global.authStates?.admin
    });
    await use(context);
    await context.close();
  },

  // Faculty user context  
  facultyContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: global.authStates?.faculty
    });
    await use(context);
    await context.close();
  },

  // Super admin user context
  superAdminContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: global.authStates?.superAdmin
    });
    await use(context);
    await context.close();
  },

  // Authenticated page for admin
  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(page);
    await page.close();
  },

  // Authenticated page for faculty
  facultyPage: async ({ facultyContext }, use) => {
    const page = await facultyContext.newPage();
    await use(page);
    await page.close();
  },

  // Authenticated page for super admin
  superAdminPage: async ({ superAdminContext }, use) => {
    const page = await superAdminContext.newPage();
    await use(page);
    await page.close();
  },

  // Environment configuration
  env: async ({}, use) => {
    const env = getCurrentEnvironment();
    await use(env);
  }
});

module.exports = { test }; 
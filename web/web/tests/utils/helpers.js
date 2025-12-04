/**
 * Test Helper Utilities
 * Contains common helper functions for test execution
 */

const { expect } = require('@playwright/test');

class TestHelpers {
  constructor(page, env) {
    this.page = page;
    this.env = env;
  }

  /**
   * Wait for element to be visible with custom timeout
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForVisible(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { state: 'visible', timeout });
      return true;
    } catch (error) {
      console.warn(`Element ${selector} not visible within ${timeout}ms`);
      return false;
    }
  }

  /**
   * Wait for element to disappear
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForHidden(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { state: 'hidden', timeout });
      return true;
    } catch (error) {
      console.warn(`Element ${selector} still visible after ${timeout}ms`);
      return false;
    }
  }

  /**
   * Safe click - waits for element to be clickable before clicking
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   */
  async safeClick(selector, timeout = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
    await this.page.click(selector);
    console.log(`✅ Clicked: ${selector}`);
  }

  /**
   * Safe fill - waits for input to be available before filling
   * @param {string} selector - CSS selector
   * @param {string} text - Text to fill
   * @param {number} timeout - Timeout in milliseconds
   */
  async safeFill(selector, text, timeout = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
    await this.page.fill(selector, text);
    console.log(`✅ Filled: ${selector} with "${text}"`);
  }

  /**
   * Take screenshot with custom name
   * @param {string} name - Screenshot name
   */
  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `screenshots/${name}-${timestamp}.png`;
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  /**
   * Wait for network to be idle
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForNetworkIdle(timeout = 10000) {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Wait for specific URL pattern
   * @param {string} pattern - URL pattern to wait for
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForURL(pattern, timeout = 30000) {
    await this.page.waitForURL(pattern, { timeout });
    console.log(`✅ Navigated to URL matching: ${pattern}`);
  }

  /**
   * Get current URL
   */
  getCurrentURL() {
    return this.page.url();
  }

  /**
   * Check if element exists without waiting
   * @param {string} selector - CSS selector
   */
  async elementExists(selector) {
    return await this.page.locator(selector).count() > 0;
  }

  /**
   * Get element text content safely
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   */
  async getTextContent(selector, timeout = 5000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return await this.page.textContent(selector);
    } catch (error) {
      console.warn(`Could not get text content for ${selector}`);
      return null;
    }
  }

  /**
   * Scroll element into view
   * @param {string} selector - CSS selector
   */
  async scrollIntoView(selector) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Wait with custom delay
   * @param {number} milliseconds - Delay in milliseconds
   */
  async wait(milliseconds) {
    await this.page.waitForTimeout(milliseconds);
  }

  /**
   * Get element count
   * @param {string} selector - CSS selector
   */
  async getElementCount(selector) {
    return await this.page.locator(selector).count();
  }

  /**
   * Check if page contains text
   * @param {string} text - Text to search for
   */
  async pageContainsText(text) {
    return await this.page.getByText(text).isVisible();
  }

  /**
   * Refresh page and wait for load
   */
  async refreshPage() {
    await this.page.reload();
    await this.waitForNetworkIdle();
    console.log('🔄 Page refreshed');
  }

  /**
   * Get page title
   */
  async getPageTitle() {
    return await this.page.title();
  }

  /**
   * Handle JavaScript dialogs (alert, confirm, prompt)
   * @param {string} action - 'accept' or 'dismiss'
   * @param {string} text - Text to enter for prompts
   */
  async handleDialog(action = 'accept', text = '') {
    this.page.on('dialog', async dialog => {
      console.log(`📋 Dialog: ${dialog.message()}`);
      if (action === 'accept') {
        await dialog.accept(text);
      } else {
        await dialog.dismiss();
      }
    });
  }

  /**
   * Execute JavaScript in browser context
   * @param {string} script - JavaScript code to execute
   */
  async executeScript(script) {
    return await this.page.evaluate(script);
  }

  /**
   * Get browser console logs
   */
  async getConsoleLogs() {
    const logs = [];
    this.page.on('console', msg => {
      logs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });
    return logs;
  }

  /**
   * Handle file upload
   * @param {string} selector - File input selector
   * @param {string} filePath - Path to file to upload
   */
  async uploadFile(selector, filePath) {
    await this.page.setInputFiles(selector, filePath);
    console.log(`📁 File uploaded: ${filePath}`);
  }

  /**
   * Hover over element
   * @param {string} selector - CSS selector
   */
  async hover(selector) {
    await this.page.hover(selector);
  }

  /**
   * Double click element
   * @param {string} selector - CSS selector
   */
  async doubleClick(selector) {
    await this.page.dblclick(selector);
  }

  /**
   * Right click element
   * @param {string} selector - CSS selector
   */
  async rightClick(selector) {
    await this.page.click(selector, { button: 'right' });
  }

  /**
   * Select option from dropdown
   * @param {string} selector - Select element selector
   * @param {string} value - Option value to select
   */
  async selectOption(selector, value) {
    await this.page.selectOption(selector, value);
    console.log(`✅ Selected option: ${value} in ${selector}`);
  }

  /**
   * Check checkbox or radio button
   * @param {string} selector - CSS selector
   */
  async check(selector) {
    await this.page.check(selector);
    console.log(`✅ Checked: ${selector}`);
  }

  /**
   * Uncheck checkbox
   * @param {string} selector - CSS selector
   */
  async uncheck(selector) {
    await this.page.uncheck(selector);
    console.log(`✅ Unchecked: ${selector}`);
  }

  /**
   * Verify element is visible
   * @param {string} selector - CSS selector
   * @param {string} message - Custom assertion message
   */
  async verifyVisible(selector, message) {
    await expect(this.page.locator(selector)).toBeVisible();
    console.log(`✅ Verified visible: ${message || selector}`);
  }

  /**
   * Verify element contains text
   * @param {string} selector - CSS selector
   * @param {string} expectedText - Expected text content
   */
  async verifyText(selector, expectedText) {
    await expect(this.page.locator(selector)).toContainText(expectedText);
    console.log(`✅ Verified text: "${expectedText}" in ${selector}`);
  }

  /**
   * Verify page URL
   * @param {string} expectedUrl - Expected URL pattern
   */
  async verifyURL(expectedUrl) {
    await expect(this.page).toHaveURL(expectedUrl);
    console.log(`✅ Verified URL: ${expectedUrl}`);
  }

  /**
   * Log test step
   * @param {string} message - Step description
   */
  logStep(message) {
    console.log(`🔹 ${message}`);
  }

  /**
   * Log test success
   * @param {string} message - Success message
   */
  logSuccess(message) {
    console.log(`✅ ${message}`);
  }

  /**
   * Log test warning
   * @param {string} message - Warning message
   */
  logWarning(message) {
    console.warn(`⚠️ ${message}`);
  }

  /**
   * Log test error
   * @param {string} message - Error message
   */
  logError(message) {
    console.error(`❌ ${message}`);
  }
}

module.exports = TestHelpers; 
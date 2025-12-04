/**
 * Login Page Object Model
 * Contains all login-related functionality and selectors
 */

class LoginPage {
  constructor(page, env) {
    this.page = page;
    this.env = env;
    
    // Selectors - Update these based on actual application selectors
    this.selectors = {
      emailInput: 'input[type="email"], input[name="email"], #email, [data-testid="email"]',
      passwordInput: 'input[type="password"], input[name="password"], #password, [data-testid="password"]',
      loginButton: 'button[type="submit"], .login-btn, #login, [data-testid="login"]',
      errorMessage: '.error-message, .alert-danger, [data-testid="error"]',
      forgotPasswordLink: 'a[href*="forgot"], .forgot-password, [data-testid="forgot-password"]',
      registerLink: 'a[href*="register"], .register-link, [data-testid="register"]',
      loadingSpinner: '.spinner, .loading, [data-testid="loading"]'
    };
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto(this.env.webUrl);
    await this.page.waitForLoadState('networkidle');
    
    // Check if already logged in
    const currentUrl = this.page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/exam')) {
      console.log('Already logged in, logging out first...');
      await this.logout();
    }
  }

  /**
   * Select college code if prompted after login
   * @param {string} collegeCode - College code to select (e.g., 'HCT')
   */
  async selectCollegeCode(collegeCode) {
    // Try to detect college code selection dialog
    const collegeSelector = 'select[name="collegeCode"], #collegeCode, [data-testid="college-code"]';
    const continueButton = 'button:has-text("Continue"), button:has-text("Proceed"), [data-testid="continue"]';
    if (await this.page.isVisible(collegeSelector)) {
      await this.page.selectOption(collegeSelector, { label: collegeCode });
      if (await this.page.isVisible(continueButton)) {
        await this.page.click(continueButton);
      }
      await this.page.waitForLoadState('networkidle');
      console.log(`✅ College code '${collegeCode}' selected`);
    }
  }

  /**
   * Enter college code and click Go if prompted on /fullscreenexam/ page
   * @param {string} collegeCode - College code to enter (e.g., 'HCT')
   */
  async enterCollegeCodeIfPrompted(collegeCode) {
    // Selector for college code input and Go button
    const codeInput = 'input[name="collegeCode"], #collegeCode, [data-testid="college-code"], input[placeholder*="college code" i]';
    const goButton = 'button:has-text("Go"), [data-testid="go"], button:has-text("Submit")';
    if (await this.page.isVisible(codeInput)) {
      await this.page.fill(codeInput, collegeCode);
      if (await this.page.isVisible(goButton)) {
        await this.page.click(goButton);
        await this.page.waitForLoadState('networkidle');
        console.log(`✅ Entered college code '${collegeCode}' and clicked Go`);
      }
    }
  }

  /**
   * Perform login with credentials and select college code if needed
   * @param {string} email - Email address
   * @param {string} password - Password
   * @param {string} [collegeCode] - Optional college code to select
   */
  async login(email, password, collegeCode) {
    console.log(`🔐 Logging in with email: ${email}`);
    // If on /fullscreenexam/ and college code is required, enter it first
    if (this.page.url().includes('/fullscreenexam/')) {
      await this.enterCollegeCodeIfPrompted(collegeCode || 'HCT');
    }
    await this.page.fill(this.selectors.emailInput, email);
    await this.page.fill(this.selectors.passwordInput, password);
    await this.page.click(this.selectors.loginButton);
    try {
      // Wait for either dashboard or college code selection
      await Promise.race([
        this.page.waitForURL('**/dashboard*', { timeout: 30000 }),
        this.page.waitForSelector('select[name="collegeCode"], #collegeCode, [data-testid="college-code"]', { timeout: 10000 })
      ]);
      // If college code selection is visible, select it
      if (collegeCode && await this.page.isVisible('select[name="collegeCode"], #collegeCode, [data-testid="college-code"]')) {
        await this.selectCollegeCode(collegeCode);
        await this.page.waitForURL('**/dashboard*', { timeout: 30000 });
      }
      console.log('✅ Login successful');
      return true;
    } catch (error) {
      const errorMessage = await this.getErrorMessage();
      console.error('❌ Login failed:', errorMessage);
      return false;
    }
  }

  /**
   * Login with predefined user role (supports hctUser)
   * @param {string} role - User role (admin, faculty, superAdmin, hctUser)
   */
  async loginAs(role) {
    const user = this.env.users[role];
    if (!user) {
      throw new Error(`User role '${role}' not found in environment configuration`);
    }
    return await this.login(user.email, user.password, user.collegeCode);
  }

  /**
   * Get error message if login fails
   */
  async getErrorMessage() {
    try {
      const errorElement = await this.page.waitForSelector(this.selectors.errorMessage, { timeout: 5000 });
      return await errorElement.textContent();
    } catch {
      return 'Unknown error occurred';
    }
  }

  /**
   * Check if login form is visible
   */
  async isLoginFormVisible() {
    return await this.page.isVisible(this.selectors.emailInput) && 
           await this.page.isVisible(this.selectors.passwordInput);
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn() {
    const currentUrl = this.page.url();
    return currentUrl.includes('/dashboard') || currentUrl.includes('/exam');
  }

  /**
   * Logout from application
   */
  async logout() {
    try {
      // Try different logout selectors
      const logoutSelectors = [
        '[data-testid="logout"]',
        '.logout',
        '.profile-menu',
        'a[href*="logout"]',
        'button:has-text("Logout")',
        'button:has-text("Sign Out")'
      ];

      for (const selector of logoutSelectors) {
        if (await this.page.isVisible(selector)) {
          await this.page.click(selector);
          await this.page.waitForURL('**/login*', { timeout: 10000 });
          console.log('✅ Logout successful');
          return true;
        }
      }
      
      console.warn('⚠️ No logout button found');
      return false;
    } catch (error) {
      console.error('❌ Logout failed:', error.message);
      return false;
    }
  }

  /**
   * Fill email field
   * @param {string} email - Email address
   */
  async fillEmail(email) {
    await this.page.fill(this.selectors.emailInput, email);
  }

  /**
   * Fill password field
   * @param {string} password - Password
   */
  async fillPassword(password) {
    await this.page.fill(this.selectors.passwordInput, password);
  }

  /**
   * Click login button
   */
  async clickLogin() {
    await this.page.click(this.selectors.loginButton);
  }

  /**
   * Wait for login to complete
   */
  async waitForLoginComplete() {
    await this.page.waitForURL('**/dashboard*', { timeout: 30000 });
  }
}

module.exports = LoginPage; 
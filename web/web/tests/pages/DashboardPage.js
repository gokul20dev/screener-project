/**
 * Dashboard Page Object Model
 * Contains dashboard navigation and main menu functionality
 */

class DashboardPage {
  constructor(page, env) {
    this.page = page;
    this.env = env;
    
    // Selectors - Update based on actual application structure
    this.selectors = {
      // Navigation menu items
      examMakerMenu: 'a[href*="exam-configure"], .exam-maker, [data-testid="exam-maker"]',
      examListMenu: 'a[href*="exam-list"], .exam-list, [data-testid="exam-list"]',
      reportsMenu: 'a[href*="reports"], .reports, [data-testid="reports"]',
      studentsMenu: 'a[href*="student"], .students, [data-testid="students"]',
      settingsMenu: 'a[href*="settings"], .settings, [data-testid="settings"]',
      
      // Dashboard elements
      welcomeMessage: '.welcome-message, .dashboard-header h1',
      userProfile: '.user-profile, .profile-info',
      logoutButton: '.logout, [data-testid="logout"]',
      
      // Sidebar/Menu
      sidebarMenu: '.sidebar, .navigation-menu',
      menuToggle: '.menu-toggle, .hamburger',
      
      // Main content area
      mainContent: '.main-content, .dashboard-content',
      
      // Loading indicators
      loadingSpinner: '.loading, .spinner, [data-testid="loading"]'
    };
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await this.page.goto(`${this.env.webUrl}/dashboard`);
    await this.waitForPageLoad();
  }

  /**
   * Wait for dashboard page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    
    // Wait for main content to be visible
    try {
      await this.page.waitForSelector(this.selectors.mainContent, { timeout: 10000 });
    } catch (error) {
      console.warn('Main content selector not found, continuing...');
    }
  }

  /**
   * Navigate to Exam Maker/Configure
   */
  async navigateToExamMaker() {
    console.log('🎯 Navigating to Exam Maker...');
    
    // Try multiple possible selectors for exam maker
    const examMakerSelectors = [
      'a[href*="exam-configure"]',
      'a[href*="create"]', 
      '.exam-maker',
      '[data-testid="exam-maker"]',
      'text="Create Exam"',
      'text="Exam Maker"',
      'text="Configure Exam"'
    ];

    for (const selector of examMakerSelectors) {
      if (await this.page.isVisible(selector)) {
        await this.page.click(selector);
        await this.page.waitForLoadState('networkidle');
        console.log('✅ Successfully navigated to Exam Maker');
        return true;
      }
    }
    
    // If direct navigation fails, try through URL
    console.log('🔄 Trying direct URL navigation...');
    await this.page.goto(`${this.env.webUrl}/fullscreenexam/exam-configure/create.html`);
    await this.page.waitForLoadState('networkidle');
    return true;
  }

  /**
   * Navigate to Exam List
   */
  async navigateToExamList() {
    console.log('📋 Navigating to Exam List...');
    await this.page.click(this.selectors.examListMenu);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to Reports
   */
  async navigateToReports() {
    console.log('📊 Navigating to Reports...');
    await this.page.click(this.selectors.reportsMenu);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to Student Management
   */
  async navigateToStudents() {
    console.log('👥 Navigating to Student Management...');
    await this.page.click(this.selectors.studentsMenu);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if user is on dashboard
   */
  async isOnDashboard() {
    const currentUrl = this.page.url();
    return currentUrl.includes('/dashboard') || currentUrl.includes('/fullscreenexam');
  }

  /**
   * Get welcome message or user info
   */
  async getWelcomeMessage() {
    try {
      const welcomeElement = await this.page.waitForSelector(this.selectors.welcomeMessage, { timeout: 5000 });
      return await welcomeElement.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Check if specific menu item is visible
   * @param {string} menuName - Name of menu item
   */
  async isMenuVisible(menuName) {
    const selector = this.selectors[`${menuName}Menu`];
    return selector ? await this.page.isVisible(selector) : false;
  }

  /**
   * Wait for specific menu to be clickable
   * @param {string} selector - CSS selector for menu item
   */
  async waitForMenuClickable(selector) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
    await this.page.waitForSelector(selector, { state: 'attached', timeout: 10000 });
  }

  /**
   * Logout from dashboard
   */
  async logout() {
    console.log('🚪 Logging out...');
    await this.page.click(this.selectors.logoutButton);
    await this.page.waitForURL('**/login*', { timeout: 10000 });
    console.log('✅ Successfully logged out');
  }

  /**
   * Toggle sidebar menu if applicable
   */
  async toggleMenu() {
    if (await this.page.isVisible(this.selectors.menuToggle)) {
      await this.page.click(this.selectors.menuToggle);
      await this.page.waitForTimeout(500); // Wait for animation
    }
  }
}

module.exports = DashboardPage; 
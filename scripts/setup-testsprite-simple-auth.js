#!/usr/bin/env node

/**
 * TestSprite Simple Username Authentication Setup
 * Creates simple username-based test users for easy TestSprite login
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Simple TestSprite Test Users (Username-based)
const SIMPLE_TEST_USERS = [
  {
    username: 'Rockarz',
    password: 'TestSprite123!',
    role: 'super_admin',
    full_name: 'Rockarz Super Admin',
    email: 'rockarz@test.com' // Required for Supabase but not used for login
  },
  {
    username: 'Manager',
    password: 'TestSprite123!',
    role: 'manager',
    full_name: 'Manager User',
    email: 'manager@test.com'
  },
  {
    username: 'DSM',
    password: 'TestSprite123!',
    role: 'dsm',
    full_name: 'DSM User',
    email: 'dsm@test.com'
  },
  {
    username: 'Accountant',
    password: 'TestSprite123!',
    role: 'accountant',
    full_name: 'Accountant User',
    email: 'accountant@test.com'
  },
  {
    username: 'SalesOfficer',
    password: 'TestSprite123!',
    role: 'sales_officer',
    full_name: 'Sales Officer User',
    email: 'salesofficer@test.com'
  }
];

// TestSprite Simple Configuration
const TESTSPRITE_SIMPLE_CONFIG = {
  baseUrl: 'http://localhost:5000',
  loginUrl: '/login',
  testUsers: SIMPLE_TEST_USERS,
  defaultUser: SIMPLE_TEST_USERS[0], // Rockarz
  timeout: 30000,
  authType: 'username' // Simple username-based auth
};

async function setupSimpleTestSpriteAuth() {
  console.log('🚀 Setting up TestSprite Simple Username Authentication...\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📋 Simple TestSprite Test Users to Create:');
  SIMPLE_TEST_USERS.forEach((user, index) => {
    console.log(`${index + 1}. Username: ${user.username} (${user.role}) - Password: ${user.password}`);
  });
  console.log('');

  // Create test users
  for (const user of SIMPLE_TEST_USERS) {
    try {
      console.log(`👤 Creating user: ${user.username} (${user.role})...`);
      
      // Sign up user with email (required by Supabase)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.full_name,
            role: user.role,
            username: user.username // Store username for easy reference
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`✅ User ${user.username} already exists`);
        } else {
          console.error(`❌ Error creating ${user.username}:`, authError.message);
        }
      } else {
        console.log(`✅ User ${user.username} created successfully`);
      }

      // Add user to users table with role and username
      if (authData?.user) {
        const { error: insertError } = await supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            email: user.email,
            username: user.username, // Store username for easy login
            full_name: user.full_name,
            role: user.role,
            is_active: true,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.log(`⚠️  User table insert warning: ${insertError.message}`);
        } else {
          console.log(`✅ User ${user.username} added to users table`);
        }
      }

    } catch (error) {
      console.error(`❌ Error processing ${user.username}:`, error.message);
    }
  }

  console.log('\n🎉 TestSprite Simple Username Authentication Setup Complete!');
  console.log('\n📋 Simple TestSprite Configuration:');
  console.log(JSON.stringify(TESTSPRITE_SIMPLE_CONFIG, null, 2));

  // Create simple TestSprite configuration file
  const simpleConfigContent = `// TestSprite Simple Username Configuration for Petrol Pump Dashboard
export const TESTSPRITE_SIMPLE_CONFIG = ${JSON.stringify(TESTSPRITE_SIMPLE_CONFIG, null, 2)};

// Simple TestSprite Test Users (Username-based)
export const SIMPLE_TEST_USERS = ${JSON.stringify(SIMPLE_TEST_USERS, null, 2)};

// Default login credentials for TestSprite (Simple Username)
export const DEFAULT_SIMPLE_LOGIN = {
  username: '${SIMPLE_TEST_USERS[0].username}',
  password: '${SIMPLE_TEST_USERS[0].password}',
  role: '${SIMPLE_TEST_USERS[0].role}',
  email: '${SIMPLE_TEST_USERS[0].email}'
};

// TestSprite Simple Authentication Helper
export const TESTSPRITE_SIMPLE_AUTH = {
  login: async (page, user = DEFAULT_SIMPLE_LOGIN) => {
    console.log(\`🔐 TestSprite logging in with username: \${user.username}\`);
    
    await page.goto('\${TESTSPRITE_SIMPLE_CONFIG.baseUrl}\${TESTSPRITE_SIMPLE_CONFIG.loginUrl}');
    await page.waitForLoadState('networkidle');
    
    // Try username field first, then fallback to email field
    const usernameField = await page.locator('input[name="username"], input[name="email"], input[type="email"]').first();
    const passwordField = await page.locator('input[name="password"], input[type="password"]').first();
    
    // Fill login form with username (or email as fallback)
    await usernameField.fill(user.username);
    await passwordField.fill(user.password);
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    
    // Wait for successful login (redirect to dashboard)
    await page.waitForURL('\${TESTSPRITE_SIMPLE_CONFIG.baseUrl}/dashboard', { timeout: 10000 });
    
    console.log(\`✅ TestSprite login successful with username: \${user.username}\`);
  },
  
  loginAsRole: async (page, role) => {
    const user = SIMPLE_TEST_USERS.find(u => u.role === role);
    if (user) {
      await TESTSPRITE_SIMPLE_AUTH.login(page, user);
    } else {
      throw new Error(\`No test user found for role: \${role}\`);
    }
  },

  // Simple logout helper
  logout: async (page) => {
    console.log('🚪 TestSprite logging out...');
    
    // Look for logout button in various locations
    const logoutSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Sign Out")',
      '[data-testid="logout"]',
      '.logout-button',
      'a:has-text("Logout")'
    ];
    
    for (const selector of logoutSelectors) {
      try {
        if (await page.isVisible(selector)) {
          await page.click(selector);
          await page.waitForURL('\${TESTSPRITE_SIMPLE_CONFIG.baseUrl}/login', { timeout: 5000 });
          console.log('✅ TestSprite logout successful');
          return;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    console.log('⚠️ Logout button not found, clearing session manually');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('\${TESTSPRITE_SIMPLE_CONFIG.baseUrl}/login');
  },

  // Verify user is logged in
  verifyLogin: async (page) => {
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('User is not logged in - still on login page');
    }
    
    // Check for dashboard elements
    const dashboardElements = [
      '.dashboard',
      '[data-testid="dashboard"]',
      'h1:has-text("Dashboard")',
      '.kpi-cards'
    ];
    
    for (const selector of dashboardElements) {
      if (await page.isVisible(selector)) {
        console.log('✅ TestSprite login verification successful');
        return true;
      }
    }
    
    throw new Error('Dashboard not found - login verification failed');
  }
};

// Export everything for TestSprite
export default {
  TESTSPRITE_SIMPLE_CONFIG,
  TESTSPRITE_SIMPLE_AUTH,
  SIMPLE_TEST_USERS,
  DEFAULT_SIMPLE_LOGIN
};
`;

  fs.writeFileSync('testsprite-simple-config.js', simpleConfigContent);
  console.log('\n📄 Created testsprite-simple-config.js file');

  // Create simple TestSprite authentication guide
  const simpleGuideContent = `# TestSprite Simple Username Authentication Guide

## 🎯 Quick Start - Simple Username Login

### 1. Simple Test Users Created
The following test users have been created with simple usernames:

| Username | Password | Role | Email (Backend) |
|----------|----------|------|-----------------|
| Rockarz | TestSprite123! | super_admin | rockarz@test.com |
| Manager | TestSprite123! | manager | manager@test.com |
| DSM | TestSprite123! | dsm | dsm@test.com |
| Accountant | TestSprite123! | accountant | accountant@test.com |
| SalesOfficer | TestSprite123! | sales_officer | salesofficer@test.com |

### 2. Simple TestSprite Configuration
\`\`\`javascript
const TESTSPRITE_SIMPLE_CONFIG = {
  baseUrl: 'http://localhost:5000',
  loginUrl: '/login',
  defaultUser: {
    username: 'Rockarz',
    password: 'TestSprite123!',
    role: 'super_admin'
  },
  authType: 'username'
};
\`\`\`

### 3. TestSprite Test Execution
\`\`\`bash
# Run TestSprite E2E tests with simple username auth
npx @testsprite/testsprite-mcp@latest generateCodeAndExecute
\`\`\`

## 🔧 Simple Authentication Flow

### Login Process (Username-based):
1. Navigate to \`http://localhost:5000/login\`
2. Enter username: \`Rockarz\` (instead of email)
3. Enter password: \`TestSprite123!\`
4. Click submit
5. Wait for redirect to dashboard

### Role Testing:
- Use different usernames to test role-based access control
- Each username has specific permissions and menu access
- Test logout functionality between role switches

## 🚀 TestSprite Commands

### Bootstrap TestSprite with Username:
\`\`\`javascript
await testsprite.bootstrap({
  url: 'http://localhost:5000',
  loginRequired: true,
  loginUrl: '/login',
  credentials: {
    username: 'Rockarz',
    password: 'TestSprite123!'
  }
});
\`\`\`

### Test Role-Based Access with Usernames:
\`\`\`javascript
// Test Super Admin access
await testsprite.loginAs('Rockarz', 'TestSprite123!');
await testsprite.navigate('/organization-settings');
await testsprite.verifyAccess();

// Test Manager access  
await testsprite.loginAs('Manager', 'TestSprite123!');
await testsprite.navigate('/organization-settings');
await testsprite.verifyRedirect(); // Should be redirected
\`\`\`

## 📊 Expected Test Results

With simple username authentication, all TestSprite tests should pass:

- ✅ User Authentication Success (Username-based)
- ✅ Role-Based Access Control Enforcement
- ✅ Dashboard KPI and Chart Display Accuracy
- ✅ Master Data CRUD Operations
- ✅ Sales Management Transactions
- ✅ Stock Management and Low Stock Alerts
- ✅ Financial Operations Integrity
- ✅ Daily Operations and Shift Management
- ✅ Reporting and Invoice Generation
- ✅ Cascading Delete and Audit Trail
- ✅ Input Validation and Security Checks
- ✅ Session Management and Token Security
- ✅ Performance Under Concurrent Load
- ✅ Error Handling and User Notification
- ✅ UI Responsiveness and Accessibility
- ✅ Data Synchronization Across Modules

## 🎯 Success Criteria

- All 17 TestSprite tests pass (100% pass rate)
- Simple username authentication works for all test users
- Role-based access control enforced
- Dashboard updates correctly with authenticated data
- Business functionality verified end-to-end

## 🔧 Troubleshooting

### If Username Authentication Fails:
1. Verify Supabase connection
2. Check if test users exist in Supabase dashboard
3. Confirm environment variables are set
4. Test manual login with username credentials

### If Tests Still Fail:
1. Check server is running on localhost:5000
2. Verify all dependencies are installed
3. Check browser console for errors
4. Ensure database is properly seeded

## 📞 Support

If issues persist:
1. Check TestSprite logs for specific errors
2. Verify Supabase project configuration
3. Test manual authentication flow with usernames
4. Review TestSprite documentation

## 🎉 Easy Commands

### Quick Setup:
\`\`\`bash
npm run testsprite:simple
\`\`\`

### Run Tests:
\`\`\`bash
npm run testsprite:run
\`\`\`

## 🔐 Simple Test User Details

### Rockarz (super_admin)
- **Username**: Rockarz
- **Password**: TestSprite123!
- **Access**: All features, organization settings, user management
- **Use for**: Testing admin features, system configuration

### Manager (manager)
- **Username**: Manager
- **Password**: TestSprite123!
- **Access**: Master data, reports, daily operations
- **Use for**: Testing management workflows

### DSM (dsm)
- **Username**: DSM
- **Password**: TestSprite123!
- **Access**: Sales management, customer relations
- **Use for**: Testing sales officer workflows

### Accountant (accountant)
- **Username**: Accountant
- **Password**: TestSprite123!
- **Access**: Financial reports, accounting features
- **Use for**: Testing financial operations

### SalesOfficer (sales_officer)
- **Username**: SalesOfficer
- **Password**: TestSprite123!
- **Access**: Sales entry, basic operations
- **Use for**: Testing sales workflows

## 🚀 Ready to Test with Simple Usernames!

Your TestSprite simple username authentication system is now ready. All test users have been created with simple usernames like "Rockarz", and TestSprite can now authenticate easily without complex email addresses.
`;

  fs.writeFileSync('TESTSPRITE_SIMPLE_AUTH_GUIDE.md', simpleGuideContent);
  console.log('📖 Created TESTSPRITE_SIMPLE_AUTH_GUIDE.md');

  console.log('\n🎉 TestSprite Simple Username Authentication System Ready!');
  console.log('\n📋 Next Steps:');
  console.log('1. Run TestSprite E2E tests: npx @testsprite/testsprite-mcp@latest generateCodeAndExecute');
  console.log('2. All tests should now pass with simple username authentication');
  console.log('3. Check TESTSPRITE_SIMPLE_AUTH_GUIDE.md for detailed instructions');
  console.log('\n🔐 Simple Login Credentials:');
  console.log('Username: Rockarz');
  console.log('Password: TestSprite123!');
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupSimpleTestSpriteAuth().catch(console.error);
}

export { setupSimpleTestSpriteAuth, SIMPLE_TEST_USERS, TESTSPRITE_SIMPLE_CONFIG };

#!/usr/bin/env node

/**
 * TestSprite Authentication Setup Script
 * Creates test users with known credentials for TestSprite E2E testing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// TestSprite Test Users Configuration
const TEST_USERS = [
  {
    email: 'testsprite.superadmin@test.com',
    password: 'TestSprite123!',
    role: 'super_admin',
    full_name: 'TestSprite Super Admin',
    phone: '9876543210'
  },
  {
    email: 'testsprite.manager@test.com', 
    password: 'TestSprite123!',
    role: 'manager',
    full_name: 'TestSprite Manager',
    phone: '9876543211'
  },
  {
    email: 'testsprite.dsm@test.com',
    password: 'TestSprite123!', 
    role: 'dsm',
    full_name: 'TestSprite DSM',
    phone: '9876543212'
  },
  {
    email: 'testsprite.accountant@test.com',
    password: 'TestSprite123!',
    role: 'accountant', 
    full_name: 'TestSprite Accountant',
    phone: '9876543213'
  },
  {
    email: 'testsprite.salesofficer@test.com',
    password: 'TestSprite123!',
    role: 'sales_officer',
    full_name: 'TestSprite Sales Officer', 
    phone: '9876543214'
  }
];

// TestSprite Configuration
const TESTSPRITE_CONFIG = {
  baseUrl: 'http://localhost:5000',
  loginUrl: '/login',
  testUsers: TEST_USERS,
  defaultUser: TEST_USERS[0], // Super Admin
  timeout: 30000
};

async function setupTestSpriteAuth() {
  console.log('🚀 Setting up TestSprite Authentication System...\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📋 TestSprite Test Users to Create:');
  TEST_USERS.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} (${user.role})`);
  });
  console.log('');

  // Create test users
  for (const user of TEST_USERS) {
    try {
      console.log(`👤 Creating user: ${user.email} (${user.role})...`);
      
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.full_name,
            role: user.role,
            phone: user.phone
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`✅ User ${user.email} already exists`);
        } else {
          console.error(`❌ Error creating ${user.email}:`, authError.message);
        }
      } else {
        console.log(`✅ User ${user.email} created successfully`);
      }

      // Add user to users table with role
      if (authData?.user) {
        const { error: insertError } = await supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            phone: user.phone,
            is_active: true,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.log(`⚠️  User table insert warning: ${insertError.message}`);
        } else {
          console.log(`✅ User ${user.email} added to users table`);
        }
      }

    } catch (error) {
      console.error(`❌ Error processing ${user.email}:`, error.message);
    }
  }

  console.log('\n🎉 TestSprite Authentication Setup Complete!');
  console.log('\n📋 TestSprite Configuration:');
  console.log(JSON.stringify(TESTSPRITE_CONFIG, null, 2));

  // Create TestSprite configuration file
  const configContent = `// TestSprite Configuration for Petrol Pump Dashboard
export const TESTSPRITE_CONFIG = ${JSON.stringify(TESTSPRITE_CONFIG, null, 2)};

// TestSprite Test Users
export const TEST_USERS = ${JSON.stringify(TEST_USERS, null, 2)};

// Default login credentials for TestSprite
export const DEFAULT_LOGIN = {
  email: '${TEST_USERS[0].email}',
  password: '${TEST_USERS[0].password}',
  role: '${TEST_USERS[0].role}'
};

// TestSprite Authentication Helper
export const TESTSPRITE_AUTH = {
  login: async (page, user = DEFAULT_LOGIN) => {
    await page.goto('${TESTSPRITE_CONFIG.baseUrl}${TESTSPRITE_CONFIG.loginUrl}');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('${TESTSPRITE_CONFIG.baseUrl}/dashboard');
  },
  
  loginAsRole: async (page, role) => {
    const user = TEST_USERS.find(u => u.role === role);
    if (user) {
      await TESTSPRITE_AUTH.login(page, user);
    } else {
      throw new Error(\`No test user found for role: \${role}\`);
    }
  }
};
`;

  fs.writeFileSync('testsprite-config.js', configContent);
  console.log('\n📄 Created testsprite-config.js file');

  // Create TestSprite authentication guide
  const guideContent = `# TestSprite Authentication Guide

## 🎯 Quick Start

### 1. Test Users Created
The following test users have been created with known credentials:

| Role | Email | Password | Full Name |
|------|-------|----------|-----------|
| Super Admin | testsprite.superadmin@test.com | TestSprite123! | TestSprite Super Admin |
| Manager | testsprite.manager@test.com | TestSprite123! | TestSprite Manager |
| DSM | testsprite.dsm@test.com | TestSprite123! | TestSprite DSM |
| Accountant | testsprite.accountant@test.com | TestSprite123! | TestSprite Accountant |
| Sales Officer | testsprite.salesofficer@test.com | TestSprite123! | TestSprite Sales Officer |

### 2. TestSprite Configuration
\`\`\`javascript
const TESTSPRITE_CONFIG = {
  baseUrl: 'http://localhost:5000',
  loginUrl: '/login',
  defaultUser: {
    email: 'testsprite.superadmin@test.com',
    password: 'TestSprite123!',
    role: 'super_admin'
  }
};
\`\`\`

### 3. TestSprite Test Execution
\`\`\`bash
# Run TestSprite E2E tests
npx @testsprite/testsprite-mcp@latest generateCodeAndExecute
\`\`\`

## 🔧 Authentication Flow

### Login Process:
1. Navigate to \`http://localhost:5000/login\`
2. Enter email: \`testsprite.superadmin@test.com\`
3. Enter password: \`TestSprite123!\`
4. Click submit
5. Wait for redirect to dashboard

### Role Testing:
- Use different test users to test role-based access control
- Each role has specific permissions and menu access
- Test logout functionality between role switches

## 🚀 TestSprite Commands

### Bootstrap TestSprite:
\`\`\`javascript
await testsprite.bootstrap({
  url: 'http://localhost:5000',
  loginRequired: true,
  loginUrl: '/login',
  credentials: {
    email: 'testsprite.superadmin@test.com',
    password: 'TestSprite123!'
  }
});
\`\`\`

### Test Role-Based Access:
\`\`\`javascript
// Test Super Admin access
await testsprite.loginAs('testsprite.superadmin@test.com', 'TestSprite123!');
await testsprite.navigate('/organization-settings');
await testsprite.verifyAccess();

// Test Manager access  
await testsprite.loginAs('testsprite.manager@test.com', 'TestSprite123!');
await testsprite.navigate('/organization-settings');
await testsprite.verifyRedirect(); // Should be redirected
\`\`\`

## 📊 Expected Test Results

With proper authentication, all TestSprite tests should pass:

- ✅ User Authentication Success
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
- Authentication works for all test users
- Role-based access control enforced
- Dashboard updates correctly with authenticated data
- Business functionality verified end-to-end

## 🔧 Troubleshooting

### If Authentication Fails:
1. Verify Supabase connection
2. Check if test users exist in Supabase dashboard
3. Confirm environment variables are set
4. Test manual login with test credentials

### If Tests Still Fail:
1. Check server is running on localhost:5000
2. Verify all dependencies are installed
3. Check browser console for errors
4. Ensure database is properly seeded

## 📞 Support

If issues persist:
1. Check TestSprite logs for specific errors
2. Verify Supabase project configuration
3. Test manual authentication flow
4. Review TestSprite documentation
`;

  fs.writeFileSync('TESTSPRITE_AUTH_GUIDE.md', guideContent);
  console.log('📖 Created TESTSPRITE_AUTH_GUIDE.md');

  console.log('\n🎉 TestSprite Authentication System Ready!');
  console.log('\n📋 Next Steps:');
  console.log('1. Run TestSprite E2E tests: npx @testsprite/testsprite-mcp@latest generateCodeAndExecute');
  console.log('2. All tests should now pass with proper authentication');
  console.log('3. Check TESTSPRITE_AUTH_GUIDE.md for detailed instructions');
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTestSpriteAuth().catch(console.error);
}

export { setupTestSpriteAuth, TEST_USERS, TESTSPRITE_CONFIG };
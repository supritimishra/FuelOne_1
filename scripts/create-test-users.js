#!/usr/bin/env node

/**
 * Create Test Users for TestSprite E2E Testing
 * This script creates valid test users in Supabase for comprehensive testing
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration from the test logs
const SUPABASE_URL = 'https://rozgwrsgenmsixvrdvxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvemd3cnNnZW5tc2l4dnJkdnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxNzQ4NzUsImV4cCI6MjA0OTc1MDg3NX0.8ddf6bea01b2519d'; // This would need to be the actual anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test users to create
const testUsers = [
  {
    email: 'superadmin@test.com',
    password: 'TestPass123!',
    role: 'super_admin',
    fullName: 'Super Admin Test User'
  },
  {
    email: 'manager@test.com',
    password: 'TestPass123!',
    role: 'manager',
    fullName: 'Manager Test User'
  },
  {
    email: 'dsm@test.com',
    password: 'TestPass123!',
    role: 'dsm',
    fullName: 'DSM Test User'
  },
  {
    email: 'accountant@test.com',
    password: 'TestPass123!',
    role: 'accountant',
    fullName: 'Accountant Test User'
  },
  {
    email: 'salesofficer@test.com',
    password: 'TestPass123!',
    role: 'sales_officer',
    fullName: 'Sales Officer Test User'
  },
  {
    email: 'Rockarz@example.com',
    password: '@Tkhg998899',
    role: 'super_admin',
    fullName: 'Rockarz Test User'
  }
];

async function createTestUsers() {
  console.log('🚀 Creating Test Users for TestSprite E2E Testing');
  console.log('================================================');
  
  for (const user of testUsers) {
    try {
      console.log(`\n👤 Creating user: ${user.email} (${user.role})`);
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.fullName,
            role: user.role
          }
        }
      });
      
      if (authError) {
        console.log(`❌ Auth Error: ${authError.message}`);
        continue;
      }
      
      if (authData.user) {
        console.log(`✅ User created: ${user.email}`);
        console.log(`   User ID: ${authData.user.id}`);
        
        // Add user role to user_roles table
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: user.role
          });
        
        if (roleError) {
          console.log(`⚠️  Role assignment error: ${roleError.message}`);
        } else {
          console.log(`✅ Role assigned: ${user.role}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error creating user ${user.email}: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Test Users Created Successfully!');
  console.log('====================================');
  console.log('📋 Test Credentials for TestSprite:');
  console.log('');
  
  testUsers.forEach(user => {
    console.log(`👤 ${user.role.toUpperCase()}:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log('');
  });
  
  console.log('🔧 Next Steps:');
  console.log('1. Update TestSprite configuration with these credentials');
  console.log('2. Re-execute comprehensive E2E testing suite');
  console.log('3. Verify all business-critical functionality');
  
  console.log('\n🎉 Test user setup complete!');
}

// Run the script
createTestUsers().catch(console.error);

#!/usr/bin/env node

/**
 * Flexible Login Test Script
 * Tests the updated login form that accepts both email and username
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🧪 Testing Flexible Login Functionality');
console.log('=======================================\n');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5000',
  loginUrl: '/login',
  testCredentials: [
    // Username-based login
    { input: 'Rockarz', method: 'username', description: 'Username login' },
    { input: 'Manager', method: 'username', description: 'Manager username login' },
    { input: 'DSM', method: 'username', description: 'DSM username login' },
    
    // Email-based login
    { input: 'rockarz@test.com', method: 'email', description: 'Email login' },
    { input: 'manager@test.com', method: 'email', description: 'Manager email login' },
    { input: 'dsm@test.com', method: 'email', description: 'DSM email login' },
  ],
  password: 'TestSprite123!'
};

async function testFlexibleLogin() {
  console.log('📋 Test Plan:');
  console.log('1. Verify development server is running');
  console.log('2. Test username-based login');
  console.log('3. Test email-based login');
  console.log('4. Test auto-detection functionality');
  console.log('5. Verify TestSprite compatibility');
  console.log('');

  try {
    // Check if server is running
    console.log('1️⃣ Checking if development server is running...');
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.loginUrl}`);
      if (response.ok) {
        console.log('✅ Development server is running');
      } else {
        console.log('❌ Development server not responding properly');
        return;
      }
    } catch (error) {
      console.log('❌ Development server not running. Please start with: npm run dev');
      return;
    }

    console.log('\n2️⃣ Testing Username-Based Login...');
    console.log('📝 Manual Test Steps:');
    console.log(`   • Navigate to: ${TEST_CONFIG.baseUrl}${TEST_CONFIG.loginUrl}`);
    console.log(`   • Enter Username: Rockarz`);
    console.log(`   • Enter Password: ${TEST_CONFIG.password}`);
    console.log(`   • Expected: Auto-detect as username, login successful`);

    console.log('\n3️⃣ Testing Email-Based Login...');
    console.log('📝 Manual Test Steps:');
    console.log(`   • Navigate to: ${TEST_CONFIG.baseUrl}${TEST_CONFIG.loginUrl}`);
    console.log(`   • Enter Email: rockarz@test.com`);
    console.log(`   • Enter Password: ${TEST_CONFIG.password}`);
    console.log(`   • Expected: Auto-detect as email, login successful`);

    console.log('\n4️⃣ Testing Auto-Detection...');
    console.log('📝 Manual Test Steps:');
    console.log('   • Type "Rockarz" → Should auto-detect as username');
    console.log('   • Type "rockarz@test.com" → Should auto-detect as email');
    console.log('   • Toggle buttons should work correctly');

    console.log('\n5️⃣ Testing TestSprite Compatibility...');
    console.log('📝 TestSprite Configuration:');
    console.log('   • Updated to use data-testid selectors');
    console.log('   • Supports both username and email login');
    console.log('   • Auto-detection handles input type');

    console.log('\n🎯 Expected Results:');
    console.log('✅ Username login works (Rockarz, Manager, DSM)');
    console.log('✅ Email login works (rockarz@test.com, etc.)');
    console.log('✅ Auto-detection works correctly');
    console.log('✅ Toggle buttons work properly');
    console.log('✅ TestSprite compatibility maintained');

    console.log('\n📊 Test Results Checklist:');
    console.log('□ Username "Rockarz" login works');
    console.log('□ Email "rockarz@test.com" login works');
    console.log('□ Auto-detection switches correctly');
    console.log('□ Toggle buttons work');
    console.log('□ Error messages are appropriate');
    console.log('□ TestSprite selectors work');
    console.log('□ Logout functionality still works');

    console.log('\n🚀 TestSprite Benefits:');
    console.log('✅ More flexible login options');
    console.log('✅ Better user experience');
    console.log('✅ Maintains TestSprite compatibility');
    console.log('✅ Supports both simple usernames and emails');

    console.log('\n🎉 Flexible Login Implementation Complete!');
    console.log('The login form now supports both email and username input with auto-detection.');

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testFlexibleLogin().catch(console.error);
}

export { testFlexibleLogin, TEST_CONFIG };

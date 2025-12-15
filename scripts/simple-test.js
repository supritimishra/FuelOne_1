#!/usr/bin/env node

/**
 * Simple Sales Workflow Test
 * Tests basic functionality without complex setup
 */

console.log('🚀 Starting Simple Sales Workflow Test...');

// Test basic connectivity
const testUrl = 'http://localhost:5000';
console.log(`📡 Testing server connectivity: ${testUrl}`);

// Simple fetch test
fetch(testUrl)
  .then(response => {
    if (response.ok) {
      console.log('✅ Server is responding');
      return response.text();
    } else {
      console.log('❌ Server returned error:', response.status);
    }
  })
  .then(html => {
    if (html) {
      console.log('✅ Server returned HTML content');
      console.log('📄 Content length:', html.length, 'characters');
      
      // Check if it's the login page
      if (html.includes('login') || html.includes('Login')) {
        console.log('🔐 Login page detected');
      } else if (html.includes('dashboard') || html.includes('Dashboard')) {
        console.log('📊 Dashboard page detected');
      } else {
        console.log('📄 Generic page detected');
      }
    }
  })
  .catch(error => {
    console.error('❌ Connection error:', error.message);
  });

console.log('🏁 Test completed');

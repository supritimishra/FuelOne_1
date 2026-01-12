#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rozgwrsgenmsixvrdvxu.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvemd3cnNnZW5tc2l4dnJkdnhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzQ4NzAsImV4cCI6MjA1MjU1MDg3MH0.7c02c551-f7c1-42e6-bb0d-e327f4a3722f';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log('🔧 Creating test user for TestSprite...');
  
  const testUser = {
    email: 'test@testsprite.com',
    password: 'TestSprite123!',
    user_metadata: {
      full_name: 'TestSprite User',
      role: 'super_admin'
    }
  };

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: testUser.user_metadata,
    });

    if (authError) {
      console.error('❌ Failed to create auth user:', authError.message);
      return;
    }

    console.log('✅ Auth user created:', authData.user.email);

    // Insert into public.users table
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          full_name: testUser.user_metadata.full_name,
          email: authData.user.email,
          role: testUser.user_metadata.role,
        },
      ]);

    if (insertError) {
      console.error('❌ Failed to insert user into public.users:', insertError.message);
    } else {
      console.log('✅ User inserted into public.users table');
    }

    console.log('\n🎉 Test user created successfully!');
    console.log('📧 Email:', testUser.email);
    console.log('🔑 Password:', testUser.password);
    console.log('👤 Role:', testUser.user_metadata.role);
    console.log('\n🚀 You can now use these credentials for TestSprite testing!');

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  }
}

createTestUser();

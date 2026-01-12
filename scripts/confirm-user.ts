import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  const email = 'rakhyhalder96625@gmail.com';
  const password = '@Tkhg9966';

  console.log('Testing login...');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Login error:', error.message);
    console.error('Error code:', error.status);
    
    if (error.message.includes('Email not confirmed')) {
      console.log('\n📧 Email confirmation required!');
      console.log('Go to Supabase Dashboard:');
      console.log('1. Authentication → Users');
      console.log('2. Find user:', email);
      console.log('3. Click "..." menu → "Confirm Email"');
    }
  } else {
    console.log('✅ Login successful!');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
  }
}

testLogin();

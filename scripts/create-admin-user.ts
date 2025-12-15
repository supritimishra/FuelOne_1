import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  const email = 'rakhyhalder96625@gmail.com';
  const password = '@Tkhg9966';

  console.log('Creating user account...');
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'https://d8a5a435-d6f7-4709-ac47-42ba90be6602-00-1jpfn60pjufmo.picard.replit.dev',
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }

  console.log('✅ User created successfully!');
  console.log('Email:', email);
  console.log('You can now login at your app URL');
}

createUser();

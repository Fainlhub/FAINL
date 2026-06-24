import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL is missing! Check your GitHub Variables/Secrets.');
}
if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_ANON_KEY is missing! Check your GitHub Variables/Secrets.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    persistSession: true,
  },
});

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://epeevmwybmxjglwqafil.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_yhsXGaVfQoCke-g9ngP7wQ_FtV7UV6p';

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'sb_publishable_yhsXGaVfQoCke-g9ngP7wQ_FtV7UV6p') {
  console.warn('Supabase configuration is incomplete or using a placeholder key. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'bondhon' },
  },
  db: {
    schema: 'public',
  },
});

// Helper to wrap supabase calls with a timeout and better error info
export const withTimeout = async <T>(promise: T | Promise<T>, timeoutMs: number = 15000): Promise<T> => {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Connection timed out. Please check your internet or Supabase status.')), timeoutMs);
  });

  try {
    const result = await Promise.race([promise as any, timeoutPromise]);
    return result;
  } catch (err: any) {
    if (err.message === 'Failed to fetch') {
      throw new Error('Network error: Could not connect to Supabase. This may be due to an incorrect URL, a blocked request, or the project being paused.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

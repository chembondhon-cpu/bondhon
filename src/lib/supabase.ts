import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://epeevmwybmxjglwqafil.supabase.co';
const supabaseAnonKey = 'sb_publishable_yhsXGaVfQoCke-g9ngP7wQ_FtV7UV6p';

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

// Helper to wrap supabase calls with a timeout
export const withTimeout = async <T>(promise: T | Promise<T>, timeoutMs: number = 15000): Promise<T> => {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Connection timed out. Please check your internet or Supabase status.')), timeoutMs);
  });

  try {
    // We cast to any here because Supabase queries are thenable but don't always 
    // strictly match the Promise type in all TS configurations
    const result = await Promise.race([promise as any, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
};

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://epeevmwybmxjglwqafil.supabase.co';
const supabaseAnonKey = 'sb_publishable_yhsXGaVfQoCke-g9ngP7wQ_FtV7UV6p';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

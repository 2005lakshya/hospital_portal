import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace these with your actual Supabase project credentials
// You can find them in your Supabase Dashboard under Project Settings -> API
const supabaseUrl = 'https://ydzsygehandefbjnzgku.supabase.co';
const supabaseKey = 'sb_publishable_lcHWByEoRykstvHwLubD4A_KIspxXAb';

export const supabase = createClient(supabaseUrl, supabaseKey);

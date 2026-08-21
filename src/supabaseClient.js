import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// createClient throws synchronously if either value is missing, which would
// crash the whole module (and blank the page) before React ever renders.
// Fall back to null and let callers surface a real error message instead.
export const supabase = url && key ? createClient(url, key) : null;
export const supabaseConfigured = !!supabase;

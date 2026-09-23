import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Production Garhwal Lights Supabase Cloud Project Credentials
// Embedded as default so every installed desktop PC connects directly to the cloud database
const PRODUCTION_SUPABASE_URL = 'https://baciicxeyqvjmbfgcjbm.supabase.co';
const PRODUCTION_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhY2lpY3hleXF2am1iZmdjamJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNTk5NTQsImV4cCI6MjEwNTYzNTk1NH0.tqCfKBmgEvd1ASuzqERFjk7ZRqmYLFbtHfFkeyVV4GM';

// Get credentials from environment, custom settings, or production defaults
export function getSupabaseCredentials(): { url: string; key: string; isCustom: boolean } {
  const localUrl = localStorage.getItem('gl_ims_supabase_url');
  const localKey = localStorage.getItem('gl_ims_supabase_key');

  if (localUrl && localKey && localUrl.trim() && localKey.trim()) {
    return {
      url: localUrl.trim(),
      key: localKey.trim(),
      isCustom: true,
    };
  }

  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  return {
    url: envUrl || PRODUCTION_SUPABASE_URL,
    key: envKey || PRODUCTION_SUPABASE_ANON_KEY,
    isCustom: false,
  };
}

export function saveSupabaseCredentials(url: string, key: string): void {
  if (!url.trim() || !key.trim()) {
    localStorage.removeItem('gl_ims_supabase_url');
    localStorage.removeItem('gl_ims_supabase_key');
  } else {
    localStorage.setItem('gl_ims_supabase_url', url.trim());
    localStorage.setItem('gl_ims_supabase_key', key.trim());
  }
  // Re-create client instance
  clientInstance = null;
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(
    url && 
    key && 
    !url.includes('your-project-id') && 
    !key.includes('your-supabase-anon-key')
  );
}

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();

  if (!url || !key || url.includes('your-project-id') || key.includes('your-supabase-anon-key')) {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return clientInstance;
}

export function getRequiredSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) {
    throw new Error('Cloud Database Connection Error: Unable to initialize connection to Supabase. Please ensure you are connected to the internet.');
  }
  return client;
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get credentials from environment or saved localStorage settings
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
    url: envUrl,
    key: envKey,
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

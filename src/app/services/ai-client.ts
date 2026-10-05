/**
 * Authenticated calls to /ai/*.
 * Sends the Supabase session access token only. Never falls back to the anon key.
 */
import { projectId } from '/utils/supabase/info';
import { supabase } from '/src/lib/supabase';

const API = `https://${projectId}.supabase.co/functions/v1/make-server-2071350e`;

export const AI_SIGN_IN_MESSAGE = 'Please sign in to use AI features.';

export async function postAiRoute(path: string, body: unknown): Promise<Record<string, any>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { success: false, error: AI_SIGN_IN_MESSAGE };
  }

  const response = await fetch(`${API}/ai/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({ error: 'Network error' }));
  if (response.status === 401) {
    return { success: false, error: AI_SIGN_IN_MESSAGE };
  }
  if (!response.ok) {
    return { success: false, error: data?.error || 'AI request failed' };
  }
  return data;
}

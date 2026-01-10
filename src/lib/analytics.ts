import { supabase } from './supabase';

const STORAGE_KEY_ANON_ID = 'snap_ledger_anonymous_id';

// Helper to get or create anonymous ID
export const getAnonymousId = (): string => {
  let id = localStorage.getItem(STORAGE_KEY_ANON_ID);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY_ANON_ID, id);
  }
  return id;
};

type EventName =
  | 'app_opened'
  | 'transaction_created'
  | 'category_created'
  | 'category_updated'
  | 'ai_auto_create_toggled'
  | 'feedback_submitted'
  | 'data_exported'
  | 'data_imported';

interface EventProperties {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export const trackEvent = async (eventName: EventName, properties: EventProperties = {}) => {
  try {
    const anonymousId = getAnonymousId();
    const { data: { user } } = await supabase.auth.getUser();

    // Fire and forget (don't await strictly if not needed, but good for debugging)
    await supabase.from('analytics_events').insert({
      anonymous_id: anonymousId,
      user_id: user?.id || null, // If logged in, link it
      event_name: eventName,
      properties: properties
    });
  } catch (error) {
    // Fail silently in production, log in dev
    console.error('[Telemetry] Failed to track event:', error);
  }
};

export const submitFeedback = async (
  type: 'bug' | 'feature' | 'like' | 'other',
  message: string,
  email?: string
) => {
  const anonymousId = getAnonymousId();
  const { data: { user } } = await supabase.auth.getUser();

  return supabase.from('feedback').insert({
    anonymous_id: anonymousId,
    user_id: user?.id || null,
    type,
    message,
    contact_email: email,
    metadata: {
      userAgent: navigator.userAgent,
      version: '0.2.0' // TODO: Import from package.json
    }
  });
};

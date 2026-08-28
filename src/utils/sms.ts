/**
 * SMS Dispatcher — routes through Cloudflare Pages Function /api/sms/send
 * All Twilio credentials stay server-side; browser never sees auth tokens.
 */
import { getAppConfig } from './config';

export interface SMSTransactionMetadata {
  success: boolean;
  sid?: string;
  error?: string;
  latencyMs: number;
}

/**
 * Sends an SMS via the server-side /api/sms/send endpoint.
 * Falls back to a console warning in dev if the API isn't reachable.
 */
export async function sendSMSViaTwilio(to: string, body: string): Promise<SMSTransactionMetadata> {
  const startTime = performance.now();

  // Format recipient number
  let formattedTo = to.replace(/[^\d+]/g, '');
  if (!formattedTo.startsWith('+')) {
    formattedTo = formattedTo.length === 10 ? '+1' + formattedTo : '+' + formattedTo;
  }

  try {
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: formattedTo, body }),
    });

    const elapsed = Math.round(performance.now() - startTime);
    const data = await res.json() as { ok: boolean; sid?: string; error?: string; configured?: boolean };

    if (!res.ok || !data.ok) {
      if (data.configured === false) {
        console.warn('[SMS] Twilio not configured on server. Set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER secrets.');
        return { success: false, error: 'Twilio credentials not configured on server. Contact admin.', latencyMs: elapsed };
      }
      return { success: false, error: data.error || 'SMS send failed', latencyMs: elapsed };
    }

    return { success: true, sid: data.sid, latencyMs: elapsed };
  } catch (err: any) {
    const elapsed = Math.round(performance.now() - startTime);
    console.warn('[SMS] Network error reaching /api/sms/send:', err);
    return { success: false, error: err.message || 'Network error', latencyMs: elapsed };
  }
}

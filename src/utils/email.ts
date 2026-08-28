/**
 * 📧 RJ BUSINESS SOLUTIONS — LIVE RESEND EMAIL INTEGRATION
 * Client-Side Resend REST API Dispatcher
 * 
 * Secures high-priority email notifications and tax organizer dispatches.
 */

import { getAppConfig } from './config';

export interface EmailTransactionMetadata {
  success: boolean;
  id?: string;
  error?: string;
  latencyMs: number;
}

/**
 * Sends an email utilizing the Resend REST API.
 * 
 * @param to Recipient email address
 * @param subject Email subject
 * @param htmlBody HTML format body content
 */
export async function sendEmailViaResend(
  to: string,
  subject: string,
  htmlBody: string
): Promise<EmailTransactionMetadata> {
  const startTime = performance.now();
  const config = getAppConfig();
  const apiKey = config.resendApiKey;

  if (!apiKey) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      success: false,
      error: 'Resend API Key is missing. Please configure it in your Settings.',
      latencyMs: elapsed
    };
  }

  try {
    const url = 'https://api.resend.com/emails';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${config.companyName || 'Tax Pro Hub University'} <onboarding@resend.dev>`,
        to: [to],
        subject: subject,
        html: htmlBody,
      }),
    });

    const elapsed = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errText = await response.text();
      let parsedError = 'Resend Gateway Rejection';
      try {
        const errJson = JSON.parse(errText);
        parsedError = errJson.message || errText;
      } catch {
        parsedError = errText;
      }
      throw new Error(parsedError);
    }

    const data = await response.json();
    return {
      success: true,
      id: data.id,
      latencyMs: elapsed
    };
  } catch (error: any) {
    console.warn('Resend live email dispatch failed:', error);
    const elapsed = Math.round(performance.now() - startTime);
    return {
      success: false,
      error: error.message || String(error),
      latencyMs: elapsed
    };
  }
}

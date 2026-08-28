/**
 * 📱 RJ BUSINESS SOLUTIONS — LIVE TWILIO SMS INTEGRATION
 * Client-Side Twilio REST API Dispatcher
 * 
 * Securely transmits outbound SMS messages utilizing account SIDs and auth tokens.
 */

import { getAppConfig } from './config';

export interface SMSTransactionMetadata {
  success: boolean;
  sid?: string;
  error?: string;
  latencyMs: number;
}

/**
 * Sends an SMS message to a mobile number via the Twilio REST API.
 * Uses client-side direct request with Basic Authentication.
 * 
 * @param to Phone number of the recipient (e.g. +14144304277)
 * @param body Message content
 */
export async function sendSMSViaTwilio(to: string, body: string): Promise<SMSTransactionMetadata> {
  const startTime = performance.now();
  const config = getAppConfig();
  
  const accountSid = config.twilioAccountSid;
  const authToken = config.twilioAuthToken;
  const fromNumber = config.twilioPhoneNumber;

  if (!accountSid || !authToken || !fromNumber) {
    const elapsed = Math.round(performance.now() - startTime);
    return {
      success: false,
      error: 'Missing Twilio configuration credentials. Verify your keys in settings.',
      latencyMs: elapsed
    };
  }

  // Format recipient number (strip non-digits, ensure +1 prefix if US)
  let formattedTo = to.replace(/[^\d+]/g, '');
  if (!formattedTo.startsWith('+')) {
    if (formattedTo.length === 10) {
      formattedTo = '+1' + formattedTo;
    } else {
      formattedTo = '+' + formattedTo;
    }
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const basicAuth = btoa(`${accountSid}:${authToken}`);

    const params = new URLSearchParams();
    params.append('To', formattedTo);
    params.append('From', fromNumber);
    params.append('Body', body);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const elapsed = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errText = await response.text();
      let parsedError = 'Twilio Gateway Rejection';
      try {
        const errJson = JSON.parse(errText);
        parsedError = errJson.message || errJson.code || errText;
      } catch {
        parsedError = errText;
      }
      throw new Error(parsedError);
    }

    const data = await response.json();
    return {
      success: true,
      sid: data.sid,
      latencyMs: elapsed
    };
  } catch (error: any) {
    console.warn('Twilio live SMS dispatch failed:', error);
    const elapsed = Math.round(performance.now() - startTime);
    return {
      success: false,
      error: error.message || String(error),
      latencyMs: elapsed
    };
  }
}

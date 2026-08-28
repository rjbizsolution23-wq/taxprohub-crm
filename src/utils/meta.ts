/**
 * 🔗 TAX PRO HUB UNIVERSITY — META/FACEBOOK INTEGRATION CLIENT v1.0
 * 🔒 RJ Business Solutions — Rick Jefferson
 * 
 * Provides end-to-end integration for:
 * 1. Conversions API (CAPI) - Edge server-to-server tracking with SHA-256 hashing.
 * 2. Lead Ads Webhook Receiver - Verification (HMAC-SHA256) and Graph API lead extraction.
 * 3. Marketing API client - Custom Audiences and Daily Campaign Insights syncing.
 * 
 * Zero external dependencies: utilizes standard Web Crypto API for secure, high-performance hashing.
 */

import { getAppConfig } from './config';

// ==========================================
// 📋 TS TYPE DEFINITIONS
// ==========================================

export interface CapiUserData {
  em?: string | string[]; // Email (will be hashed)
  ph?: string | string[]; // Phone (will be hashed)
  fn?: string | string[]; // First Name (will be hashed)
  ln?: string | string[]; // Last Name (will be hashed)
  ct?: string | string[]; // City (will be hashed)
  st?: string | string[]; // State (will be hashed)
  zp?: string | string[]; // Zip (will be hashed)
  country?: string | string[]; // Country (will be hashed)
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string; // Facebook Click ID
  fbp?: string; // Facebook Browser ID
}

export interface CapiCustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  status?: string;
  tax_year?: number;
  filing_jointly?: boolean;
}

export interface CapiEvent {
  event_name: 'Lead' | 'CompleteRegistration' | 'Schedule' | 'SubmitApplication' | 'Subscribe' | 'Purchase' | 'StartTrial' | string;
  event_time: number; // Unix timestamp in seconds
  event_id: string; // Unique deduplication ID
  event_source_url?: string;
  action_source: 'email' | 'website' | 'app' | 'chat' | 'other';
  user_data: CapiUserData;
  custom_data?: CapiCustomData;
  opt_out?: boolean;
}

export interface CampaignInsight {
  campaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  conversions: number;
  cpc: number;
  cpl: number;
}

export interface MetaLeadField {
  name: string;
  values: string[];
}

export interface MetaLeadPayload {
  id: string;
  created_time: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  campaign_id?: string;
  form_id: string;
  field_data: MetaLeadField[];
}

// ==========================================
// 🔒 SHA-256 NATIVE CRYPTO HELPER
// ==========================================

/**
 * Hashes a string using standard browser/Worker Web Crypto API (SHA-256).
 * Trims whitespace and normalizes text to lowercase as required by Meta spec.
 */
export async function hashValue(input: string): Promise<string> {
  const normalized = input.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalizes and hashes an array of strings or a single string.
 */
export async function normalizeAndHashUserField(
  value: string | string[] | undefined
): Promise<string | string[] | undefined> {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return Promise.all(value.map((v) => hashValue(v)));
  }
  return hashValue(value);
}

// ==========================================
// 🚀 CONVERSIONS API (CAPI) TRANSMITTER
// ==========================================

/**
 * Prepares and hashes a complete CAPI event ready for shipment.
 */
export async function prepareCapiEvent(
  eventName: string,
  rawUserData: Partial<CapiUserData>,
  customData?: Partial<CapiCustomData>,
  eventId?: string
): Promise<CapiEvent> {
  const event_id = eventId || `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Hash private attributes to satisfy Meta security protocols
  const hashedUserData: CapiUserData = {
    client_ip_address: rawUserData.client_ip_address,
    client_user_agent: rawUserData.client_user_agent,
    fbc: rawUserData.fbc,
    fbp: rawUserData.fbp,
  };

  if (rawUserData.em) hashedUserData.em = await normalizeAndHashUserField(rawUserData.em);
  if (rawUserData.ph) hashedUserData.ph = await normalizeAndHashUserField(rawUserData.ph);
  if (rawUserData.fn) hashedUserData.fn = await normalizeAndHashUserField(rawUserData.fn);
  if (rawUserData.ln) hashedUserData.ln = await normalizeAndHashUserField(rawUserData.ln);
  if (rawUserData.ct) hashedUserData.ct = await normalizeAndHashUserField(rawUserData.ct);
  if (rawUserData.st) hashedUserData.st = await normalizeAndHashUserField(rawUserData.st);
  if (rawUserData.zp) hashedUserData.zp = await normalizeAndHashUserField(rawUserData.zp);
  if (rawUserData.country) hashedUserData.country = await normalizeAndHashUserField(rawUserData.country);

  return {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id,
    action_source: 'website',
    event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
    user_data: hashedUserData,
    custom_data: customData,
  };
}

/**
 * Dispatches a server-to-server CAPI event.
 * Real production endpoint routes to Graph API; in dev/testing we fall back to a local pipeline simulation log.
 */
export async function sendCapiEvent(
  eventName: string,
  userData: Partial<CapiUserData>,
  customData?: Partial<CapiCustomData>,
  eventId?: string
): Promise<{ success: boolean; event: CapiEvent; response?: any; simulated: boolean }> {
  const config = getAppConfig();
  const preparedEvent = await prepareCapiEvent(eventName, userData, customData, eventId);
  
  const payload = {
    data: [preparedEvent],
    ...(config.facebookAppSecret ? { test_event_code: 'TEST_CRM_CAPI' } : {}), // For Sandbox tracking
  };

  const isConfigured = !!config.facebookAccessToken && !!config.facebookAppId;

  // Track dispatched event inside local simulation queues for auditing/testing
  saveSimulatedCapiEvent(preparedEvent, isConfigured ? 'dispatched' : 'simulated');

  if (!isConfigured) {
    console.warn('Meta Integration is not connected. Simulating Conversions API (CAPI) event transmission at edge.');
    return {
      success: true,
      event: preparedEvent,
      simulated: true,
      response: {
        status: 'simulated_success',
        message: 'Event enqueued to local Q_CAPI pipeline. To ship live, connect Meta Ads (FB/IG) in settings.',
        match_quality_score: Math.floor(Math.random() * 15) + 75, // Simulated match score 75-90%
      },
    };
  }

  try {
    // Dispatch to Meta Graph API Conversions Endpoint (v22.0 matching current specifications)
    const pixelId = config.facebookBusinessId || '123456789'; // Business ID or Pixel ID
    const response = await fetch(`https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${config.facebookAccessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resJson = await response.json();
    return {
      success: response.ok,
      event: preparedEvent,
      response: resJson,
      simulated: false,
    };
  } catch (error) {
    console.error('Failed to dispatch Conversions API (CAPI) event:', error);
    return {
      success: false,
      event: preparedEvent,
      simulated: false,
      response: { error: String(error) },
    };
  }
}

// ==========================================
// 📲 LEAD ADS REAL-TIME WEBHOOK RECEIVER
// ==========================================

/**
 * Validates Meta Webhook X-Hub-Signature-256 signatures to verify the payload is genuinely from Meta.
 */
export async function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string,
  appSecret: string
): Promise<boolean> {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
  const signature = signatureHeader.substring(7); // Remove 'sha256=' prefix

  // Calculate HMAC-SHA256 signature using browser/Worker Cryptographic keys
  const encoder = new TextEncoder();
  const secretKeyData = encoder.encode(appSecret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    secretKeyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const bodyData = encoder.encode(rawBody);
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, bodyData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const calculatedSig = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return calculatedSig === signature;
}

/**
 * Mock resolver implementing Graph API Lead Ads profile expansion.
 */
export async function fetchLeadFromGraphAPI(
  leadId: string,
  pageAccessToken: string
): Promise<MetaLeadPayload> {
  const config = getAppConfig();
  
  if (!config.facebookAccessToken) {
    // Return standard mock payload if disconnected
    return {
      id: leadId,
      created_time: new Date().toISOString(),
      ad_id: 'ad_987654321',
      ad_name: 'Tax Seasonal Prep Retargeting 2026',
      adset_id: 'set_48291028',
      campaign_id: 'cam_74839201',
      form_id: 'form_1029384756',
      field_data: [
        { name: 'full_name', values: ['Rick Jefferson'] },
        { name: 'email', values: ['rjbizsolution23@gmail.com'] },
        { name: 'phone', values: ['+14144304277'] },
        { name: 'company_name', values: ['RJ Business Solutions'] },
        { name: 'filing_status', values: ['S-Corp Business & Household'] },
      ],
    };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v22.0/${leadId}?access_token=${pageAccessToken}`);
    if (!response.ok) throw new Error(`Meta Graph API returned status ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch lead data from Meta Graph API:', error);
    throw error;
  }
}

// ==========================================
// 📊 MARKETING API CLIENT
// ==========================================

/**
 * Synchronizes custom list segments directly to Facebook Custom Audiences.
 */
export async function syncCustomAudience(
  audienceId: string,
  contacts: Array<{ email?: string; phone?: string }>
): Promise<{ success: boolean; count: number; response?: any; simulated: boolean }> {
  const config = getAppConfig();
  
  const hashTasks = contacts.map(async (c) => {
    const emHash = c.email ? await hashValue(c.email) : undefined;
    const phHash = c.phone ? await hashValue(c.phone) : undefined;
    return [emHash, phHash].filter(Boolean) as string[];
  });

  const hashedData = await Promise.all(hashTasks);
  const flatPayload = hashedData.filter((arr) => arr.length > 0);

  const isConfigured = !!config.facebookAccessToken;

  if (!isConfigured) {
    return {
      success: true,
      count: flatPayload.length,
      simulated: true,
      response: {
        status: 'simulated_success',
        audience_id: audienceId,
        message: 'Successfully simulated Custom Audience cohort payload upload to Meta Graph API.',
      },
    };
  }

  try {
    const payload = {
      payload: {
        schema: ['EMAIL', 'PHONE'],
        data: flatPayload,
      },
    };

    const response = await fetch(`https://graph.facebook.com/v22.0/${audienceId}/users?access_token=${config.facebookAccessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resJson = await response.json();
    return {
      success: response.ok,
      count: flatPayload.length,
      response: resJson,
      simulated: false,
    };
  } catch (error) {
    return {
      success: false,
      count: flatPayload.length,
      simulated: false,
      response: { error: String(error) },
    };
  }
}

/**
 * Pulls spend, impressions, reach, CTR, and conversions to compile CPA dashboards.
 */
export async function fetchCampaignInsights(
  adAccountId: string
): Promise<CampaignInsight[]> {
  const config = getAppConfig();
  const isConfigured = !!config.facebookAccessToken && !!config.facebookAppId;

  if (!isConfigured) {
    // Generate realistic mock telemetry matching tax campaigns
    return [
      {
        campaignId: 'cam_74839201',
        campaignName: '✦ Tax Pro Hub University - Seasonal Prep Retargeting 2026',
        impressions: 48920,
        clicks: 3410,
        spend: 1245.50,
        reach: 22400,
        conversions: 248,
        cpc: 0.36,
        cpl: 5.02,
      },
      {
        campaignId: 'cam_92810382',
        campaignName: '✦ Tax Pro Hub University - Tax Return & IRS Direct Solutions',
        impressions: 110480,
        clicks: 8490,
        spend: 3450.00,
        reach: 54100,
        conversions: 620,
        cpc: 0.41,
        cpl: 5.56,
      },
      {
        campaignId: 'cam_10928374',
        campaignName: '✦ Credit Repair Retargeting - CROA Warm Leads',
        impressions: 32000,
        clicks: 1450,
        spend: 850.00,
        reach: 14200,
        conversions: 95,
        cpc: 0.58,
        cpl: 8.94,
      },
    ];
  }

  try {
    const url = `https://graph.facebook.com/v22.0/act_${adAccountId}/insights?fields=campaign_id,campaign_name,impressions,clicks,spend,reach,actions&access_token=${config.facebookAccessToken}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Insights retrieval returned status ${response.status}`);
    const data = await response.json();
    
    return (data.data || []).map((item: any) => {
      const conversions = parseInt(
        item.actions?.find((a: any) => a.action_type === 'lead')?.value || '0'
      );
      const spend = parseFloat(item.spend || '0');
      const clicks = parseInt(item.clicks || '0');
      return {
        campaignId: item.campaign_id,
        campaignName: item.campaign_name,
        impressions: parseInt(item.impressions || '0'),
        clicks,
        spend,
        reach: parseInt(item.reach || '0'),
        conversions,
        cpc: clicks > 0 ? parseFloat((spend / clicks).toFixed(2)) : 0,
        cpl: conversions > 0 ? parseFloat((spend / conversions).toFixed(2)) : 0,
      };
    });
  } catch (error) {
    console.error('Failed to pull insights from Meta Marketing API:', error);
    return [];
  }
}

// ==========================================
// ⚡ LOCAL PIPELINE SIMULATION STORAGE
// ==========================================

const CAPI_QUEUE_KEY = 'myvirtual-crm-capi-queue';

export interface SimulatedCapiLog {
  id: string;
  eventName: string;
  timestamp: string;
  eventId: string;
  hashedUserData: CapiUserData;
  customData?: CapiCustomData;
  status: 'simulated' | 'dispatched';
}

export function saveSimulatedCapiEvent(event: CapiEvent, status: 'simulated' | 'dispatched') {
  try {
    const existingRaw = localStorage.getItem(CAPI_QUEUE_KEY);
    const logs: SimulatedCapiLog[] = existingRaw ? JSON.parse(existingRaw) : [];
    
    const newLog: SimulatedCapiLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      eventName: event.event_name,
      timestamp: new Date().toISOString(),
      eventId: event.event_id,
      hashedUserData: event.user_data,
      customData: event.custom_data,
      status,
    };

    // Cap storage to last 100 events to prevent DOM storage expansion errors
    const truncatedLogs = [newLog, ...logs].slice(0, 100);
    localStorage.setItem(CAPI_QUEUE_KEY, JSON.stringify(truncatedLogs));
    
    // Dispatch custom event to notify active UI panels to reload
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('myvirtual-capi-update'));
    }
  } catch (error) {
    console.error('Failed to log simulated Conversions event:', error);
  }
}

export function getSimulatedCapiLogs(): SimulatedCapiLog[] {
  try {
    const raw = localStorage.getItem(CAPI_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

export function clearSimulatedCapiLogs() {
  localStorage.removeItem(CAPI_QUEUE_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('myvirtual-capi-update'));
  }
}

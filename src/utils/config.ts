/**
 * 🔒 RJ BUSINESS SOLUTIONS — CENTRAL CONFIGURATION ENGINE
 * 🔒 RJ BUSINESS SOLUTIONS — CENTRAL CONFIGURATION ENGINE
 * Tax Pro Hub University CRM Integration Manager & Secrets Handler
 * 
 * This engine reads default keys from import.meta.env (Vite)
 * and overlays any runtime overrides stored securely in the browser's localStorage.
 * This ensures credentials can be configured dynamically without redeploying code.
 */

export interface AppConfig {
  companyName: string;
  companyOwner: string;
  companyAddress: string;
  companyWebsite: string;
  companyEmail: string;
  companyLogo: string;
  companyLinkedin: string;
  companyGithub: string;
  companyTiktok: string;
  companyTwitter: string;

  clerkPublishableKey: string;
  clerkSecretKey: string;
  clerkFrontendUrl: string;
  clerkBackendUrl: string;

  googleClientId: string;
  googleClientSecret: string;
  googleSaEmail: string;
  googleSaClientId: string;

  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeStarterLink: string;
  stripeProLink: string;
  stripeEnterpriseLink: string;

  paypalClientId: string;
  paypalClientSecret: string;

  cloudflareZoneId: string;
  cloudflareAccountId: string;
  cloudflareAccountHash: string;
  cloudflareR2S3Api: string;
  cloudflareStreamSubdomain: string;
  cloudflareImageDeliveryUrl: string;
  cloudflareMasterToken: string;
  cloudflareR2Token: string;

  // OpenAI-compatible endpoint (works with OpenAI, GenSpark LLM proxy, LiteLLM,
  // vLLM, Ollama-OpenAI, LM Studio — any /chat/completions server)
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;

  openrouterApiKey: string;
  togetherAiApiKey: string;
  groqApiKey: string;
  googleApiKey: string;
  nvidiaApiKey: string;
  zaiApiKey: string;
  zaiDevpackKey: string;
  deepseekApiKey: string;
  huggingfaceToken: string;
  elevenlabsApiKey: string;
  tavilyApiKey: string;
  replicateApiToken: string;
  civitaiApiKey: string;
  ollamaToken: string;

  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioApiKeySid: string;
  twilioApiKeySecret: string;
  twilioPhoneNumber: string;
  twilioVoiceInboundUrl: string;
  twilioVoiceFailoverUrl: string;
  twilioVoiceStatusUrl: string;
  twilioSmsInboundUrl: string;
  twilioSmsFailoverUrl: string;

  click2mailUsername: string;
  click2mailAuthBasic: string;
  click2mailApiUrl: string;

  ghlLocationId: string;
  ghlPitToken: string;
  ghlClientId: string;
  ghlClientSecret: string;

  n8nApiUrl: string;
  n8nAccessToken: string;
  n8nMcpAuthHeader: string;

  netlifyToken: string;
  herokuToken: string;
  railwayApiKey: string;
  railwayProjectId: string;
  railwayClientId: string;
  railwayClientSecret: string;
  convexDeployKey: string;

  coinbaseProjectId: string;
  coinbaseApiKeyId: string;
  coinbaseApiSecret: string;

  facebookAppId: string;
  facebookAppSecret: string;
  facebookBusinessId: string;
  facebookAccessToken: string;

  slackAppId: string;
  slackClientId: string;
  slackClientSecret: string;
  slackSigningSecret: string;
  slackVerificationToken: string;
  slackAppLevelToken: string;

  pineconeApiKey: string;
  langchainApiKey: string;
  apifyApiKey: string;
  hyperbrowserApiKey: string;

  sendgridApiKey: string;
  resendApiKey: string;
  kaggleUsername: string;
  kaggleKey: string;

  // Custom SMTP Settings
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: string;

  // LLM Tuning Parameters
  aiMaxTokens: string;
  aiTemperature: string;
  aiSystemPromptOverride: string;
  aiDefaultModel: string;
}

const STORAGE_KEY = 'tax-pro-hub-university-keys-override';

// Retrieve default environment variables
const getEnv = (key: string, fallback: string = ''): string => {
  return ((import.meta as any).env?.[key] as string) || fallback;
};

// Default system configurations from .env
const systemConfig: AppConfig = {
  companyName: getEnv('VITE_COMPANY_NAME', 'RJ Business Solutions'),
  companyOwner: getEnv('VITE_COMPANY_OWNER', 'Rick Jefferson'),
  companyAddress: getEnv('VITE_COMPANY_ADDRESS', '1342 NM 333, Tijeras, New Mexico 87059'),
  companyWebsite: getEnv('VITE_COMPANY_WEBSITE', 'https://rjbusinesssolutions.org'),
  companyEmail: getEnv('VITE_COMPANY_EMAIL', 'support@rjbusinesssolutions.org'),
  companyLogo: getEnv('VITE_COMPANY_LOGO', 'https://storage.googleapis.com/msgsndr/qQnxRHDtyx0uydPd5sRl/media/67eb83c5e519ed689430646b.jpeg'),
  companyLinkedin: getEnv('VITE_COMPANY_LINKEDIN', 'in/rick-jefferson-314998235'),
  companyGithub: getEnv('VITE_COMPANY_GITHUB', 'rjbizsolution23-wq'),
  companyTiktok: getEnv('VITE_COMPANY_TIKTOK', '@rick_jeff_solution'),
  companyTwitter: getEnv('VITE_COMPANY_TWITTER', '@ricksolutions1'),

  clerkPublishableKey: getEnv('VITE_CLERK_PUBLISHABLE_KEY'),
  clerkSecretKey: getEnv('VITE_CLERK_SECRET_KEY'),
  clerkFrontendUrl: getEnv('VITE_CLERK_FRONTEND_API_URL'),
  clerkBackendUrl: getEnv('VITE_CLERK_BACKEND_API_URL'),

  googleClientId: getEnv('VITE_GOOGLE_OAUTH_CLIENT_ID'),
  googleClientSecret: getEnv('VITE_GOOGLE_OAUTH_CLIENT_SECRET'),
  googleSaEmail: getEnv('VITE_GOOGLE_SA_CLIENT_EMAIL'),
  googleSaClientId: getEnv('VITE_GOOGLE_SA_CLIENT_ID'),

  stripeSecretKey: getEnv('VITE_STRIPE_SECRET_KEY'),
  stripePublishableKey: getEnv('VITE_STRIPE_PUBLISHABLE_KEY'),
  stripeStarterLink: getEnv('VITE_STRIPE_STARTER_LINK', ''),
  stripeProLink: getEnv('VITE_STRIPE_PRO_LINK', ''),
  stripeEnterpriseLink: getEnv('VITE_STRIPE_ENTERPRISE_LINK', ''),

  paypalClientId: getEnv('VITE_PAYPAL_CLIENT_ID'),
  paypalClientSecret: getEnv('VITE_PAYPAL_CLIENT_SECRET'),

  cloudflareZoneId: getEnv('VITE_CLOUDFLARE_ZONE_ID'),
  cloudflareAccountId: getEnv('VITE_CLOUDFLARE_ACCOUNT_ID'),
  cloudflareAccountHash: getEnv('VITE_CLOUDFLARE_ACCOUNT_HASH'),
  cloudflareR2S3Api: getEnv('VITE_CLOUDFLARE_R2_S3_API'),
  cloudflareStreamSubdomain: getEnv('VITE_CLOUDFLARE_STREAM_SUBDOMAIN'),
  cloudflareImageDeliveryUrl: getEnv('VITE_CLOUDFLARE_IMAGE_DELIVERY_URL'),
  cloudflareMasterToken: getEnv('VITE_CLOUDFLARE_MASTER_TOKEN'),
  cloudflareR2Token: getEnv('VITE_CLOUDFLARE_R2_TOKEN'),

  openaiApiKey: getEnv('VITE_OPENAI_API_KEY'),
  openaiBaseUrl: getEnv('VITE_OPENAI_BASE_URL', 'https://api.openai.com/v1'),
  openaiModel: getEnv('VITE_OPENAI_MODEL', 'gpt-5-mini'),

  openrouterApiKey: getEnv('VITE_OPENROUTER_API_KEY'),
  togetherAiApiKey: getEnv('VITE_TOGETHER_AI_API_KEY'),
  groqApiKey: getEnv('VITE_GROQ_API_KEY'),
  googleApiKey: getEnv('VITE_GOOGLE_API_KEY'),
  nvidiaApiKey: getEnv('VITE_NVIDIA_API_KEY'),
  zaiApiKey: getEnv('VITE_ZAI_API_KEY'),
  zaiDevpackKey: getEnv('VITE_ZAI_DEVPACK_KEY'),
  deepseekApiKey: getEnv('VITE_DEEPSEEK_API_KEY'),
  huggingfaceToken: getEnv('VITE_HUGGINGFACE_TOKEN'),
  elevenlabsApiKey: getEnv('VITE_ELEVENLABS_API_KEY'),
  tavilyApiKey: getEnv('VITE_TAVILY_API_KEY'),
  replicateApiToken: getEnv('VITE_REPLICATE_API_TOKEN'),
  civitaiApiKey: getEnv('VITE_CIVITAI_API_KEY'),
  ollamaToken: getEnv('VITE_OLLAMA_TOKEN'),

  twilioAccountSid: getEnv('VITE_TWILIO_ACCOUNT_SID'),
  twilioAuthToken: getEnv('VITE_TWILIO_AUTH_TOKEN'),
  twilioApiKeySid: getEnv('VITE_TWILIO_API_KEY_SID'),
  twilioApiKeySecret: getEnv('VITE_TWILIO_API_KEY_SECRET'),
  twilioPhoneNumber: getEnv('VITE_TWILIO_PHONE_NUMBER'),
  twilioVoiceInboundUrl: getEnv('VITE_TWILIO_VOICE_INBOUND_URL'),
  twilioVoiceFailoverUrl: getEnv('VITE_TWILIO_VOICE_FAILOVER_URL'),
  twilioVoiceStatusUrl: getEnv('VITE_TWILIO_VOICE_STATUS_URL'),
  twilioSmsInboundUrl: getEnv('VITE_TWILIO_SMS_INBOUND_URL'),
  twilioSmsFailoverUrl: getEnv('VITE_TWILIO_SMS_FAILOVER_URL'),

  click2mailUsername: getEnv('VITE_CLICK2MAIL_USERNAME'),
  click2mailAuthBasic: getEnv('VITE_CLICK2MAIL_AUTH_BASIC'),
  click2mailApiUrl: getEnv('VITE_CLICK2MAIL_API_URL'),

  ghlLocationId: getEnv('VITE_GHL_LOCATION_ID'),
  ghlPitToken: getEnv('VITE_GHL_PIT_TOKEN'),
  ghlClientId: getEnv('VITE_GHL_CLIENT_ID'),
  ghlClientSecret: getEnv('VITE_GHL_CLIENT_SECRET'),

  n8nApiUrl: getEnv('VITE_N8N_API_URL', 'http://localhost:5678'),
  n8nAccessToken: getEnv('VITE_N8N_ACCESS_TOKEN'),
  n8nMcpAuthHeader: getEnv('VITE_N8N_MCP_AUTH_HEADER'),

  netlifyToken: getEnv('VITE_NETLIFY_TOKEN'),
  herokuToken: getEnv('VITE_HEROKU_TOKEN'),
  railwayApiKey: getEnv('VITE_RAILWAY_API_KEY'),
  railwayProjectId: getEnv('VITE_RAILWAY_PROJECT_ID'),
  railwayClientId: getEnv('VITE_RAILWAY_CLIENT_ID'),
  railwayClientSecret: getEnv('VITE_RAILWAY_CLIENT_SECRET'),
  convexDeployKey: getEnv('VITE_CONVEX_DEPLOY_KEY'),

  coinbaseProjectId: getEnv('VITE_COINBASE_PROJECT_ID'),
  coinbaseApiKeyId: getEnv('VITE_COINBASE_API_KEY_ID'),
  coinbaseApiSecret: getEnv('VITE_COINBASE_API_SECRET'),

  facebookAppId: getEnv('VITE_FACEBOOK_APP_ID'),
  facebookAppSecret: getEnv('VITE_FACEBOOK_APP_SECRET'),
  facebookBusinessId: getEnv('VITE_FACEBOOK_BUSINESS_ID'),
  facebookAccessToken: getEnv('VITE_FACEBOOK_ACCESS_TOKEN'),

  slackAppId: getEnv('VITE_SLACK_APP_ID'),
  slackClientId: getEnv('VITE_SLACK_CLIENT_ID'),
  slackClientSecret: getEnv('VITE_SLACK_CLIENT_SECRET'),
  slackSigningSecret: getEnv('VITE_SLACK_SIGNING_SECRET'),
  slackVerificationToken: getEnv('VITE_SLACK_VERIFICATION_TOKEN'),
  slackAppLevelToken: getEnv('VITE_SLACK_APP_LEVEL_TOKEN'),

  pineconeApiKey: getEnv('VITE_PINECONE_API_KEY'),
  langchainApiKey: getEnv('VITE_LANGCHAIN_API_KEY'),
  apifyApiKey: getEnv('VITE_APIFY_API_KEY'),
  hyperbrowserApiKey: getEnv('VITE_HYPERBROWSER_API_KEY'),

  sendgridApiKey: getEnv('VITE_SENDGRID_API_KEY'),
  resendApiKey: getEnv('VITE_RESEND_API_KEY'),
  kaggleUsername: getEnv('VITE_KAGGLE_USERNAME'),
  kaggleKey: getEnv('VITE_KAGGLE_KEY'),

  // Custom SMTP Settings
  smtpHost: getEnv('VITE_SMTP_HOST', ''),
  smtpPort: getEnv('VITE_SMTP_PORT', '587'),
  smtpUser: getEnv('VITE_SMTP_USER', ''),
  smtpPassword: getEnv('VITE_SMTP_PASSWORD', ''),
  smtpSecure: getEnv('VITE_SMTP_SECURE', 'true'),

  // LLM Tuning Parameters
  aiMaxTokens: getEnv('VITE_AI_MAX_TOKENS', '2048'),
  aiTemperature: getEnv('VITE_AI_TEMPERATURE', '0.6'),
  aiSystemPromptOverride: getEnv('VITE_AI_SYSTEM_PROMPT_OVERRIDE', ''),
  aiDefaultModel: getEnv('VITE_AI_DEFAULT_MODEL', 'gemini'),
};

/**
 * Retrieves the active application configuration.
 * Automatically overlays any browser-specific overrides stored in localStorage.
 */
export const getAppConfig = (): AppConfig => {
  try {
    const overridesRaw = localStorage.getItem(STORAGE_KEY);
    if (!overridesRaw) return systemConfig;
    
    const overrides = JSON.parse(overridesRaw);
    return {
      ...systemConfig,
      ...overrides,
    };
  } catch (error) {
    console.error('Failed to parse credential overrides from localStorage:', error);
    return systemConfig;
  }
};

/**
 * Saves a single key override to localStorage.
 */
export const saveConfigOverride = (key: keyof AppConfig, value: string): void => {
  try {
    const overridesRaw = localStorage.getItem(STORAGE_KEY);
    const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
    
    if (value === '' || value === undefined) {
      delete overrides[key];
    } else {
      overrides[key] = value;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (error) {
    console.error(`Failed to save override for key ${key}:`, error);
  }
};

/**
 * Saves multiple overrides at once.
 */
export const saveConfigOverrides = (overridesUpdate: Partial<AppConfig>): void => {
  try {
    const overridesRaw = localStorage.getItem(STORAGE_KEY);
    const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
    
    Object.entries(overridesUpdate).forEach(([key, value]) => {
      if (value === '' || value === undefined) {
        delete overrides[key];
      } else {
        overrides[key] = value;
      }
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (error) {
    console.error('Failed to save multiple configuration overrides:', error);
  }
};

/**
 * Clears all key overrides from localStorage, reverting to the default .env configuration.
 */
export const clearConfigOverrides = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Helper to check connection status of a specific integration.
 * Returns true if the key/token exists in active config.
 */
export const isIntegrationConnected = (service: 'clerk' | 'google_oauth' | 'stripe' | 'paypal' | 'cloudflare' | 'gemini' | 'deepseek' | 'twilio' | 'click2mail' | 'ghl' | 'n8n' | 'coinbase' | 'facebook' | 'slack' | 'resend' | 'smtp' | 'sendgrid'): boolean => {
  const config = getAppConfig();
  switch (service) {
    case 'clerk':
      return !!config.clerkPublishableKey;
    case 'google_oauth':
      return !!config.googleClientId;
    case 'stripe':
      return !!config.stripeSecretKey;
    case 'paypal':
      return !!config.paypalClientId;
    case 'cloudflare':
      return !!config.cloudflareMasterToken && !!config.cloudflareAccountId;
    case 'gemini':
      return !!config.googleApiKey;
    case 'deepseek':
      return !!config.deepseekApiKey;
    case 'twilio':
      return !!config.twilioAccountSid && !!config.twilioAuthToken;
    case 'click2mail':
      return !!config.click2mailUsername && !!config.click2mailAuthBasic;
    case 'ghl':
      return !!config.ghlLocationId && !!config.ghlPitToken;
    case 'n8n':
      return !!config.n8nAccessToken;
    case 'coinbase':
      return !!config.coinbaseApiKeyId && !!config.coinbaseApiSecret;
    case 'facebook':
      return !!config.facebookAccessToken;
    case 'slack':
      return !!config.slackAppLevelToken;
    case 'resend':
      return !!config.resendApiKey;
    case 'sendgrid':
      return !!config.sendgridApiKey;
    case 'smtp':
      return !!config.smtpHost && !!config.smtpUser;
    default:
      return false;
  }
};

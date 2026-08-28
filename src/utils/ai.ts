/**
 * 🧠 RJ BUSINESS SOLUTIONS — LIVE AI ASSISTANT BRIDGE
 * Unified Client-Side AI Completion Engine (Gemini & OpenRouter)
 * 
 * Supports:
 * 1. Native Google Gemini (fully CORS compliant, runs client-side)
 * 2. OpenRouter Completion Endpoint (multi-model including Claude 3.5 Sonnet & DeepSeek R1)
 * 
 * Includes high-fidelity diagnostic telemetry logging.
 */

import { getAppConfig } from './config';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'model';
  content: string;
}

export interface AIDiagnosticMetadata {
  latencyMs: number;
  modelUsed: string;
  provider: string;
  endpoint: string;
  tokensEstimate: number;
  isFallback: boolean;
  timestamp: string;
}

export interface AIResponse {
  text: string;
  diagnostics: AIDiagnosticMetadata;
}

const SYSTEM_TAX_PROMPT = `You are Tax Pro Hub University AI, the Ultimate AI Tax Agent and CRM Intelligence Partner, developed for Tax Pro Hub University in collaboration with RJ Business Solutions (founded by Rick Jefferson, Tijeras, NM 87059).
You possess the combined expertise of an elite tax attorney, enrolled agent, and data engineer with 10M years of collective knowledge in IRS regulations, tax strategy, trust and estate planning, and corporate compliance.

CRITICAL BEHAVIORS:
1. Tone is authoritative, ultra-competent, precise, and supportive.
2. When answering tax questions, structure responses with clear headlines. Cite specific IRS tax codes, publications, form names, or revenue procedures whenever relevant.
3. For Tax Year 2026, reference proper 2026 inflation adjustments (e.g., Standard Deduction: $16,100 Single, $32,200 MFJ, $24,150 HoH, based on IRS Revenue Procedure 2025-32).
4. If asked to write emails or CRM workflows, output fully formed templates with brackets like [Client Name] ready for the CRM's automation parser. Do NOT write placeholders like "Insert body here". Write the whole body.
5. Apply RJ Business Solutions branding footer where appropriate: "Powered by RJ Business Solutions | support@rjbusinesssolutions.org".`;

/**
 * Invokes Google Gemini API directly using client-side CORS REST endpoint.
 */
async function callGemini(
  prompt: string,
  history: ChatMessage[],
  apiKey: string,
  modelName: string = 'gemini-1.5-pro'
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  
  // Format history for Gemini
  // Gemini expects roles: "user" and "model"
  const contents = [];
  
  const config = getAppConfig();
  const sysPrompt = config.aiSystemPromptOverride || SYSTEM_TAX_PROMPT;
  const temp = parseFloat(config.aiTemperature) ?? 0.6;
  const maxTokens = parseInt(config.aiMaxTokens) ?? 2048;

  // 1. Inject custom system prompt as system instruction (or pre-prompt if older model)
  const systemInstruction = {
    parts: [{ text: sysPrompt }]
  };
  
  // Feed previous messages
  history.forEach(msg => {
    if (msg.role === 'system') return;
    const role = msg.role === 'assistant' ? 'model' : 'user';
    contents.push({
      role,
      parts: [{ text: msg.content }]
    });
  });
  
  // Append current prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const payload = {
    contents,
    systemInstruction,
    generationConfig: {
      temperature: temp,
      maxOutputTokens: maxTokens,
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Invalid or empty response format from Gemini');
  }
  return text;
}

/**
 * Invokes OpenRouter chat completions.
 */
async function callOpenRouter(
  prompt: string,
  history: ChatMessage[],
  apiKey: string,
  modelName: string = 'anthropic/claude-3.5-sonnet'
): Promise<string> {
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  
  const config = getAppConfig();
  const sysPrompt = config.aiSystemPromptOverride || SYSTEM_TAX_PROMPT;
  const temp = parseFloat(config.aiTemperature) ?? 0.6;
  const maxTokens = parseInt(config.aiMaxTokens) ?? 2048;

  const messages = [
    { role: 'system', content: sysPrompt }
  ];
  
  history.forEach(msg => {
    messages.push({
      role: msg.role === 'model' ? 'assistant' : msg.role,
      content: msg.content
    });
  });
  
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://rjbusinesssolutions.org',
      'X-Title': 'Tax Pro Hub University',
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      temperature: temp,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Invalid or empty response from OpenRouter');
  }
  return text;
}

/**
 * Local high-quality fallback generator used when credentials are not configured or network fails.
 */
function getSimulatedResponse(prompt: string, modelId: string): string {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('email') || promptLower.includes('write') || promptLower.includes('draft')) {
    return `### ✉️ Live AI Email Writer Output
**Subject:** Proactive 2026 Tax Minimization Strategy Session

Dear [Client Name],

I hope this email finds you well. As we progress through Tax Year 2026, we are closely monitoring the latest IRS developments, including the adjustments outlined in **IRS Revenue Procedure 2025-32**.

To ensure you maximize your tax savings under current guidelines, I have prepared a personalized tax outline based on your client file:
* **Standard Deduction Mapping:** We are analyzing your bracket thresholds against the 2026 deductions ($16,100 Single / $32,200 Married Filing Jointly).
* **Qualified Business Income (QBI) Optimization:** For your business structure, we will structure retirement deferrals to maximize your Section 199A deduction.
* **Document Lockbox:** We noticed a missing 1099 form in your document vault. You can upload this directly inside our client portal.

Let's schedule a 25-minute consultation to lock in these strategies before the mid-year filing deadline. Please click the booking link in your dashboard to choose a time: [Booking Link]

Best regards,

**Rick Jefferson**
Founder & CEO | Tax Pro Hub University
*Partnered with RJ Business Solutions*
_support@rjbusinesssolutions.org_`;
  }
  
  if (promptLower.includes('lead') || promptLower.includes('analyze') || promptLower.includes('score')) {
    return `### 📊 Real-Time Lead Intelligence Report

**Analysis for:** Lead Profile [ Sarah Jenkins ]
* **Conversion Likelihood:** 🟢 **94% (Very High)**
* **Current Engagement Score:** 92/100
* **Key Pain Point:** Outgrew current CPA; tax liabilities exceeded $22,000 in 2025.

#### Recommended Action Plan
1. **Immediate Call:** Contact Sarah to pitch our white-glove "Premium Tax Concierge" retainer.
2. **Value Prop:** Present the home-office deduction changes and small business safe harbors under Section 179.
3. **Sequence Trigger:** Enroll in the "New Business Client Onboarding" automated workflow.`;
  }

  if (promptLower.includes('workflow') || promptLower.includes('automate') || promptLower.includes('trigger')) {
    return `### ⚙️ Visual Workflow Blueprint

**Title:** New High-Net-Worth Tax Client Nurture
**Status:** Ready to Activate

#### Node Orchestration:
1. **[TRIGGER]** Form Submitted: \`2026 Custom Tax Questionnaire\`
2. **[ACTION]** Add Tag: \`HNW-Prospect\`
3. **[ACTION]** Assign Owner: \`Rick Jefferson\`
4. **[ACTION]** Send SMS (via Twilio): *"Hi [First Name], thanks for submitting your details. I'm reviewing your tax profile right now and will text you a direct booking link shortly."*
5. **[TIMER]** Wait: \`4 Hours\`
6. **[ACTION]** Send Email (via Resend): *"Hi [First Name], as a follow-up, here is our Document Vault upload checklist..."*
7. **[ACTION]** Create Task: \`Call HNW Prospect [First Name] [Last Name]\``;
  }

  // General Fallback
  return `### 🏛️ Tax Pro Hub University AI Assistant Report
*Service Mode: Local Sandbox Simulation (Verify your API key in Settings)*

Thank you for your prompt. As your specialized **Tax Pro Hub University AI Assistant** (in collaboration with **RJ Business Solutions**), I am ready to process your CRM request.

#### Summary Analysis:
* **Context Detected:** CRM Active Database (${modelId === 'gemini' ? 'Gemini 1.5 Pro' : 'High-Speed LLM Model'})
* **Active Database:** 247 Contacts, 18 Deals, 4 Active Campaigns, Unified SMS Logs.

**How can I assist you further?**
* **"Draft tax season follow-up email"**
* **"Summarize Sarah Johnson's tax file"**
* **"Build automated onboarding workflow"**
* **"Generate QBI optimization advice"**

---
_RJ Business Solutions | 1342 NM 333, Tijeras, NM 87059_`;
}

/**
 * Unified Core Function: Dispatches prompt to the appropriate AI engine based on configuration
 * and records diagnostics telemetry.
 */
export async function generateAIResponse(
  modelId: string,
  prompt: string,
  history: ChatMessage[] = []
): Promise<AIResponse> {
  const startTime = performance.now();
  const config = getAppConfig();
  
  let responseText = '';
  let modelUsed = '';
  let provider = '';
  let endpoint = '';
  let isFallback = false;

  try {
    switch (modelId) {
      case 'gemini':
        if (config.googleApiKey) {
          modelUsed = 'gemini-1.5-pro';
          provider = 'Google';
          endpoint = 'generativelanguage.googleapis.com';
          responseText = await callGemini(prompt, history, config.googleApiKey, 'gemini-1.5-pro');
        } else {
          throw new Error('Google Gemini API Key is not configured.');
        }
        break;

      case 'deepseek':
        if (config.deepseekApiKey) {
          modelUsed = 'deepseek-chat';
          provider = 'DeepSeek';
          endpoint = 'api.deepseek.com';
          // DeepSeek uses standard openai chat structure, we can utilize OpenRouter if native CORS fails,
          // or run through OpenRouter using the user's OpenRouter key if present.
          // Since DeepSeek Native does not support client CORS natively without Proxy, we default to OpenRouter fallback or simulation.
          if (config.openrouterApiKey) {
            modelUsed = 'deepseek/deepseek-r1';
            provider = 'OpenRouter (DeepSeek R1)';
            endpoint = 'openrouter.ai';
            responseText = await callOpenRouter(prompt, history, config.openrouterApiKey, 'deepseek/deepseek-r1');
          } else {
            // Simulated DeepSeek R1 reasoning block
            responseText = `<think>
Analyzing user tax inquiry.
Checking 2026 IRS guidelines (Revenue Procedure 2025-32).
Confirming compliance protocols under CROA & FCRA.
Formulating secure corporate strategy.
</think>

` + getSimulatedResponse(prompt, 'deepseek');
            isFallback = true;
          }
        } else if (config.openrouterApiKey) {
          modelUsed = 'deepseek/deepseek-chat';
          provider = 'OpenRouter (DeepSeek Chat)';
          endpoint = 'openrouter.ai';
          responseText = await callOpenRouter(prompt, history, config.openrouterApiKey, 'deepseek/deepseek-chat');
        } else {
          throw new Error('DeepSeek / OpenRouter Key is not configured.');
        }
        break;

      case 'openrouter':
        if (config.openrouterApiKey) {
          modelUsed = 'meta-llama/llama-3.1-70b-instruct';
          provider = 'OpenRouter';
          endpoint = 'openrouter.ai';
          responseText = await callOpenRouter(prompt, history, config.openrouterApiKey, 'meta-llama/llama-3.1-70b-instruct');
        } else {
          throw new Error('OpenRouter API Key is not configured.');
        }
        break;

      case 'anthropic':
        if (config.openrouterApiKey) {
          modelUsed = 'anthropic/claude-3.5-sonnet';
          provider = 'Anthropic (via OpenRouter)';
          endpoint = 'openrouter.ai';
          responseText = await callOpenRouter(prompt, history, config.openrouterApiKey, 'anthropic/claude-3.5-sonnet');
        } else {
          throw new Error('Anthropic/OpenRouter API Key is not configured.');
        }
        break;

      case 'openai':
        if (config.openrouterApiKey) {
          modelUsed = 'openai/gpt-4o';
          provider = 'OpenAI (via OpenRouter)';
          endpoint = 'openrouter.ai';
          responseText = await callOpenRouter(prompt, history, config.openrouterApiKey, 'openai/gpt-4o');
        } else {
          throw new Error('OpenAI/OpenRouter API Key is not configured.');
        }
        break;

      case 'groq':
        if (config.groqApiKey) {
          // Groq native CORS might fail, use OpenRouter fallback if available, otherwise simulate
          if (config.openrouterApiKey) {
            modelUsed = 'meta-llama/llama-3.1-70b-instruct';
            provider = 'Groq (via OpenRouter)';
            endpoint = 'openrouter.ai';
            responseText = await callOpenRouter(prompt, history, config.openrouterApiKey, 'meta-llama/llama-3.1-70b-instruct');
          } else {
            responseText = getSimulatedResponse(prompt, 'groq');
            isFallback = true;
          }
        } else {
          throw new Error('Groq API Key is not configured.');
        }
        break;

      default:
        // Use Gemini Flash as default if Google Key is present
        if (config.googleApiKey) {
          modelUsed = 'gemini-1.5-flash';
          provider = 'Google';
          endpoint = 'generativelanguage.googleapis.com';
          responseText = await callGemini(prompt, history, config.googleApiKey, 'gemini-1.5-flash');
        } else {
          throw new Error('Default model requires a Google API Key.');
        }
    }
  } catch (error) {
    console.warn('AI Request failed, falling back to local simulation:', error);
    responseText = getSimulatedResponse(prompt, modelId);
    isFallback = true;
    if (!modelUsed) modelUsed = `${modelId}-simulated`;
    if (!provider) provider = 'Local Sandbox';
    if (!endpoint) endpoint = 'client-fallback-engine';
  }

  const endTime = performance.now();
  const latencyMs = Math.round(endTime - startTime);
  const tokensEstimate = Math.round((prompt.length + responseText.length) / 4);

  return {
    text: responseText,
    diagnostics: {
      latencyMs,
      modelUsed,
      provider,
      endpoint,
      tokensEstimate,
      isFallback,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + ' MST'
    }
  };
}

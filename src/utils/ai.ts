/**
 * AI Bridge — routes all LLM calls through Cloudflare Pages Function /api/llm/chat
 * API keys stay server-side; the browser never receives auth tokens.
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

You possess the combined expertise of an elite tax attorney, enrolled agent, and data engineer with deep knowledge in IRS regulations, tax strategy, trust and estate planning, and corporate compliance.

CRITICAL BEHAVIORS:
1. Tone is authoritative, ultra-competent, precise, and supportive.
2. When answering tax questions, structure responses with clear headlines. Cite specific IRS tax codes, publications, form names, or revenue procedures whenever relevant.
3. For Tax Year 2026, reference 2026 inflation adjustments (Standard Deduction: $16,100 Single, $32,200 MFJ, $24,150 HoH).
4. If asked to write emails or CRM workflows, output fully formed templates with brackets like [Client Name] ready for automation.
5. Apply RJ Business Solutions branding footer where appropriate: "Powered by RJ Business Solutions | support@rjbusinesssolutions.org".`;

/**
 * Sends a chat message to the LLM via the server-side proxy.
 * Falls back to a simulated local response when /api/llm/chat returns configured:false.
 */
export async function sendAIMessage(
  prompt: string,
  history: ChatMessage[] = [],
  _options?: { model?: string }
): Promise<AIResponse> {
  const startTime = performance.now();
  const config = getAppConfig();
  const systemPrompt = config.aiSystemPromptOverride || SYSTEM_TAX_PROMPT;

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...history
      .filter((m) => m.role !== 'model')
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: prompt },
  ];

  try {
    const res = await fetch('/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_completion_tokens: 4096 }),
    });

    const elapsed = Math.round(performance.now() - startTime);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({})) as any;
      if (errData?.configured === false) {
        return buildFallback(prompt, elapsed);
      }
      throw new Error(errData?.error || `HTTP ${res.status}`);
    }

    const data = await res.json() as any;
    const text: string =
      data?.choices?.[0]?.message?.content ||
      data?.content?.[0]?.text ||
      data?.text ||
      '';

    if (!text) return buildFallback(prompt, elapsed);

    return {
      text,
      diagnostics: {
        latencyMs: elapsed,
        modelUsed: data?.model || 'server-configured',
        provider: 'cloudflare-proxy',
        endpoint: '/api/llm/chat',
        tokensEstimate: Math.ceil(text.length / 4),
        isFallback: false,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    const elapsed = Math.round(performance.now() - startTime);
    console.warn('[AI] /api/llm/chat error:', err.message);
    return buildFallback(prompt, elapsed);
  }
}

function buildFallback(prompt: string, elapsed: number): AIResponse {
  const text = `[AI Assistant — Demo Mode]

I received your question: "${prompt.slice(0, 120)}${prompt.length > 120 ? '...' : ''}"

To enable live AI responses, set the following Cloudflare Pages secret:
  OPENAI_API_KEY — any OpenAI-compatible key (OpenAI, Cloudflare AI, OpenRouter)
  OPENAI_BASE_URL — optional; defaults to https://api.openai.com/v1
  OPENAI_MODEL — optional; defaults to gpt-4o-mini

Run: wrangler pages secret put OPENAI_API_KEY

Powered by RJ Business Solutions | support@rjbusinesssolutions.org`;

  return {
    text,
    diagnostics: {
      latencyMs: elapsed,
      modelUsed: 'demo-fallback',
      provider: 'local',
      endpoint: 'fallback',
      tokensEstimate: 0,
      isFallback: true,
      timestamp: new Date().toISOString(),
    },
  };
}

/** Convenience wrapper kept for backwards compatibility with older components. */
export async function callAI(
  prompt: string,
  history: ChatMessage[] = []
): Promise<string> {
  const response = await sendAIMessage(prompt, history);
  return response.text;
}

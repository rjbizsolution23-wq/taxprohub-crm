/**
 * ═══════════════════════════════════════════════════════════════════════
 * DELIVERY ENGINE CLIENT — campaigns, workflow enrollment, live tasks
 * ═══════════════════════════════════════════════════════════════════════
 * Thin wrappers over the edge engine (/api/campaigns/*, /api/workflows/*,
 * /api/v1/tasks). Every call returns `configured:false` instead of throwing
 * when the backend isn't provisioned, so the UI can show a setup hint rather
 * than invented data.
 */
import { apiFetch } from './api';

export interface LiveTask {
  id: string;
  title: string;
  description?: string;
  contactId?: string | null;
  dealId?: string | null;
  assignee?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'To-Do' | 'In-Progress' | 'Blocked' | 'Done';
  dueAt?: string | null;
  tags?: string[];
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

/* ── Tasks (D1-backed work queue) ─────────────────────────────────── */

export async function listTasks(): Promise<{ ok: boolean; items: LiveTask[] }> {
  const res = await apiFetch<{ items: LiveTask[] }>('/api/v1/tasks?limit=200');
  return { ok: res.ok, items: (res.data as any)?.items || [] };
}

export async function createTask(task: Partial<LiveTask>) {
  return apiFetch<{ item: LiveTask }>('/api/v1/tasks', {
    method: 'POST',
    body: JSON.stringify({
      priority: 'medium',
      status: 'To-Do',
      source: 'manual',
      tags: [],
      ...task,
    }),
  });
}

export const updateTask = (id: string, patch: Partial<LiveTask>) =>
  apiFetch<{ item: LiveTask }>(`/api/v1/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ id, ...patch }) });

export const deleteTask = (id: string) =>
  apiFetch(`/api/v1/tasks/${id}`, { method: 'DELETE' });

/* ── Campaign delivery ────────────────────────────────────────────── */

export interface ScheduleResult { runId?: string; recipients?: number; scheduledAt?: string }

/** Queue a campaign for delivery. Omit `sendAt` to send on the next tick. */
export const scheduleCampaign = (
  campaignId: string,
  opts: { sendAt?: string; contactIds?: string[]; tag?: string } = {},
) => apiFetch<ScheduleResult>(`/api/campaigns/${campaignId}/${opts.sendAt ? 'schedule' : 'send-now'}`, {
  method: 'POST',
  body: JSON.stringify(opts),
});

export const campaignStats = (campaignId: string) =>
  apiFetch<{ runs: Record<string, unknown>[]; byStatus: Record<string, number> }>(`/api/campaigns/${campaignId}/stats`);

/* ── Workflow enrollment ──────────────────────────────────────────── */

export const enrollInWorkflow = (workflowId: string, contactIds: string[]) =>
  apiFetch<{ enrolled: number; runIds: string[] }>(`/api/workflows/${workflowId}/enroll`, {
    method: 'POST',
    body: JSON.stringify({ contactIds }),
  });

/** Manually drain the queues (normally the cron Worker does this every minute). */
export const runEngineTick = () => apiFetch<{ campaignsSent: number; workflowsAdvanced: number }>('/api/cron/tick', { method: 'POST' });

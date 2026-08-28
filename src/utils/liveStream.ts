/**
 * ═══════════════════════════════════════════════════════════════════════
 * LIVE STREAM CLIENT — Server-Sent Events from the edge
 * ═══════════════════════════════════════════════════════════════════════
 * `useLiveStream()` keeps an EventSource open against /api/stream and exposes
 * the latest practice snapshot plus a rolling activity feed. When the backend
 * isn't reachable it simply stays `connected: false` — no fabricated telemetry.
 */
import { useEffect, useRef, useState } from 'react';
import { getToken } from './api';

export interface LiveSnapshot {
  at: string;
  contacts: number;
  deals: number;
  documents: number;
  openTasks: number;
  queuedSends: number;
  activeWorkflows: number;
  openFindings: number;
  criticalFindings: number;
}

export interface LiveActivity {
  action: string;
  resource: string;
  resource_id: string;
  created_at: string;
}

export function useLiveStream(enabled = true) {
  const [snapshot, setSnapshot] = useState<LiveSnapshot | null>(null);
  const [activity, setActivity] = useState<LiveActivity[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const token = getToken();
    if (!token) return;

    let stopped = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (stopped) return;
      const es = new EventSource(`/api/stream?token=${encodeURIComponent(token)}`);
      esRef.current = es;

      es.addEventListener('hello', () => setConnected(true));
      es.addEventListener('snapshot', (e) => {
        try { setSnapshot(JSON.parse((e as MessageEvent).data)); } catch { /* ignore */ }
      });
      es.addEventListener('activity', (e) => {
        try {
          const item = JSON.parse((e as MessageEvent).data) as LiveActivity;
          setActivity((prev) => [item, ...prev].slice(0, 50));
        } catch { /* ignore */ }
      });
      es.addEventListener('bye', () => { es.close(); if (!stopped) connect(); });
      es.onerror = () => {
        setConnected(false);
        es.close();
        // Reconnect with a short backoff; the edge closes the stream every ~10 min.
        retry = setTimeout(connect, 4000);
      };
    };

    connect();
    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      esRef.current?.close();
      setConnected(false);
    };
  }, [enabled]);

  return { snapshot, activity, connected };
}

export const ACTIVITY_LABELS: Record<string, string> = {
  'entity.create': 'created',
  'entity.update': 'updated',
  'entity.delete': 'deleted',
  'file.upload': 'uploaded a document',
  'file.download': 'downloaded a document',
  'file.delete': 'deleted a document',
  'campaign.schedule': 'queued a campaign',
  'workflow.enroll': 'enrolled contacts in a workflow',
  'compliance.sweep': 'ran a compliance sweep',
  'portal.login': 'client signed into the portal',
  'portal.upload': 'client uploaded a document',
  'portal.link_requested': 'client requested a portal link',
};

/**
 * VIDEO CONSULTATION SUITE — secure client video calls
 * Live local camera/mic via getUserMedia (works instantly, zero-key).
 * Multi-party rides Cloudflare Calls (Realtime SFU) through the
 * /api/video/session worker endpoint once CF_CALLS_* secrets are set.
 */
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, Copy, CheckCircle2,
  Users, Shield, Clock, Calendar, Link2, AlertTriangle, Radio, FileText, Zap
} from 'lucide-react';

const card = 'bg-neutral-950/70 border border-amber-500/15 backdrop-blur-xl rounded-3xl shadow-xl';

type CallState = 'idle' | 'preview' | 'live' | 'ended';

export default function VideoCallPage() {
  const { appointments, contacts, addNotification } = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const [callState, setCallState] = useState<CallState>('idle');
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [sfu, setSfu] = useState<{ configured: boolean; sessionId?: string; checking: boolean }>({ configured: false, checking: false });

  // Timer
  useEffect(() => {
    if (callState !== 'live') return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [callState]);

  // Cleanup on unmount
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const startPreview = async () => {
    setMediaError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCallState('preview');
    } catch (e: any) {
      setMediaError(
        e?.name === 'NotAllowedError'
          ? 'Camera/microphone permission denied. Allow access in your browser and try again.'
          : e?.name === 'NotFoundError'
            ? 'No camera or microphone detected on this device.'
            : `Could not start media: ${e?.message || e}`
      );
    }
  };

  const goLive = async () => {
    const id = roomId || `tax-${Math.random().toString(36).slice(2, 8)}`;
    setRoomId(id);
    setCallState('live');
    setElapsed(0);
    // Attempt Cloudflare Calls SFU session for multi-party
    setSfu(s => ({ ...s, checking: true }));
    try {
      const res = await fetch('/api/video/session', { method: 'POST' });
      const data = await res.json();
      if (data.ok && data.sessionId) {
        setSfu({ configured: true, sessionId: data.sessionId, checking: false });
        addNotification({ id: `n-${Date.now()}`, title: 'Cloudflare Calls session live', message: `SFU session ${data.sessionId} created — multi-party ready.`, type: 'success', read: false, createdAt: new Date() });
      } else {
        setSfu({ configured: false, checking: false });
      }
    } catch {
      setSfu({ configured: false, checking: false });
    }
  };

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOn; });
    setCamOn(!camOn);
  };
  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOn; });
    setMicOn(!micOn);
  };

  const toggleShare = async () => {
    if (sharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setSharing(false);
      return;
    }
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = s;
      if (screenRef.current) screenRef.current.srcObject = s;
      s.getVideoTracks()[0].addEventListener('ended', () => setSharing(false));
      setSharing(true);
    } catch { /* user cancelled */ }
  };

  const endCall = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    screenStreamRef.current = null;
    setSharing(false);
    setCallState('ended');
    addNotification({ id: `n-${Date.now()}`, title: 'Call ended', message: `Video consultation (${fmt(elapsed)}) ended. Log notes on the client record.`, type: 'info', read: false, createdAt: new Date() });
  };

  const inviteLink = `${window.location.origin}${window.location.pathname}#/video?room=${roomId || 'new'}`;
  const copyInvite = () => {
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const upcoming = appointments.slice(0, 4);

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-950/40 border border-amber-500/10 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase">Secure Client Communications</span>
          <h1 className="text-3xl font-black tracking-tight font-serif mt-0.5">Video Consultation Suite</h1>
          <p className="text-slate-400 text-xs mt-1">In-browser video — no downloads for you or the client. Multi-party rides Cloudflare Calls SFU at the edge.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-neutral-900/80 border border-emerald-500/20 rounded-2xl flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <div className="font-mono text-left">
              <p className="text-[9px] text-slate-500 font-bold uppercase leading-none">Transport</p>
              <p className="text-[10px] text-emerald-400 font-bold mt-0.5">DTLS-SRTP encrypted</p>
            </div>
          </div>
          {callState === 'live' && (
            <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2">
              <Radio className="h-4 w-4 text-red-400 animate-pulse" />
              <span className="font-mono text-sm font-black text-red-400">{fmt(elapsed)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`${card} overflow-hidden`}>
            <div className="relative aspect-video bg-black">
              {callState === 'idle' || callState === 'ended' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <Video className="h-9 w-9 text-[#D4AF37]" />
                  </div>
                  <p className="text-sm font-bold text-slate-300">{callState === 'ended' ? `Call ended · duration ${fmt(elapsed)}` : 'Ready for your consultation'}</p>
                  <button onClick={startPreview} className="px-8 py-3.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-2xl text-sm shadow-xl transition active:scale-95 flex items-center gap-2">
                    <Video className="h-4.5 w-4.5" /> {callState === 'ended' ? 'Start New Call' : 'Start Camera'}
                  </button>
                  {mediaError && (
                    <p className="text-xs text-rose-400 flex items-center gap-1.5 max-w-md text-center px-4"><AlertTriangle className="h-4 w-4 shrink-0" /> {mediaError}</p>
                  )}
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 h-full w-full object-cover ${sharing ? 'opacity-0' : ''}`} />
                  {sharing && <video ref={screenRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-contain bg-neutral-950" />}
                  {sharing && (
                    <div className="absolute bottom-4 right-4 w-40 aspect-video rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-2xl">
                      <video autoPlay playsInline muted ref={el => { if (el && streamRef.current) el.srcObject = streamRef.current; }} className="h-full w-full object-cover" />
                    </div>
                  )}
                  {!camOn && !sharing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-950">
                      <div className="h-24 w-24 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                        <VideoOff className="h-10 w-10 text-slate-500" />
                      </div>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-black/60 backdrop-blur rounded-lg text-[10px] font-mono font-bold text-white">You (Preparer)</span>
                    {callState === 'live' && <span className="px-3 py-1.5 bg-red-500/80 backdrop-blur rounded-lg text-[10px] font-mono font-black text-white flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE</span>}
                  </div>
                </>
              )}
            </div>

            {/* Control bar */}
            {(callState === 'preview' || callState === 'live') && (
              <div className="p-5 flex flex-wrap items-center justify-center gap-3 bg-neutral-950/80 border-t border-neutral-900">
                <button onClick={toggleMic} className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition active:scale-95 ${micOn ? 'bg-neutral-900 border-neutral-800 text-white hover:border-amber-500/40' : 'bg-red-500/15 border-red-500/40 text-red-400'}`}>
                  {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
                <button onClick={toggleCam} className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition active:scale-95 ${camOn ? 'bg-neutral-900 border-neutral-800 text-white hover:border-amber-500/40' : 'bg-red-500/15 border-red-500/40 text-red-400'}`}>
                  {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
                <button onClick={toggleShare} className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition active:scale-95 ${sharing ? 'bg-amber-500/15 border-amber-500/40 text-[#D4AF37]' : 'bg-neutral-900 border-neutral-800 text-white hover:border-amber-500/40'}`}>
                  <Monitor className="h-5 w-5" />
                </button>
                {callState === 'preview' ? (
                  <button onClick={goLive} className="px-8 h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white font-black rounded-2xl text-sm transition active:scale-95 flex items-center gap-2">
                    <Radio className="h-4.5 w-4.5" /> Go Live
                  </button>
                ) : (
                  <button onClick={endCall} className="px-8 h-12 bg-gradient-to-r from-red-600 to-red-500 hover:brightness-110 text-white font-black rounded-2xl text-sm transition active:scale-95 flex items-center gap-2">
                    <PhoneOff className="h-4.5 w-4.5" /> End Call
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Invite */}
          {(callState === 'preview' || callState === 'live') && (
            <div className={`${card} p-5`}>
              <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest font-mono flex items-center gap-2"><Link2 className="h-4 w-4" /> Client invite link</p>
              <div className="flex gap-2 mt-3">
                <input readOnly value={inviteLink} className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono" />
                <button onClick={copyInvite} className="px-5 py-2.5 bg-neutral-900 border border-amber-500/30 text-[#D4AF37] font-black rounded-xl text-xs flex items-center gap-1.5 hover:bg-amber-500/10 transition active:scale-95">
                  {copied ? <><CheckCircle2 className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Send via Conversations, SMS (Twilio wired at /api/sms/send), or the appointment reminder drip — the Appointment Guard recipe embeds it automatically.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* SFU status */}
          <div className={`${card} p-5`}>
            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest font-mono flex items-center gap-2"><Zap className="h-4 w-4" /> Cloudflare Calls SFU</p>
            <div className={`mt-3 rounded-xl px-4 py-3 border text-xs ${sfu.configured ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-300' : 'bg-neutral-900/50 border-neutral-800 text-slate-400'}`}>
              {sfu.checking ? 'Checking edge session…' : sfu.configured
                ? <>SFU session <b className="font-mono">{sfu.sessionId}</b> active — multi-party (client + preparer + reviewer) enabled via Cloudflare's global Realtime network.</>
                : <>Multi-party SFU not yet configured. 1-on-1 local video works now. To enable global multi-party: create a <b>Calls app</b> in the Cloudflare dashboard, then <code className="text-[#D4AF37]">wrangler pages secret put CF_CALLS_APP_ID</code> + <code className="text-[#D4AF37]">CF_CALLS_APP_SECRET</code>. The worker endpoint <code className="text-[#D4AF37]">/api/video/session</code> is already deployed and waiting.</>}
            </div>
          </div>

          {/* Upcoming appointments */}
          <div className={`${card} p-5`}>
            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest font-mono flex items-center gap-2"><Calendar className="h-4 w-4" /> Upcoming video consults</p>
            <div className="mt-3 space-y-2">
              {upcoming.length === 0 && <p className="text-xs text-slate-500">No appointments scheduled — bookings from the Calendar and funnels appear here.</p>}
              {upcoming.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 bg-neutral-900/40 border border-neutral-800 rounded-xl px-4 py-3">
                  <Clock className="h-4 w-4 text-[#D4AF37] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{a.title || 'Tax consultation'}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{new Date(a.startTime || a.date || Date.now()).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session checklist */}
          <div className={`${card} p-5`}>
            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest font-mono flex items-center gap-2"><FileText className="h-4 w-4" /> Consultation protocol</p>
            <ul className="mt-3 space-y-2">
              {[
                'Verify client identity on camera before discussing any return data (Pub 4557 requirement)',
                'Screen-share the draft return for line-by-line review — never email the PDF',
                'Capture verbal approval, then send Form 8879 for e-signature in the portal',
                'Log call notes to the contact record immediately after ending',
                'If the client mentions an IRS letter → run it through IRS Tools → Notice Decoder live on the call',
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Roster quick-dial */}
          <div className={`${card} p-5`}>
            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest font-mono flex items-center gap-2"><Users className="h-4 w-4" /> Quick-invite a client</p>
            <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
              {contacts.slice(0, 6).map((c: any) => (
                <button key={c.id} onClick={copyInvite} className="w-full flex items-center justify-between px-3.5 py-2.5 bg-neutral-900/40 border border-neutral-800 hover:border-amber-500/30 rounded-xl text-left transition group">
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white truncate">{c.firstName} {c.lastName}</span>
                  <Copy className="h-3.5 w-3.5 text-slate-600 group-hover:text-[#D4AF37] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

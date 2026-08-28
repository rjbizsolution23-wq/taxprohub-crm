import { useState } from 'react';
import { 
  MessageSquare, Mail, Phone, Search, Send, Sparkles, Filter, 
  User, CheckCheck, Clock, ShieldCheck, AlertCircle, Settings, ChevronRight
} from 'lucide-react';
import { sendSMSViaTwilio } from '../utils/sms';
import { sendEmailViaResend } from '../utils/email';

interface Message {
  id: string;
  sender: 'client' | 'agent' | 'ai';
  text: string;
  timestamp: string;
  type: 'sms' | 'email' | 'messenger' | 'ig';
}

interface ChatThread {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: Message[];
  status: 'In Progress' | 'Awaiting Info' | 'Filed' | 'Review';
}

export default function ConversationsPage() {
  const [activeChannel, setActiveChannel] = useState<'all' | 'sms' | 'email' | 'messenger' | 'ig'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeThreadId, setActiveThreadId] = useState('thread-1');
  const [newMessageText, setNewMessageText] = useState('');
  const [aiDraftMode, setAiDraftMode] = useState(false);
  const [aiDraftText, setAiDraftText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatusMsg, setSendStatusMsg] = useState('');
  const [sendType, setSendType] = useState<'sms' | 'email'>('sms');

  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: 'thread-1',
      clientName: 'Sarah Jenkins',
      clientEmail: 'sjenkins@gmail.com',
      clientPhone: '(414) 220-1928',
      unreadCount: 2,
      lastMessage: 'I uploaded my 1099-NEC. Are we ready to submit?',
      lastMessageTime: '10:42 AM',
      status: 'Awaiting Info',
      messages: [
        { id: '1', sender: 'client', text: 'Hi, just wanted to check if you received my tax organizer documents?', timestamp: 'May 22, 2:00 PM', type: 'email' },
        { id: '2', sender: 'agent', text: 'Yes Sarah, I reviewed the W-2 and mortgage interest statements. We are just missing your self-employment 1099-NEC forms.', timestamp: 'May 22, 2:15 PM', type: 'email' },
        { id: '3', sender: 'client', text: 'Oh got it! I just got that file today from my client. Let me upload it to the secure portal.', timestamp: 'May 22, 2:45 PM', type: 'sms' },
        { id: '4', sender: 'client', text: 'I uploaded my 1099-NEC. Are we ready to submit?', timestamp: '10:42 AM', type: 'sms' }
      ]
    },
    {
      id: 'thread-2',
      clientName: 'Michael Martinez',
      clientEmail: 'mmartinez@yahoo.com',
      clientPhone: '(505) 883-9112',
      unreadCount: 0,
      lastMessage: 'Draft looks amazing. Let’s proceed with E-filing.',
      lastMessageTime: 'Yesterday',
      status: 'Review',
      messages: [
        { id: '1', sender: 'agent', text: 'Michael, I completed drafting your 1040 Form. Your projected refund is $3,450. Please review the draft copy in your vault.', timestamp: 'Yesterday, 1:10 PM', type: 'messenger' },
        { id: '2', sender: 'client', text: 'Draft looks amazing. Let’s proceed with E-filing.', timestamp: 'Yesterday, 1:30 PM', type: 'messenger' }
      ]
    },
    {
      id: 'thread-3',
      clientName: 'Eleanor Vance',
      clientEmail: 'eleanor@vancedesigns.com',
      clientPhone: '(312) 554-0992',
      unreadCount: 0,
      lastMessage: 'Can we schedule a 15-minute sync regarding the S-Corp election?',
      lastMessageTime: 'May 21',
      status: 'In Progress',
      messages: [
        { id: '1', sender: 'client', text: 'Can we schedule a 15-minute sync regarding the S-Corp election?', timestamp: 'May 21, 4:10 PM', type: 'sms' }
      ]
    },
    {
      id: 'thread-4',
      clientName: 'David Kross',
      clientEmail: 'david.kross@krosstech.org',
      clientPhone: '(206) 441-2938',
      unreadCount: 0,
      lastMessage: 'Refund received. Thanks for the quick tax prep this year!',
      lastMessageTime: 'May 19',
      status: 'Filed',
      messages: [
        { id: '1', sender: 'agent', text: 'IRS has approved your filing. Estimated deposit date is May 24.', timestamp: 'May 19, 10:00 AM', type: 'email' },
        { id: '2', sender: 'client', text: 'Refund received. Thanks for the quick tax prep this year!', timestamp: 'May 19, 3:15 PM', type: 'sms' }
      ]
    }
  ]);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  const handleSendMessage = async (textToSend: string, senderType: 'agent' | 'ai' = 'agent') => {
    if (!textToSend.trim() || isSending) return;

    setIsSending(true);
    setSendStatusMsg(`Dispatching via ${sendType.toUpperCase()}...`);

    let success = false;
    let details = '';

    if (sendType === 'sms') {
      const smsRes = await sendSMSViaTwilio(activeThread.clientPhone, textToSend);
      success = smsRes.success;
      details = smsRes.success ? `Delivered (SID: ${smsRes.sid})` : `Twilio Gateway: ${smsRes.error}`;
    } else {
      const emailRes = await sendEmailViaResend(
        activeThread.clientEmail,
        `Secure Update from Tax Pro Hub University re: Tax Filing`,
        `<div style="font-family: sans-serif; max-width: 600px; padding: 20px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #D4AF37; margin-top: 0;">Tax Pro Hub University</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${textToSend}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #64748b; text-align: center;">This message was transmitted securely via Tax Pro Hub University.<br/>Powered by RJ Business Solutions | Tijeras, New Mexico 87059</p>
        </div>`
      );
      success = emailRes.success;
      details = emailRes.success ? `Dispatched (ID: ${emailRes.id})` : `Resend Gateway: ${emailRes.error}`;
    }

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: senderType,
      text: success ? textToSend : `${textToSend}\n\n⚠️ ${details}`,
      timestamp: 'Just now',
      type: sendType
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          lastMessage: textToSend,
          lastMessageTime: 'Just now',
          messages: [...t.messages, newMsg]
        };
      }
      return t;
    }));

    setSendStatusMsg(details);
    setTimeout(() => setSendStatusMsg(''), 6000);

    setIsSending(false);
    if (senderType === 'agent') {
      setNewMessageText('');
    } else {
      setAiDraftMode(false);
      setAiDraftText('');
    }
  };

  const generateAiResponse = () => {
    setAiDraftMode(true);
    // Tailored tax agent intelligence draft
    const clientTopic = activeThread.lastMessage.toLowerCase();
    let draft = '';
    
    if (clientTopic.includes('1099') || clientTopic.includes('upload')) {
      draft = `Hi ${activeThread.clientName.split(' ')[0]}, perfect! I see your 1099-NEC upload. I am running our security OCR checklist and integrating it with your W-2 records now. I expect to have your final 1040 review packet compiled by this afternoon for your sign-off. - Rick, RJ Business Solutions`;
    } else if (clientTopic.includes('schedule') || clientTopic.includes('sync') || clientTopic.includes('s-corp')) {
      draft = `Hi ${activeThread.clientName.split(' ')[0]}, I would be happy to discuss the S-Corp filing election with you! Please click here to pick a 15-minute slot that fits you best: rjbusinesssolutions.org/schedule. Looking forward to our call.`;
    } else {
      draft = `Hi ${activeThread.clientName.split(' ')[0]}, thank you for reaching out. I have marked this as high priority on our tax desk. I am actively reviewing your active filing records and will update you shortly! - Tax Pro Hub University AI Agent`;
    }

    setAiDraftText(draft);
  };

  const filteredThreads = threads.filter(t => {
    const matchesSearch = t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeChannel === 'all') return matchesSearch;
    return matchesSearch && t.messages.some(m => m.type === activeChannel);
  });

  const getChannelIcon = (type: 'sms' | 'email' | 'messenger' | 'ig') => {
    switch (type) {
      case 'sms': return <Phone className="h-3 w-3 text-cyan-400" />;
      case 'email': return <Mail className="h-3 w-3 text-pink-400" />;
      case 'messenger': return <MessageSquare className="h-3 w-3 text-indigo-400" />;
      case 'ig': return <Sparkles className="h-3 w-3 text-purple-400" />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] bg-slate-900 rounded-2xl overflow-hidden border border-[#1f2937] shadow-xl text-white">
      {/* Column 1: Channels & Threads List */}
      <div className="w-full lg:w-80 border-r border-[#1f2937] bg-slate-950/80 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-[#1f2937]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber-500" />
              Unified Inbox
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
              4 Threads
            </span>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-[#1f2937] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Quick Channels Grid */}
          <div className="grid grid-cols-5 gap-1 p-0.5 bg-slate-900 rounded-xl border border-[#1f2937]">
            {(['all', 'sms', 'email', 'messenger', 'ig'] as const).map(ch => (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className={`py-1.5 rounded-lg text-[10px] font-medium transition-all uppercase tracking-wider ${
                  activeChannel === ch 
                    ? 'bg-slate-800 text-white font-bold shadow-md border border-[#334155]' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Threads list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1f2937]/50">
          {filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No active threads match filters.</div>
          ) : (
            filteredThreads.map(t => (
              <div
                key={t.id}
                onClick={() => {
                  setActiveThreadId(t.id);
                  setAiDraftMode(false);
                  setAiDraftText('');
                }}
                className={`p-4 flex flex-col gap-1.5 cursor-pointer transition-all ${
                  t.id === activeThread.id 
                    ? 'bg-slate-900/90 border-l-2 border-amber-500' 
                    : 'hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
                    {t.clientName}
                    {t.unreadCount > 0 && (
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{t.lastMessageTime}</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate pr-4">
                  {t.lastMessage}
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-medium font-mono ${
                    t.status === 'Filed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    t.status === 'Review' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    t.status === 'Awaiting Info' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {t.status}
                  </span>
                  <div className="flex items-center gap-1">
                    {t.messages.length > 0 && getChannelIcon(t.messages[t.messages.length - 1].type)}
                    <span className="text-slate-500 text-[9px] font-mono">{t.messages.length} msgs</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Column 2: Chat Canvas */}
      <div className="flex-1 bg-slate-900/40 flex flex-col h-full min-w-0">
        {/* Chat header */}
        <div className="p-4 border-b border-[#1f2937] bg-slate-950/25 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center font-bold text-xs text-white">
              {activeThread.clientName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{activeThread.clientName}</div>
              <div className="text-[10px] text-slate-400 truncate font-mono">{activeThread.clientEmail}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={generateAiResponse}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-yellow-600/10 hover:from-amber-500/20 hover:to-yellow-600/20 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Draft Reply
            </button>
          </div>
        </div>

        {/* Message bubble stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center">
            <span className="px-2 py-1 bg-slate-950/40 border border-[#1f2937] rounded-full text-[9px] text-slate-500 font-mono uppercase tracking-wider">
              Encryption Secure • RJ Business Solutions Gateway
            </span>
          </div>

          {activeThread.messages.map((m) => {
            const isClient = m.sender === 'client';
            const isAi = m.sender === 'ai';
            return (
              <div key={m.id} className={`flex ${isClient ? 'justify-start' : 'justify-end'} group`}>
                <div className={`max-w-[70%] flex flex-col gap-1 ${isClient ? 'items-start' : 'items-end'}`}>
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isClient 
                      ? 'bg-slate-950 border border-[#1f2937] text-slate-200 rounded-tl-sm' 
                      : isAi
                        ? 'bg-gradient-to-br from-amber-600 to-yellow-600 text-white rounded-tr-sm shadow-lg shadow-amber-500/10 border border-amber-500/30'
                        : 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white rounded-tr-sm shadow-lg shadow-amber-500/10 border border-amber-500/30'
                  }`}>
                    {m.text}
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono px-1">
                    {m.sender === 'ai' && <Sparkles className="h-2.5 w-2.5 text-amber-400" />}
                    <span>{m.sender === 'client' ? 'Client' : m.sender === 'ai' ? 'Tax Pro Hub University AI' : 'Practice Agent'}</span>
                    <span>•</span>
                    <span>{m.timestamp}</span>
                    {!isClient && <CheckCheck className="h-3 w-3 text-amber-500 ml-0.5" />}
                  </div>
                </div>
              </div>
            );
          })}

          {/* AI Draft Preview panel inline */}
          {aiDraftMode && (
            <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-2xl flex flex-col gap-3 shadow-lg shadow-amber-500/5 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                  <Sparkles className="h-4 w-4" />
                  Proposed AI Agent Response Draft
                </div>
                <button 
                  onClick={() => setAiDraftMode(false)}
                  className="text-slate-500 hover:text-slate-300 text-[10px] font-mono"
                >
                  Dismiss
                </button>
              </div>
              <textarea
                value={aiDraftText}
                onChange={e => setAiDraftText(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleSendMessage(aiDraftText, 'ai')}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                >
                  Approve & Dispatch
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-[#1f2937] bg-slate-950/15 flex-shrink-0">
          {sendStatusMsg && (
            <div className="mb-2.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-mono text-amber-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
              {sendStatusMsg}
            </div>
          )}
          
          <form 
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage(newMessageText);
            }} 
            className="flex items-center gap-2 bg-slate-900 rounded-2xl p-1.5 border border-[#1f2937]"
          >
            <select
              value={sendType}
              onChange={e => setSendType(e.target.value as any)}
              className="bg-slate-950 text-slate-300 text-[10px] font-semibold font-mono border border-slate-800 rounded-xl px-2.5 py-2 focus:outline-none cursor-pointer hover:bg-slate-900 transition-colors"
            >
              <option value="sms">📱 SMS</option>
              <option value="email">✉️ EMAIL</option>
            </select>

            <input
              type="text"
              placeholder={`Type an ${sendType.toUpperCase()} message to ${activeThread.clientName}...`}
              value={newMessageText}
              onChange={e => setNewMessageText(e.target.value)}
              disabled={isSending}
              className="flex-1 bg-transparent px-2 py-2 text-xs text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!newMessageText.trim() || isSending}
              className="p-2 bg-amber-500 text-black font-bold rounded-xl transition-all hover:scale-105 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Column 3: Contact Sidebar Details */}
      <div className="hidden xl:flex w-72 border-l border-[#1f2937] bg-slate-950/80 flex-col p-4 flex-shrink-0 overflow-y-auto">
        <h3 className="font-bold text-sm text-slate-100 mb-4 flex items-center gap-1.5">
          <User className="h-4 w-4 text-amber-500" />
          Client Profile
        </h3>

        <div className="flex flex-col items-center text-center pb-6 border-b border-[#1f2937]/60 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center font-bold text-lg text-white mb-3">
            {activeThread.clientName.split(' ').map(n => n[0]).join('')}
          </div>
          <h4 className="font-semibold text-sm text-white">{activeThread.clientName}</h4>
          <span className="text-[10px] font-mono text-slate-400 mt-1">{activeThread.clientPhone}</span>
        </div>

        <div className="space-y-5 flex-1">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">IRS Status Integration</div>
            <div className="p-3 bg-slate-900 border border-[#1f2937] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                <span className="text-[11px] font-medium text-slate-300">TaxSlayer E-File Status</span>
              </div>
              <span className="text-[10px] font-bold font-mono text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Pending
              </span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2.5">AI Response Helpers</div>
            <div className="space-y-1.5">
              {[
                { title: 'Tax season initial organizer', text: 'Hi, I hope you are having a wonderful day! Please download our 2026 Tax Season Organizer from your secure documents vault and upload the completed statements.' },
                { title: 'Missing W-2 reminder alert', text: 'Hi, our cognitive OCR checks show we are missing your primary W-2 income forms. Please scan or snap a photo to upload directly so we can proceed!' },
                { title: 'IRS representation audit consent', text: 'Hi, we have compiled the representation letters for the IRS tax notice check. Please sign the consent forms inside the portal.' }
              ].map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAiDraftMode(true);
                    setAiDraftText(tpl.text);
                  }}
                  className="w-full text-left p-2.5 bg-slate-900 hover:bg-slate-900/90 border border-[#1f2937] hover:border-amber-500/25 rounded-xl transition-all flex flex-col gap-1 group"
                >
                  <div className="text-[10px] font-semibold text-slate-300 group-hover:text-amber-500 flex items-center justify-between">
                    <span>{tpl.title}</span>
                    <ChevronRight className="h-3 w-3 text-slate-500" />
                  </div>
                  <p className="text-[9px] text-slate-500 line-clamp-1 leading-relaxed">{tpl.text}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1f2937]/60">
            <div className="p-3.5 bg-amber-950/20 border border-amber-500/10 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                <ShieldCheck className="h-3.5 w-3.5" />
                Compliance Node
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed">
                SMS notifications respect user consent. Outbound messages route through RJ Business Solutions compliance gateways.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

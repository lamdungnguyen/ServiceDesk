import { useEffect, useRef, useState, useCallback } from 'react';
import { PhoneOff, PhoneCall, Mic, MicOff, X, Settings2, Speaker, ChevronDown, Minimize2, Maximize2 } from 'lucide-react';
import {
  connectWebSocket,
  subscribeToUserCalls,
  subscribeToCall,
  sendCallSignal,
  type CallSignal,
} from '../services/websocket';
import {
  setContext as setRtcContext,
  setCallbacks as setRtcCallbacks,
  handleOffer,
  handleAnswer,
  handleIce,
  setMuted,
  endCall as rtcEnd,
} from '../services/webrtc';

type CallStatus = 'idle' | 'ringing' | 'calling' | 'connected';

interface GlobalCallPanelProps {
  agentId: number;
  agentName: string;
  /**
   * Pass the ticket the agent is currently viewing.
   * If it matches the incoming call's ticketId, the in-ticket CallPanel handles it
   * and this global panel stays silent.
   */
  currentViewingTicketId?: number | null;
}

const GlobalCallPanel = ({ agentId, agentName, currentViewingTicketId }: GlobalCallPanelProps) => {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [muted, setMutedState] = useState(false);
  const [incoming, setIncoming] = useState<CallSignal | null>(null);
  const [callerName, setCallerName] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const ticketUnsubRef = useRef<(() => void) | null>(null);
  // Stable ref so the subscription callback always reads fresh state
  const statusRef = useRef<CallStatus>('idle');
  const currentViewingRef = useRef(currentViewingTicketId);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { currentViewingRef.current = currentViewingTicketId; }, [currentViewingTicketId]);

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Audio devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devs => {
      setDevices(devs);
      const ins = devs.filter(d => d.kind === 'audioinput');
      const outs = devs.filter(d => d.kind === 'audiooutput');
      if (ins.length && !selectedMic) setSelectedMic(ins[0].deviceId);
      if (outs.length && !selectedSpeaker) setSelectedSpeaker(outs[0].deviceId);
    }).catch(() => {});
  }, [selectedMic, selectedSpeaker]);

  // Speaker switching
  useEffect(() => {
    if (remoteAudioRef.current && selectedSpeaker && 'setSinkId' in remoteAudioRef.current) {
      // @ts-ignore
      remoteAudioRef.current.setSinkId(selectedSpeaker).catch(console.warn);
    }
  }, [selectedSpeaker]);

  // Timer
  useEffect(() => {
    let interval: number;
    if (status === 'connected') {
      if (!startTimeRef.current) startTimeRef.current = Date.now();
      interval = window.setInterval(
        () => setDuration(Math.floor((Date.now() - startTimeRef.current!) / 1000)),
        1000,
      );
    } else {
      setDuration(0);
    }
    return () => window.clearInterval(interval);
  }, [status]);

  // Ringtone
  useEffect(() => {
    if (status === 'ringing') {
      if (ringtoneRef.current) {
        ringtoneRef.current.loop = true;
        ringtoneRef.current.play().catch(() => {});
      }
    } else {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    }
  }, [status]);

  const cleanup = useCallback(() => {
    rtcEnd();
    if (ticketUnsubRef.current) {
      ticketUnsubRef.current();
      ticketUnsubRef.current = null;
    }
    setStatus('idle');
    setIncoming(null);
    setMutedState(false);
    setCallerName('');
    setActiveTicketId(null);
    startTimeRef.current = null;
    setDuration(0);
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  }, []);

  // Subscribe to user-specific call topic (CALL_REQUEST only)
  useEffect(() => {
    let unsub: (() => void) | null = null;
    connectWebSocket()
      .then(() => {
        unsub = subscribeToUserCalls(agentId, (signal) => {
          if (signal.type !== 'CALL_REQUEST') return;
          if (signal.targetUserId !== agentId) return;
          // In-ticket CallPanel already handles this — stay silent
          if (signal.ticketId === currentViewingRef.current) return;
          // Already in a call
          if (statusRef.current !== 'idle') return;

          setIncoming(signal);
          setCallerName(signal.senderName || 'Unknown');
          setActiveTicketId(signal.ticketId);
          setStatus('ringing');
        });
      })
      .catch(console.error);
    return () => { if (unsub) unsub(); };
  }, [agentId]);

  const handleAccept = () => {
    if (!incoming) return;
    const ticketId = incoming.ticketId;
    const callerId = incoming.senderId;

    // Set WebRTC callbacks (owned by this panel for this call)
    setRtcCallbacks({
      onRemoteStream: (stream) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch(() => {});
        }
        setStatus('connected');
      },
      onConnectionStateChange: (state) => {
        if (state === 'connected') setStatus('connected');
        else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
          cleanup();
        }
      },
    });

    // Subscribe to ticket-scoped topic for WebRTC handshake signals
    ticketUnsubRef.current = subscribeToCall(ticketId, async (sig) => {
      if (sig.senderId === agentId) return;
      switch (sig.type) {
        case 'CALL_END':
          cleanup();
          break;
        case 'OFFER':
          setRtcContext({
            ticketId,
            selfId: agentId,
            selfName: agentName,
            selfRole: 'AGENT',
            targetUserId: sig.senderId,
          });
          await handleOffer(sig);
          break;
        case 'ANSWER':
          await handleAnswer(sig);
          break;
        case 'ICE':
          await handleIce(sig);
          break;
      }
    });

    sendCallSignal({
      type: 'CALL_ACCEPT',
      ticketId,
      senderId: agentId,
      senderName: agentName,
      senderRole: 'AGENT',
      targetUserId: callerId,
    });

    setStatus('calling');
    setIncoming(null);
  };

  const handleReject = () => {
    if (!incoming) return;
    sendCallSignal({
      type: 'CALL_REJECT',
      ticketId: incoming.ticketId,
      senderId: agentId,
      senderName: agentName,
      senderRole: 'AGENT',
      targetUserId: incoming.senderId,
    });
    setIncoming(null);
    setStatus('idle');
  };

  const handleEnd = () => {
    if (activeTicketId) {
      sendCallSignal({
        type: 'CALL_END',
        ticketId: activeTicketId,
        senderId: agentId,
        senderName: agentName,
        senderRole: 'AGENT',
      });
    }
    cleanup();
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };

  if (status === 'idle') return null;

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay />
      <audio
        ref={ringtoneRef}
        src="data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq"
        preload="auto"
        loop
      />

      {/* ── Incoming call toast (agent is anywhere in the app) ── */}
      {status === 'ringing' && incoming && (
        <div className="fixed bottom-6 right-6 z-[300] w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300">
          {/* Coloured top bar */}
          <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 animate-pulse">
                {callerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{callerName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gọi từ&nbsp;
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    Ticket #{incoming.ticketId}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
              >
                <X size={15} /> Từ chối
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors"
              >
                <PhoneCall size={15} /> Nghe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Connecting… small indicator ── */}
      {status === 'calling' && (
        <div className="fixed bottom-6 right-6 z-[300] bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-6 fade-in duration-200">
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-sm font-semibold">Đang kết nối…</span>
          <button onClick={handleEnd} className="ml-2 text-red-400 hover:text-red-300">
            <PhoneOff size={16} />
          </button>
        </div>
      )}

      {/* ── Minimized mini-window ── */}
      {status === 'connected' && minimized && (
        <div className="fixed bottom-6 right-6 z-[300] w-72 bg-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="p-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {callerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-medium">Ticket #{activeTicketId}</p>
                <p className="text-sm font-bold text-white truncate">{callerName}</p>
                <p className="text-base font-mono font-bold text-emerald-400 tabular-nums">{formatDuration(duration)}</p>
              </div>
              <button onClick={() => setMinimized(false)} className="text-slate-400 hover:text-white transition-colors" title="Mở rộng">
                <Maximize2 size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleToggleMute}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  muted ? 'bg-amber-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {muted ? <MicOff size={14} /> : <Mic size={14} />}
                {muted ? 'Bỏ tắt' : 'Tắt tiếng'}
              </button>
              <button onClick={handleEnd} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition-all">
                <PhoneOff size={14} /> Kết thúc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Full-screen connected UI ── */}
      {status === 'connected' && !minimized && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 animate-in fade-in duration-300">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center gap-8 w-full max-w-sm px-6">
            {/* Top row: badges + minimize */}
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                  <span className="text-blue-300 text-xs font-bold">Ticket #{activeTicketId}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider">Đang kết nối</span>
                </div>
              </div>
              <button onClick={() => setMinimized(true)} className="text-slate-400 hover:text-white transition-colors p-2" title="Thu nhỏ">
                <Minimize2 size={20} />
              </button>
            </div>

            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl ring-4 ring-blue-400/30">
                {callerName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-blue-400/40 animate-ping" />
            </div>

            {/* Name & timer */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">{callerName}</h2>
              <p className="text-3xl font-mono font-bold text-emerald-400 tracking-widest tabular-nums">
                {formatDuration(duration)}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleToggleMute}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                    muted ? 'bg-amber-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {muted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>
                <span className="text-xs text-slate-400">{muted ? 'Bỏ tắt tiếng' : 'Tắt tiếng'}</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleEnd}
                  className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white shadow-2xl shadow-red-500/40 transition-all active:scale-95 hover:scale-105"
                >
                  <PhoneOff size={28} />
                </button>
                <span className="text-xs text-slate-400">Kết thúc</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setShowSettings(s => !s)}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                    showSettings ? 'bg-white/25 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <Settings2 size={22} />
                </button>
                <span className="text-xs text-slate-400">Cài đặt</span>
              </div>
            </div>

            {/* Settings panel */}
            {showSettings && (
              <div className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 animate-in slide-in-from-bottom-4 fade-in duration-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Mic size={10} /> Microphone
                  </label>
                  <div className="relative">
                    <select
                      value={selectedMic}
                      onChange={e => setSelectedMic(e.target.value)}
                      className="w-full text-xs bg-white/10 border border-white/20 rounded-lg py-2 pl-3 pr-8 appearance-none text-white"
                    >
                      {devices.filter(d => d.kind === 'audioinput').map(d => (
                        <option key={d.deviceId} value={d.deviceId} className="text-slate-900">
                          {d.label || `Mic ${d.deviceId.slice(0, 8)}…`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Speaker size={10} /> Speaker
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSpeaker}
                      onChange={e => setSelectedSpeaker(e.target.value)}
                      className="w-full text-xs bg-white/10 border border-white/20 rounded-lg py-2 pl-3 pr-8 appearance-none text-white"
                    >
                      {devices.filter(d => d.kind === 'audiooutput').map(d => (
                        <option key={d.deviceId} value={d.deviceId} className="text-slate-900">
                          {d.label || `Speaker ${d.deviceId.slice(0, 8)}…`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalCallPanel;

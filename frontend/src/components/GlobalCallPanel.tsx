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

  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const fullScreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const fullScreenLocalVideoRef = useRef<HTMLVideoElement | null>(null);
  
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
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
    const remoteVideo = remoteVideoRef.current as (HTMLVideoElement & {
      setSinkId?: (sinkId: string) => Promise<void>;
    }) | null;
    if (remoteVideo?.setSinkId && selectedSpeaker) {
      remoteVideo.setSinkId(selectedSpeaker).catch(console.warn);
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
    remoteStreamRef.current = null;
    localStreamRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (fullScreenVideoRef.current) fullScreenVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (fullScreenLocalVideoRef.current) fullScreenLocalVideoRef.current.srcObject = null;
  }, []);

  // Subscribe to user-specific call topic (CALL_REQUEST only)
  useEffect(() => {
    let timeout: number;
    if (status === 'calling') {
      timeout = window.setTimeout(() => {
        alert('Call timeout: No answer from peer.');
        handleEnd();
      }, 30000);
    }
    return () => window.clearTimeout(timeout);
  }, [status]);

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
        remoteStreamRef.current = stream;
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== stream) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(() => {});
        }
        if (fullScreenVideoRef.current && fullScreenVideoRef.current.srcObject !== stream) {
          fullScreenVideoRef.current.srcObject = stream;
          fullScreenVideoRef.current.play().catch(() => {});
        }
        setStatus('connected');
      },
      onLocalStream: (stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current && localVideoRef.current.srcObject !== stream) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }
        if (fullScreenLocalVideoRef.current && fullScreenLocalVideoRef.current.srcObject !== stream) {
          fullScreenLocalVideoRef.current.srcObject = stream;
          fullScreenLocalVideoRef.current.play().catch(() => {});
        }
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
          try {
            await handleOffer(sig);
          } catch (err) {
            console.error('[GlobalCall] Failed to handle offer', err);
            alert('Call failed: Could not access camera/microphone.');
            cleanup();
          }
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

  // Ensure streams are attached when video elements mount/remount
  useEffect(() => {
    if (status === 'connected') {
      const stream = remoteStreamRef.current;
      if (stream) {
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== stream) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(() => {});
        }
        if (fullScreenVideoRef.current && fullScreenVideoRef.current.srcObject !== stream) {
          fullScreenVideoRef.current.srcObject = stream;
          fullScreenVideoRef.current.play().catch(() => {});
        }
      }

      const lStream = localStreamRef.current;
      if (lStream) {
        if (localVideoRef.current && localVideoRef.current.srcObject !== lStream) {
          localVideoRef.current.srcObject = lStream;
          localVideoRef.current.play().catch(() => {});
        }
        if (fullScreenLocalVideoRef.current && fullScreenLocalVideoRef.current.srcObject !== lStream) {
          fullScreenLocalVideoRef.current.srcObject = lStream;
          fullScreenLocalVideoRef.current.play().catch(() => {});
        }
      }
    }
  }, [status, minimized]);

  if (status === 'idle') return null;

  return (
    <>
      <video 
        ref={remoteVideoRef} 
        autoPlay 
        playsInline 
        className="hidden" 
      />
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
                  Call from&nbsp;
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
                <X size={15} /> Reject
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors"
              >
                <PhoneCall size={15} /> Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Connecting… small indicator ── */}
      {status === 'calling' && (
        <div className="fixed bottom-6 right-6 z-[300] bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-6 fade-in duration-200">
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-sm font-semibold">Connecting…</span>
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
              <button onClick={() => setMinimized(false)} className="text-slate-400 hover:text-white transition-colors" title="Expand">
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
                {muted ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={handleEnd} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition-all">
                <PhoneOff size={14} /> End call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Full-screen connected UI ── */}
      {status === 'connected' && !minimized && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center bg-slate-950 animate-in fade-in duration-300">
          
          {/* Top row */}
          <div className="w-full px-6 py-4 flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                <span className="text-blue-300 text-xs font-bold">Ticket #{activeTicketId}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider">Connecting</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button onClick={() => setMinimized(true)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors shadow-xl" title="Minimize">
                <Minimize2 size={20} />
              </button>
            </div>
          </div>

          {/* Main Video Frame */}
          <div className="flex-1 w-full max-w-6xl px-6 pb-4 flex flex-col relative">
            <div className="w-full h-full bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative flex items-center justify-center">
              <video 
                ref={fullScreenVideoRef}
                autoPlay 
                playsInline 
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Center Info (Avatar/Name) - We make it subtle at the bottom */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               {/* We can hide this if video is active, but we don't track video active state here easily. We'll leave it semi-transparent. */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-2xl ring-4 ring-blue-400/30 opacity-80">
                {callerName.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-white/90 mt-4 drop-shadow-lg">{callerName}</h2>
              <p className="text-2xl font-mono font-bold text-emerald-400 tracking-widest tabular-nums drop-shadow-lg mt-2">
                {formatDuration(duration)}
              </p>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center gap-6 p-5 rounded-3xl bg-slate-800/80 border border-slate-700 shadow-2xl mb-8 z-10">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleToggleMute}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                    muted ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                  title={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleEnd}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white shadow-2xl shadow-red-500/40 transition-all active:scale-95 hover:scale-105 mx-4"
                  title="End call"
                >
                  <PhoneOff size={28} />
                </button>
              </div>

              <div className="flex flex-col items-center gap-2 relative">
                <button
                  onClick={() => setShowSettings(s => !s)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                    showSettings ? 'bg-white/30 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                  title="Settings"
                >
                  <Settings2 size={24} />
                </button>
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-4 w-64 p-4 bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-2xl space-y-4 shadow-2xl animate-in slide-in-from-bottom-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                        <Mic size={12} /> Microphone
                      </label>
                      <div className="relative">
                        <select
                          value={selectedMic}
                          onChange={e => setSelectedMic(e.target.value)}
                          className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                        >
                          {devices.filter(d => d.kind === 'audioinput').map(d => (
                            <option key={d.deviceId} value={d.deviceId}>
                              {d.label || `Mic ${d.deviceId.slice(0, 8)}…`}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                        <Speaker size={12} /> Speaker
                      </label>
                      <div className="relative">
                        <select
                          value={selectedSpeaker}
                          onChange={e => setSelectedSpeaker(e.target.value)}
                          className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                        >
                          {devices.filter(d => d.kind === 'audiooutput').map(d => (
                            <option key={d.deviceId} value={d.deviceId}>
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
        </div>
      )}
    </>
  );
};

export default GlobalCallPanel;

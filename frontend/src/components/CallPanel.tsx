import { useEffect, useRef, useState, useCallback } from 'react';
import { Phone, PhoneOff, PhoneCall, Mic, MicOff, X, Settings2, Speaker, ChevronDown, Minimize2, Maximize2 } from 'lucide-react';
import { connectWebSocket, subscribeToCall, sendCallSignal, sendChatMessage, type CallSignal } from '../services/websocket';
import {
  setContext as setRtcContext,
  setCallbacks as setRtcCallbacks,
  startOffer,
  handleOffer,
  handleAnswer,
  handleIce,
  setMuted,
  setAudioInputDevice,
  endCall as rtcEnd,
} from '../services/webrtc';

type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface CallPanelProps {
  ticketId: number;
  selfId: number;
  selfName: string;
  selfRole: 'CUSTOMER' | 'AGENT' | 'ADMIN';
  /** The other party in the call. Required to know who to call. */
  peerId: number | null;
  peerName?: string;
  /** Optional: hide the call button (e.g. when peer not yet known) */
  disabledReason?: string;
}

const CallPanel = ({ ticketId, selfId, selfName, selfRole, peerId, peerName, disabledReason }: CallPanelProps) => {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [muted, setMutedState] = useState(false);
  const [incoming, setIncoming] = useState<CallSignal | null>(null);
  const [callerName, setCallerName] = useState<string>('');
  
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('');
  
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const wasConnectedRef = useRef(false);
  // Only the call initiator posts the "call ended" comment (like Messenger)
  const isInitiatorRef = useRef(false);

  // Fetch audio devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devs => {
      setDevices(devs);
      const audioInputs = devs.filter(d => d.kind === 'audioinput');
      const audioOutputs = devs.filter(d => d.kind === 'audiooutput');
      if (audioInputs.length > 0 && !selectedMic) setSelectedMic(audioInputs[0].deviceId);
      if (audioOutputs.length > 0 && !selectedSpeaker) setSelectedSpeaker(audioOutputs[0].deviceId);
    }).catch(err => console.warn('Could not enumerate devices', err));
  }, [selectedMic, selectedSpeaker]);

  // Apply speaker selection
  useEffect(() => {
    if (remoteAudioRef.current && selectedSpeaker && 'setSinkId' in remoteAudioRef.current) {
      // @ts-ignore - setSinkId is not in standard types yet
      remoteAudioRef.current.setSinkId(selectedSpeaker).catch(console.warn);
    }
  }, [selectedSpeaker]);

  // Apply mic selection
  useEffect(() => {
    if (selectedMic) {
      setAudioInputDevice(selectedMic).catch(console.warn);
    }
  }, [selectedMic]);

  // Format duration MM:SS
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Timer interval
  useEffect(() => {
    let interval: number;
    if (status === 'connected') {
      if (!startTimeRef.current) startTimeRef.current = Date.now();
      wasConnectedRef.current = true;
      interval = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current!) / 1000));
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => window.clearInterval(interval);
  }, [status]);

  // Ringtone control
  useEffect(() => {
    if (status === 'ringing' || (status === 'calling' && !incoming)) {
      if (ringtoneRef.current) {
        ringtoneRef.current.loop = true;
        ringtoneRef.current.play().catch(() => {/* ignore autoplay policy */});
      }
    } else {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    }
  }, [status, incoming]);

  const cleanup = useCallback(() => {
    rtcEnd();
    
    // Only the initiator (caller) posts the "call ended" comment — avoids duplicate messages
    if (isInitiatorRef.current && wasConnectedRef.current && startTimeRef.current) {
      const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      sendChatMessage({
        ticketId,
        senderId: selfId,
        senderName: selfName,
        senderRole: selfRole,
        content: `📞 Cuộc gọi đã kết thúc. Thời lượng: ${formatDuration(finalDuration)}`,
      });
    }

    setStatus('idle');
    setIncoming(null);
    setMutedState(false);
    setCallerName('');
    startTimeRef.current = null;
    wasConnectedRef.current = false;
    isInitiatorRef.current = false;
    setDuration(0);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, [ticketId, selfId, selfName, selfRole]);

  // Configure WebRTC callbacks once
  useEffect(() => {
    setRtcCallbacks({
      onRemoteStream: (stream) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch(err => console.warn('Audio play failed', err));
        }
        setStatus('connected');
      },
      onConnectionStateChange: (state) => {
        if (state === 'connected') setStatus('connected');
        else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
          setStatus('ended');
          setTimeout(cleanup, 1500);
        }
      },
    });
  }, [cleanup]);

  // Subscribe to call topic for this ticket
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    connectWebSocket()
      .then(() => {
        unsubscribe = subscribeToCall(ticketId, async (signal) => {
          // Ignore our own messages
          if (signal.senderId === selfId) return;

          // Filter targeted signals
          if (signal.targetUserId && signal.targetUserId !== selfId) return;

          switch (signal.type) {
            case 'CALL_REQUEST':
              setIncoming(signal);
              setCallerName(signal.senderName || 'Unknown');
              setStatus('ringing');
              break;

            case 'CALL_ACCEPT':
              // We are the caller - the other party accepted, start WebRTC offer
              setRtcContext({
                ticketId,
                selfId,
                selfName,
                selfRole,
                targetUserId: signal.senderId,
              });
              await startOffer();
              break;

            case 'CALL_REJECT':
              cleanup();
              break;

            case 'CALL_END':
              cleanup();
              break;

            case 'OFFER':
              // We are the callee - process offer
              setRtcContext({
                ticketId,
                selfId,
                selfName,
                selfRole,
                targetUserId: signal.senderId,
              });
              await handleOffer(signal);
              break;

            case 'ANSWER':
              await handleAnswer(signal);
              break;

            case 'ICE':
              await handleIce(signal);
              break;
          }
        });
      })
      .catch(err => console.error('[Call] WS connect failed', err));

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [ticketId, selfId, selfName, selfRole, cleanup]);

  // Auto-end if user navigates away
  useEffect(() => {
    const handleUnload = () => {
      if (status === 'connected' || status === 'calling') {
        sendCallSignal({
          type: 'CALL_END',
          ticketId,
          senderId: selfId,
          senderName: selfName,
          senderRole: selfRole,
        });
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [status, ticketId, selfId, selfName, selfRole]);

  const handleCallClick = () => {
    if (!peerId) return;
    isInitiatorRef.current = true; // mark this user as the caller
    setStatus('calling');
    sendCallSignal({
      type: 'CALL_REQUEST',
      ticketId,
      senderId: selfId,
      senderName: selfName,
      senderRole: selfRole,
      targetUserId: peerId,
    });
  };

  const handleAccept = () => {
    if (!incoming) return;
    sendCallSignal({
      type: 'CALL_ACCEPT',
      ticketId,
      senderId: selfId,
      senderName: selfName,
      senderRole: selfRole,
      targetUserId: incoming.senderId,
    });
    setStatus('calling'); // waiting for OFFER
    setIncoming(null);
  };

  const handleReject = () => {
    if (!incoming) return;
    sendCallSignal({
      type: 'CALL_REJECT',
      ticketId,
      senderId: selfId,
      senderName: selfName,
      senderRole: selfRole,
      targetUserId: incoming.senderId,
    });
    setIncoming(null);
    setStatus('idle');
  };

  const handleEnd = () => {
    sendCallSignal({
      type: 'CALL_END',
      ticketId,
      senderId: selfId,
      senderName: selfName,
      senderRole: selfRole,
    });
    cleanup();
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };

  const [minimized, setMinimized] = useState(false);

  const inCall = status === 'calling' || status === 'connected';
  const callBtnDisabled = !peerId || inCall || status === 'ringing' || !!disabledReason;

  return (
    <>
      {/* Audio elements */}
      <audio ref={remoteAudioRef} autoPlay />
      <audio ref={ringtoneRef} src="data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" preload="auto" loop />

      {/* Call button */}
      <button
        onClick={handleCallClick}
        disabled={callBtnDisabled}
        title={disabledReason || (peerId ? `Call ${peerName || 'peer'}` : 'No peer to call')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
          callBtnDisabled
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
        }`}
      >
        <Phone size={11} />
        Call
      </button>

      {/* Calling overlay (we initiated) */}
      {status === 'calling' && !incoming && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold mb-4 animate-pulse">
                {(peerName || '?').charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{peerName || 'Calling...'}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Calling…</p>
              <button
                onClick={handleEnd}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg transition-colors"
              >
                <PhoneOff size={18} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming call popup */}
      {incoming && status === 'ringing' && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mb-4 animate-pulse">
                {callerName.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{callerName}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Incoming audio call…</p>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleReject}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg transition-colors"
                >
                  <X size={18} />
                  Reject
                </button>
                <button
                  onClick={handleAccept}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg transition-colors"
                >
                  <PhoneCall size={18} />
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Minimized mini-window ── */}
      {status === 'connected' && minimized && (
        <div className="fixed bottom-6 right-6 z-[200] w-72 bg-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {(peerName || callerName || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{peerName || callerName}</p>
                <p className="text-lg font-mono font-bold text-emerald-400 tabular-nums">{formatDuration(duration)}</p>
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
              <button
                onClick={handleEnd}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition-all"
              >
                <PhoneOff size={14} /> Kết thúc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Full-screen In-Call Screen ── */}
      {status === 'connected' && !minimized && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 animate-in fade-in duration-300">
          {/* Background blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center gap-8 w-full max-w-sm px-6">
            {/* Top row: status + minimize */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-emerald-300 text-xs font-bold tracking-wider uppercase">Connected</span>
              </div>
              <button onClick={() => setMinimized(true)} className="text-slate-400 hover:text-white transition-colors p-2" title="Thu nhỏ">
                <Minimize2 size={20} />
              </button>
            </div>

            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl ring-4 ring-emerald-400/30">
                {(peerName || callerName || '?').charAt(0).toUpperCase()}
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping" />
            </div>

            {/* Name & timer */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">{peerName || callerName}</h2>
              <p className="text-3xl font-mono font-bold text-emerald-400 tracking-widest tabular-nums">{formatDuration(duration)}</p>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-5">
              {/* Mute */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleToggleMute}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                    muted
                      ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/40'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {muted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>
                <span className="text-xs text-slate-400 font-medium">{muted ? 'Unmute' : 'Mute'}</span>
              </div>

              {/* End Call — larger red circle */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleEnd}
                  className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white shadow-2xl shadow-red-500/40 transition-all active:scale-95 hover:scale-105"
                >
                  <PhoneOff size={28} />
                </button>
                <span className="text-xs text-slate-400 font-medium">End Call</span>
              </div>

              {/* Settings */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                    showSettings ? 'bg-white/25 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <Settings2 size={22} />
                </button>
                <span className="text-xs text-slate-400 font-medium">Settings</span>
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
                      className="w-full text-xs bg-white/10 border border-white/20 rounded-lg py-2 pl-3 pr-8 appearance-none focus:outline-none text-white"
                    >
                      {devices.filter(d => d.kind === 'audioinput').map(d => (
                        <option key={d.deviceId} value={d.deviceId} className="text-slate-900">{d.label || `Mic ${d.deviceId.slice(0, 8)}...`}</option>
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
                      className="w-full text-xs bg-white/10 border border-white/20 rounded-lg py-2 pl-3 pr-8 appearance-none focus:outline-none text-white"
                    >
                      {devices.filter(d => d.kind === 'audiooutput').map(d => (
                        <option key={d.deviceId} value={d.deviceId} className="text-slate-900">{d.label || `Speaker ${d.deviceId.slice(0, 8)}...`}</option>
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

      {/* Ended toast */}
      {status === 'ended' && (
        <div className="fixed bottom-6 right-6 z-[200] bg-slate-800 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold">
          Call ended
        </div>
      )}
    </>
  );
};

export default CallPanel;

import { useEffect, useRef, useState, useCallback } from 'react';
import { Phone, PhoneOff, PhoneCall, Mic, MicOff, X, Settings2, Speaker, ChevronDown, Minimize2, Maximize2, Video, VideoOff, MonitorUp, MonitorOff } from 'lucide-react';
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
  setVideoEnabled,
  startScreenShare,
  stopScreenShare,
  endCall as rtcEnd,
} from '../services/webrtc';

type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface CallPanelProps {
  ticketId: number;
  selfId: number;
  selfName: string;
  selfRole: 'CUSTOMER' | 'AGENT' | 'ADMIN';
  peerId: number | null;
  peerName?: string;
  disabledReason?: string;
}

const CallPanel = ({ ticketId, selfId, selfName, selfRole, peerId, peerName, disabledReason }: CallPanelProps) => {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [muted, setMutedState] = useState(false);
  const [videoEnabled, setVideoEnabledState] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [incoming, setIncoming] = useState<CallSignal | null>(null);
  const [callerName, setCallerName] = useState<string>('');
  
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('');
  
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const wasConnectedRef = useRef(false);
  const isInitiatorRef = useRef(false);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devs => {
      setDevices(devs);
      const audioInputs = devs.filter(d => d.kind === 'audioinput');
      const audioOutputs = devs.filter(d => d.kind === 'audiooutput');
      if (audioInputs.length > 0 && !selectedMic) setSelectedMic(audioInputs[0].deviceId);
      if (audioOutputs.length > 0 && !selectedSpeaker) setSelectedSpeaker(audioOutputs[0].deviceId);
    }).catch(err => console.warn('Could not enumerate devices', err));
  }, [selectedMic, selectedSpeaker]);

  useEffect(() => {
    if (remoteVideoRef.current && selectedSpeaker && 'setSinkId' in remoteVideoRef.current) {
      // @ts-ignore
      remoteVideoRef.current.setSinkId(selectedSpeaker).catch(console.warn);
    }
  }, [selectedSpeaker]);

  useEffect(() => {
    if (selectedMic) {
      setAudioInputDevice(selectedMic).catch(console.warn);
    }
  }, [selectedMic]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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

  useEffect(() => {
    if (status === 'ringing' || (status === 'calling' && !incoming)) {
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
  }, [status, incoming]);

  const cleanup = useCallback(() => {
    rtcEnd();
    
    if (isInitiatorRef.current && wasConnectedRef.current && startTimeRef.current) {
      const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      sendChatMessage({
        ticketId,
        senderId: selfId,
        senderName: selfName,
        senderRole: selfRole,
        content: `📞 Video Call ended. Duration: ${formatDuration(finalDuration)}`,
      });
    }

    setStatus('idle');
    setIncoming(null);
    setMutedState(false);
    setVideoEnabledState(true);
    setIsScreenSharing(false);
    setCallerName('');
    startTimeRef.current = null;
    wasConnectedRef.current = false;
    isInitiatorRef.current = false;
    setDuration(0);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  }, [ticketId, selfId, selfName, selfRole]);

  useEffect(() => {
    setRtcCallbacks({
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(err => console.warn('Video play failed', err));
        }
        setStatus('connected');
      },
      onLocalStream: (stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(err => console.warn('Local video play failed', err));
        }
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

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    connectWebSocket()
      .then(() => {
        unsubscribe = subscribeToCall(ticketId, async (signal) => {
          if (signal.senderId === selfId) return;
          if (signal.targetUserId && signal.targetUserId !== selfId) return;
          switch (signal.type) {
            case 'CALL_REQUEST':
              setIncoming(signal);
              setCallerName(signal.senderName || 'Unknown');
              setStatus('ringing');
              break;
            case 'CALL_ACCEPT':
              setRtcContext({ ticketId, selfId, selfName, selfRole, targetUserId: signal.senderId });
              await startOffer();
              break;
            case 'CALL_REJECT':
            case 'CALL_END':
              cleanup();
              break;
            case 'OFFER':
              setRtcContext({ ticketId, selfId, selfName, selfRole, targetUserId: signal.senderId });
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
    return () => { if (unsubscribe) unsubscribe(); };
  }, [ticketId, selfId, selfName, selfRole, cleanup]);

  useEffect(() => {
    const handleUnload = () => {
      if (status === 'connected' || status === 'calling') {
        sendCallSignal({ type: 'CALL_END', ticketId, senderId: selfId, senderName: selfName, senderRole: selfRole });
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [status, ticketId, selfId, selfName, selfRole]);

  const handleCallClick = () => {
    if (!peerId) return;
    isInitiatorRef.current = true;
    setStatus('calling');
    sendCallSignal({ type: 'CALL_REQUEST', ticketId, senderId: selfId, senderName: selfName, senderRole: selfRole, targetUserId: peerId });
  };

  const handleAccept = () => {
    if (!incoming) return;
    sendCallSignal({ type: 'CALL_ACCEPT', ticketId, senderId: selfId, senderName: selfName, senderRole: selfRole, targetUserId: incoming.senderId });
    setStatus('calling');
    setIncoming(null);
  };

  const handleReject = () => {
    if (!incoming) return;
    sendCallSignal({ type: 'CALL_REJECT', ticketId, senderId: selfId, senderName: selfName, senderRole: selfRole, targetUserId: incoming.senderId });
    setIncoming(null);
    setStatus('idle');
  };

  const handleEnd = () => {
    sendCallSignal({ type: 'CALL_END', ticketId, senderId: selfId, senderName: selfName, senderRole: selfRole });
    cleanup();
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };
  
  const handleToggleVideo = async () => {
    const next = !videoEnabled;
    try {
      await setVideoEnabled(next);
      setVideoEnabledState(next);
    } catch (err) {
      console.error('Failed to toggle video', err);
    }
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
      setIsScreenSharing(false);
    } else {
      try {
        await startScreenShare(() => setIsScreenSharing(false));
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Failed to share screen', err);
      }
    }
  };

  const [minimized, setMinimized] = useState(false);
  const inCall = status === 'calling' || status === 'connected';
  const callBtnDisabled = !peerId || inCall || status === 'ringing' || !!disabledReason;

  return (
    <>
      <audio ref={ringtoneRef} src="data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" preload="auto" loop />

      {/* Call button */}
      <button
        onClick={handleCallClick}
        disabled={callBtnDisabled}
        title={disabledReason || (peerId ? `Video Call ${peerName || 'peer'}` : 'No peer to call')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
          callBtnDisabled
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
            : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50'
        }`}
      >
        <Video size={14} />
        Video Call
      </button>

      {/* Calling overlay */}
      {status === 'calling' && !incoming && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-4 animate-pulse">
                {(peerName || '?').charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{peerName || 'Calling...'}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Calling video…</p>
              <button onClick={handleEnd} className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg transition-colors">
                <PhoneOff size={18} /> Cancel
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
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-4 animate-pulse">
                {callerName.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{callerName}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Incoming video call…</p>
              <div className="flex gap-4 mt-6">
                <button onClick={handleReject} className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg transition-colors">
                  <X size={18} /> Reject
                </button>
                <button onClick={handleAccept} className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold shadow-lg transition-colors">
                  <Video size={18} /> Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimized view */}
      {status === 'connected' && minimized && (
        <div className="fixed bottom-6 right-6 z-[200] w-72 bg-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div className="p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {(peerName || callerName || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{peerName || callerName}</p>
                <p className="text-lg font-mono font-bold text-indigo-400 tabular-nums">{formatDuration(duration)}</p>
              </div>
              <button onClick={() => setMinimized(false)} className="text-slate-400 hover:text-white transition-colors" title="Expand">
                <Maximize2 size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleToggleMute} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${muted ? 'bg-amber-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                {muted ? <MicOff size={14} /> : <Mic size={14} />} {muted ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={handleEnd} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition-all">
                <PhoneOff size={14} /> End
              </button>
            </div>
          </div>
          {/* We still need remote video hidden somewhere to keep audio playing */}
          <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
          <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
        </div>
      )}

      {/* Full-screen Video Call UI */}
      {status === 'connected' && !minimized && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-slate-950 animate-in fade-in duration-300">
          
          {/* Main Video Area */}
          <div className="relative flex-1 w-full h-full overflow-hidden bg-black flex items-center justify-center">
            {/* Remote Video (Fullscreen) */}
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-contain"
            />
            
            {/* Local Video (PiP corner) */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8 w-32 sm:w-48 md:w-64 aspect-video bg-slate-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 z-10 transition-all hover:scale-105">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${videoEnabled && !isScreenSharing ? 'scale-x-[-1]' : ''}`}
              />
              {(!videoEnabled && !isScreenSharing) && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                  <VideoOff className="text-white/50" size={32} />
                </div>
              )}
            </div>

            {/* Top Overlay: Name & Timer */}
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-white drop-shadow-md">{peerName || callerName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  <span className="font-mono text-indigo-300 drop-shadow-md">{formatDuration(duration)}</span>
                </div>
              </div>
              <button onClick={() => setMinimized(true)} className="p-3 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-colors border border-white/10 shadow-xl" title="Minimize">
                <Minimize2 size={20} />
              </button>
            </div>
          </div>

          {/* Bottom Controls (Glassmorphism) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-6 p-4 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            {/* Mute */}
            <button
              onClick={handleToggleMute}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 ${
                muted ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {/* Camera */}
            <button
              onClick={handleToggleVideo}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 ${
                !videoEnabled ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {!videoEnabled ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
            
            {/* Share Screen */}
            <button
              onClick={handleToggleScreenShare}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 ${
                isScreenSharing ? 'bg-indigo-500 text-white shadow-indigo-500/30' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            >
              {isScreenSharing ? <MonitorOff size={24} /> : <MonitorUp size={24} />}
            </button>

            {/* End Call */}
            <button
              onClick={handleEnd}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white shadow-xl shadow-red-500/40 transition-all hover:scale-105 active:scale-95 ml-2 sm:ml-4"
              title="End call"
            >
              <PhoneOff size={28} />
            </button>

            {/* Settings */}
            <div className="relative ml-2 sm:ml-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  showSettings ? 'bg-white/30 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Settings2 size={20} />
              </button>
              
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-4 w-64 p-4 bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-2xl space-y-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5"><Mic size={12} /> Mic</label>
                    <select
                      value={selectedMic}
                      onChange={e => setSelectedMic(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {devices.filter(d => d.kind === 'audioinput').map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || 'Unknown Mic'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5"><Speaker size={12} /> Speaker</label>
                    <select
                      value={selectedSpeaker}
                      onChange={e => setSelectedSpeaker(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {devices.filter(d => d.kind === 'audiooutput').map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || 'Unknown Speaker'}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
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

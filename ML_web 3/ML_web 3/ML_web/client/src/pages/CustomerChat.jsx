import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle, Send, Phone, PhoneOff, User, Mic, MicOff,
  Loader2, Headphones, XCircle, ArrowRight, MessageSquare,
  ShieldCheck, Zap, HeartHandshake, Smile
} from 'lucide-react';
import { startChat, sendChatMessage, getChatConversation, recordCallEvent, closeChat, fetchGames } from '../services/api';
import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:8080";
const ACTIVE_CHAT_STORAGE_KEY = 'ml_web_customer_active_chat';
const CHAT_ARCHIVE_STORAGE_KEY = 'ml_web_customer_chat_history';

export default function CustomerChat() {
  const [phase, setPhase] = useState('welcome'); // welcome | chatting
  const [customerName, setCustomerName] = useState('');
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [assignedAgent, setAssignedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Call states
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const messagesEnd = useRef(null);
  const pollRef = useRef(null);
  const callTimerRef = useRef(null);

  // WebRTC refs
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const scrollToBottom = () => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchGames()
      .then((items) => {
        setGames(items || []);
      })
      .catch(() => {
        setGames([]);
      });
  }, []);

  const archiveCurrentConversation = () => {
    if (!conversationId || !messages.length) return;

    try {
      const raw = localStorage.getItem(CHAT_ARCHIVE_STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      const normalized = Array.isArray(existing) ? existing : [];

      const archiveItem = {
        conversationId,
        customerName,
        selectedGame,
        assignedAgent,
        messages,
        endedAt: new Date().toISOString()
      };

      const withoutSameConversation = normalized.filter(
        (item) => Number(item?.conversationId) !== Number(conversationId)
      );

      localStorage.setItem(
        CHAT_ARCHIVE_STORAGE_KEY,
        JSON.stringify([archiveItem, ...withoutSameConversation].slice(0, 20))
      );
    } catch (_) {
      // Ignore localStorage failures.
    }
  };

  const syncConversation = async (targetConversationId) => {
    if (!targetConversationId) return null;
    const data = await getChatConversation(targetConversationId);
    if (data.messages) setMessages(data.messages);
    if (data.game?.id) {
      setSelectedGame(data.game);
      setSelectedGameId(String(data.game.id));
    }
    if (data.employee?.id) {
      setAssignedAgent({
        id: data.employee.id,
        name: data.employee.name,
        team: data.employee.team
      });
    } else {
      setAssignedAgent(null);
    }
    return data;
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);
      if (saved?.phase === 'chatting' && saved?.conversationId) {
        setPhase('chatting');
        setCustomerName(saved.customerName || '');
        setConversationId(saved.conversationId);
        setSelectedGame(saved.selectedGame || null);
        setSelectedGameId(saved.selectedGame?.id ? String(saved.selectedGame.id) : '');
        setAssignedAgent(saved.assignedAgent || null);
        setMessages(Array.isArray(saved.messages) ? saved.messages : []);
      }
    } catch (_) {
      // Ignore corrupted localStorage payload.
    }
  }, []);

  useEffect(() => {
    try {
      if (phase === 'chatting' && conversationId) {
        localStorage.setItem(
          ACTIVE_CHAT_STORAGE_KEY,
          JSON.stringify({
            phase,
            customerName,
            conversationId,
            selectedGame,
            assignedAgent,
            messages,
            updatedAt: new Date().toISOString()
          })
        );
      } else {
        localStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
      }
    } catch (_) {
      // Ignore localStorage failures.
    }
  }, [phase, customerName, conversationId, selectedGame, assignedAgent, messages]);

  // Handle polling for messages
  useEffect(() => {
    if (conversationId && phase === 'chatting') {
      pollRef.current = setInterval(async () => {
        try {
          await syncConversation(conversationId);
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [conversationId, phase]);

  // Initialize socket when conversation starts
  useEffect(() => {
    if (conversationId && phase === 'chatting' && !socketRef.current) {
      socketRef.current = io(socketUrl);
      socketRef.current.emit('join-room', conversationId);

      socketRef.current.on('offer', async (data) => {
        await handleReceiveOffer(data.offer);
      });

      socketRef.current.on('answer', async (data) => {
        if (peerRef.current) {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });

      socketRef.current.on('ice-candidate', async (data) => {
        if (peerRef.current && data.candidate) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      });

      socketRef.current.on("call-ended", () => {
         endCallCleanup();
      });

      socketRef.current.on('chat-assigned', async (data) => {
        if (Number(data?.conversationId) !== Number(conversationId)) return;
        if (data?.agentName) {
          setAssignedAgent((prev) => ({
            id: data.assignedAgentId || prev?.id || null,
            name: data.agentName,
            team: prev?.team || null
          }));
        }
        try {
          await syncConversation(conversationId);
        } catch (_) {}
      });

      socketRef.current.on('chat-list-updated', async (data) => {
        if (data?.conversationId && Number(data.conversationId) !== Number(conversationId)) {
          return;
        }
        try {
          await syncConversation(conversationId);
        } catch (_) {}
      });

      socketRef.current.on('chat-closed', () => {
         alert("The agent has ended the chat.");
        archiveCurrentConversation();
         endChatCleanup();
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [conversationId, phase]);

  const handleStart = async () => {
    if (!customerName.trim() || !selectedGameId || isInitializing) return;
    setIsInitializing(true);
    try {
      const data = await startChat({
        customerName: customerName.trim(),
        language: 'en',
        gameId: Number(selectedGameId)
      });
      setConversationId(data.conversationId);
      setPhase('chatting');
      if (data.game) {
        setSelectedGame(data.game);
      } else {
        const game = games.find((item) => Number(item.id) === Number(selectedGameId));
        setSelectedGame(game || null);
      }
      await sendChatMessage({
        conversationId: data.conversationId,
        senderType: 'customer',
        text: `Hello, I'm ${customerName.trim()}. I need help.`
      });
      await syncConversation(data.conversationId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await sendChatMessage({
        conversationId,
        senderType: 'customer',
        text: input.trim()
      });
      setInput('');
      await syncConversation(conversationId);
      socketRef.current?.emit('new-message', { roomId: conversationId });
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const initWebRTC = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    stream.getTracks().forEach(track => { peer.addTrack(track, stream); });
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', { roomId: conversationId, candidate: event.candidate });
      }
    };
    peer.ontrack = (event) => {
      if (remoteAudioRef.current) { remoteAudioRef.current.srcObject = event.streams[0]; }
    };
    peerRef.current = peer;
    return peer;
  };

  const handleStartCall = async () => {
    try {
      const peer = await initWebRTC();
      setIsCalling(true);
      setCallDuration(0);
      callTimerRef.current = setInterval(() => { setCallDuration(prev => prev + 1); }, 1000);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socketRef.current.emit('offer', { roomId: conversationId, offer });
      await recordCallEvent(conversationId, { event: 'start', caller: 'customer' });
    } catch (e) {
      console.error("Call failed", e);
      alert("Please allow microphone access to start the call.");
    }
  };

  const handleReceiveOffer = async (offerDesc) => {
    try {
      const peer = await initWebRTC();
      setIsCalling(true);
      setCallDuration(0);
      callTimerRef.current = setInterval(() => { setCallDuration(prev => prev + 1); }, 1000);
      await peer.setRemoteDescription(new RTCSessionDescription(offerDesc));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socketRef.current.emit('answer', { roomId: conversationId, answer });
    } catch (e) { console.error("Failed to answer", e); }
  };

  const endCallCleanup = () => {
    setIsCalling(false);
    clearInterval(callTimerRef.current);
    if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
  };

  const endChatCleanup = () => {
    endCallCleanup();
    setPhase('welcome');
    setMessages([]);
    setSelectedGame(null);
    setSelectedGameId('');
    setAssignedAgent(null);
    setConversationId(null);
    if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
  };

  const handleEndChat = async () => {
    if (!confirm("End this conversation?")) return;

    try {
      if (conversationId) {
        await closeChat(conversationId);
      }
    } catch (e) {
      console.error('Failed to close conversation on server:', e);
    } finally {
      socketRef.current?.emit("end-chat", { roomId: conversationId });
      archiveCurrentConversation();
      endChatCleanup();
    }
  };

  const handleEndCall = async () => {
    const duration = callDuration;
    endCallCleanup();
    socketRef.current?.emit("call-ended", { roomId: conversationId });
    if (conversationId) {
      try {
        await recordCallEvent(conversationId, { event: 'end', caller: 'customer', durationSec: duration });
      } catch (e) { console.error('Failed to record call event:', e); }
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // === SIMPLE & MODERN WELCOME SCREEN ===
  if (phase === 'welcome') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[440px]">
          {/* Logo/Icon Area */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-sm">
               <Headphones className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Support Center</h1>
            <p className="text-slate-500 mt-2 text-lg">Help is just a message away.</p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block ml-1">Your Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-300" />
                  </div>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:bg-white transition-all text-lg placeholder:text-slate-300"
                    placeholder="E.g. John Doe"
                    autoFocus
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleStart()}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block ml-1">Game</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:bg-white transition-all text-base"
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                >
                  <option value="">Select a game for support</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>{game.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleStart}
                disabled={!customerName.trim() || !selectedGameId || isInitializing}
                className={`w-full py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2 transition-all shadow-sm ${
                  isInitializing || !customerName.trim() || !selectedGameId ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 active:scale-[0.98]'
                }`}
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Chatting
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-pink-600 shadow-sm">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-600">Quick Reply</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-600">Secure</span>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-slate-400 text-sm font-medium">
            Available 24/7 for your convenience.
          </p>
        </div>
      </div>
    );
  }

  // === SIMPLE & MODERN CHAT SCREEN ===
  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <audio ref={remoteAudioRef} autoPlay />

      {/* Clean Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center text-white">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 leading-tight">Expert Support</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isCalling ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                {isCalling ? 'In Call' : 'Online'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCalling ? (
            <button
              onClick={handleStartCall}
              className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
              title="Voice Call"
            >
              <Phone className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
              <span className="px-2 text-sm font-mono font-bold text-slate-700">{formatDuration(callDuration)}</span>
              <button
                onClick={toggleMute}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isMuted ? 'bg-rose-100 text-rose-600' : 'bg-white text-slate-600 shadow-sm'}`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={handleEndCall}
                className="w-8 h-8 flex items-center justify-center bg-rose-600 text-white rounded-lg shadow-sm"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="w-px h-6 bg-slate-200 mx-2" />
          <button
            onClick={handleEndChat}
            className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-xl transition-colors"
            title="End Chat"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Welcome Prompt */}
          <div className="flex justify-center mb-8">
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest shadow-sm">
              Session Started{selectedGame?.name ? ` • ${selectedGame.name}` : ''}
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-full text-[11px] font-semibold text-slate-600 shadow-sm">
              {assignedAgent?.name
                ? `Your support agent: ${assignedAgent.name}`
                : 'Waiting for an agent to join...'}
            </div>
          </div>

          {messages.map((msg) => {
            const isCustomer = msg.senderType === 'customer';
            return (
              <div key={msg.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} animate-message-in`}>
                <div className="max-w-[85%] sm:max-w-[70%]">
                  {!isCustomer && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-2">
                      {assignedAgent?.name || 'Support Agent'}
                    </p>
                  )}
                  <div className={`px-5 py-3.5 rounded-[1.5rem] shadow-sm ${
                    isCustomer
                      ? 'bg-pink-600 text-white rounded-tr-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                  }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                    <p className={`text-[10px] mt-2 ${isCustomer ? 'text-pink-100' : 'text-slate-400'} text-right font-mono`}>
                      {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEnd} />
        </div>
      </div>

      {/* Simple Input Footer */}
      <div className="bg-white border-t border-slate-200 p-6 shrink-0">
        <div className="max-w-3xl mx-auto flex items-end gap-4">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-pink-600 focus-within:bg-white transition-all">
            <textarea
              rows={1}
              className="w-full px-5 py-4 bg-transparent border-none outline-none resize-none text-[15px] text-slate-800 placeholder:text-slate-400 font-medium"
              placeholder="Type your message here..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all shadow-sm ${
              !input.trim() || sending
              ? 'bg-slate-100 text-slate-300'
              : 'bg-pink-600 text-white hover:bg-pink-700 active:scale-95'
            }`}
          >
            {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
          Secure End-to-End Chat
        </p>
      </div>
    </div>
  );
}

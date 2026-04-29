import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Send, Users, CheckCircle, Clock, Loader2,
  ArrowRight, UserCheck, XCircle, RefreshCw, Phone, Headphones, Search, Mic, MicOff, PhoneOff
} from 'lucide-react';
import {
  listActiveChats, getChatConversation, sendChatMessage,
  assignAgentToChat, closeChat as closeChatApi,
  analyzeConversation, recordCallEvent
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const GAME_SUPPORT_QUESTIONS = [
  'What issue are you facing when logging into the game?',
  'Could you share your character ID or account ID so I can check quickly?',
  'Which device are you using when the issue happens (iOS, Android, or PC)?',
  'After updating to the latest version, does the issue still appear?',
  'Do you need priority support for top-up, missing items, or match connection issues?'
];

const GAME_QUICK_REPLIES = [
  'I have received your request and I am checking your account now.',
  'Please restart the game and try logging in again after 2-3 minutes.',
  'I have recorded your top-up issue and escalated it to our technical team.',
  'Please send a screenshot of the error so we can resolve it faster.',
  'Thank you for waiting. I will update you as soon as I have more information.'
];

export default function AgentChat() {
  const { user } = useAuth();
  const { getSocket } = useSocket();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);

  // Call states
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const messagesEnd = useRef(null);
  const callTimerRef = useRef(null);
  const selectedChatRef = useRef(null);
  const templateMenuRef = useRef(null);

  // WebRTC
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Keep selectedChatRef in sync
  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);

  const scrollToBottom = () => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    setIsTemplateMenuOpen(false);
  }, [selectedChat?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!templateMenuRef.current) return;
      if (!templateMenuRef.current.contains(event.target)) {
        setIsTemplateMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ──── Load active chats ────
  const refreshChats = useCallback(async () => {
    try {
      const data = await listActiveChats({ employeeId: user?.id });
      setChats(data);
    } catch (e) {
      console.error('[AgentChat] Failed to load chats', e);
    }
  }, [user?.id]);

  const loadConversationForAgent = useCallback(async (conversationId) => {
    const data = await getChatConversation(conversationId, { employeeId: user?.id });
    setMessages(data.messages || []);
    return data;
  }, [user?.id]);

  useEffect(() => {
    refreshChats().then(() => setLoading(false));
  }, [refreshChats]);

  // Poll chats every 5s as fallback
  useEffect(() => {
    const interval = setInterval(refreshChats, 5000);
    return () => clearInterval(interval);
  }, [refreshChats]);

  // ──── Socket.IO Setup ────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Listen for realtime chat list updates from other agents
    const handleChatListUpdated = () => {
      refreshChats();
    };

    // Force logout from another session
    const handleForceLogout = () => {
      alert('Your session was ended because you logged in from another device.');
    };

    socket.on('chat-list-updated', handleChatListUpdated);
    socket.on('force-logout', handleForceLogout);

    return () => {
      socket.off('chat-list-updated', handleChatListUpdated);
      socket.off('force-logout', handleForceLogout);
    };
  }, [getSocket, refreshChats]);

  // ──── Socket room join + WebRTC listeners for selected chat ────
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedChat) return;

    socket.emit('join-room', selectedChat.id);

    const handleOffer = async (data) => {
      await handleReceiveOffer(data.offer, selectedChat.id);
    };
    const handleAnswer = async (data) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    };
    const handleIceCandidate = async (data) => {
      if (peerRef.current && data.candidate) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };
    const handleCallEnded = () => { endCallCleanup(); };
    const handleChatClosed = () => {
      alert("Customer has ended the chat.");
      endCallCleanup();
      setSelectedChat(null);
      setMessages([]);
      refreshChats();
    };
    const handleMessageReceived = () => {
      // Refresh messages for this conversation
      loadConversationForAgent(selectedChat.id)
        .catch((error) => {
          if (error?.response?.status === 403) {
            setSelectedChat(null);
            setMessages([]);
            refreshChats();
          }
        });
    };

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-ended', handleCallEnded);
    socket.on('chat-closed', handleChatClosed);
    socket.on('message-received', handleMessageReceived);

    return () => {
      socket.emit('leave-room', selectedChat.id);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-ended', handleCallEnded);
      socket.off('chat-closed', handleChatClosed);
      socket.off('message-received', handleMessageReceived);
    };
  }, [selectedChat?.id, getSocket, loadConversationForAgent, refreshChats]);

  // Poll messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;
    const interval = setInterval(async () => {
      try {
        await loadConversationForAgent(selectedChat.id);
      } catch (error) {
        if (error?.response?.status === 403) {
          setSelectedChat(null);
          setMessages([]);
          refreshChats();
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedChat?.id, loadConversationForAgent, refreshChats]);

  // ──── Select a chat ────
  const handleSelectChat = async (chat) => {
    endCallCleanup();
    setSelectedChat(chat);
    try {
      await loadConversationForAgent(chat.id);

      // Auto-assign if unassigned
      if (!chat.employeeId && user?.id) {
        await assignAgentToChat(chat.id, user.id);
        const socket = getSocket();
        if (socket) {
          socket.emit('chat-assigned', {
            conversationId: chat.id,
            agentId: user.id,
            agentName: user.name
          });
        }
        await refreshChats();
        const updated = (await listActiveChats({ employeeId: user?.id })).find(c => c.id === chat.id);
        if (updated) setSelectedChat(updated);
      }
    } catch (e) {
      if (e?.response?.status === 403) {
        setSelectedChat(null);
        setMessages([]);
      }
      console.error(e);
    }
  };

  // ──── Send message + auto-assign on first reply ────
  const handleSend = async () => {
    if (!input.trim() || sending || !selectedChat) return;
    setSending(true);
    try {
      // If this is the first employee message and chat is unassigned → assign
      const isUnassigned = !selectedChat.employeeId;
      if (isUnassigned && user?.id) {
        await assignAgentToChat(selectedChat.id, user.id);
        const socket = getSocket();
        if (socket) {
          socket.emit('chat-assigned', {
            conversationId: selectedChat.id,
            agentId: user.id,
            agentName: user.name
          });
        }
      }

      await sendChatMessage({
        conversationId: selectedChat.id,
        senderType: 'employee',
        text: input.trim()
      });
      setInput('');

      // Notify via socket
      const socket = getSocket();
      if (socket) {
        socket.emit('new-message', { roomId: selectedChat.id });
      }

      await loadConversationForAgent(selectedChat.id);
      await refreshChats();

      // Update selectedChat reference if it was assigned
      if (isUnassigned) {
        const updated = (await listActiveChats({ employeeId: user?.id })).find(c => c.id === selectedChat.id);
        if (updated) setSelectedChat(updated);
      }
    } catch (e) {
      if (e?.response?.status === 403) {
        setSelectedChat(null);
        setMessages([]);
        await refreshChats();
      }
      console.error(e);
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

  const applyTemplate = (template) => {
    setInput((prev) => (prev ? `${prev}\n${template}` : template));
    setIsTemplateMenuOpen(false);
  };

  const handleClose = async () => {
    if (!selectedChat) return;
    try {
      await closeChatApi(selectedChat.id);
      const socket = getSocket();
      socket?.emit("end-chat", { roomId: selectedChat.id });
      endCallCleanup();
      setSelectedChat(null);
      setMessages([]);
      await refreshChats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedChat) return;
    setAnalyzing(true);
    try {
      await analyzeConversation(selectedChat.id);
      alert("NLP analysis complete! View results on Analytics page.");
    } catch (e) {
      console.error(e);
      alert("Error analyzing: " + (e.response?.data?.message || e.message));
    } finally {
      setAnalyzing(false);
    }
  };

  // ──── WebRTC ────
  const initWebRTC = async (roomId) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    stream.getTracks().forEach(track => {
      peer.addTrack(track, stream);
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        socket?.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    peer.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    peerRef.current = peer;
    return peer;
  };

  const handleStartCall = async () => {
    if (!selectedChat) return;
    try {
      const peer = await initWebRTC(selectedChat.id);
      setIsCalling(true);
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const socket = getSocket();
      socket?.emit('offer', { roomId: selectedChat.id, offer });

      await recordCallEvent(selectedChat.id, { event: 'start', caller: 'employee' });
    } catch (e) {
      console.error("Call failed", e);
      alert("Microphone permission denied or WebRTC not supported.");
    }
  };

  const handleReceiveOffer = async (offerDesc, roomId) => {
    try {
      const peer = await initWebRTC(roomId);
      setIsCalling(true);
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      await peer.setRemoteDescription(new RTCSessionDescription(offerDesc));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      const socket = getSocket();
      socket?.emit('answer', { roomId, answer });
    } catch (e) {
      console.error("Failed to answer", e);
    }
  };

  const endCallCleanup = () => {
    setIsCalling(false);
    clearInterval(callTimerRef.current);
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
  };

  const handleEndCall = async () => {
    if (!selectedChat) return;
    const roomId = selectedChat.id;
    const duration = callDuration;
    endCallCleanup();
    const socket = getSocket();
    socket?.emit("call-ended", { roomId });

    try {
      await recordCallEvent(roomId, {
        event: 'end',
        caller: 'employee',
        durationSec: duration
      });
    } catch (e) {
      console.error('Failed to record call event:', e);
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

  // ──── Filter chats: only show MY chats or UNASSIGNED ────
  const filteredChats = chats.filter(c => {
    if (!c.customer) return false;
    const normalizedRole = String(user?.role || "").trim().toLowerCase();
    const isAdmin = normalizedRole === "admin" || normalizedRole === "leader";
    const isMineOrUnassigned = !c.employeeId || c.employeeId === user?.id || isAdmin;
    return matchesSearch && isMineOrUnassigned;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col flex-1 gap-0 bg-white">
      <audio ref={remoteAudioRef} autoPlay />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-50 rounded-xl text-pink-600">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Agent Chat Console</h1>
            <p className="text-xs text-slate-500">Receive and reply to customer chats • <strong>{user?.name}</strong></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
            <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block mr-1.5 animate-pulse"></span>
            Online
          </span>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            {filteredChats.length} conversations
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden bg-white min-h-0">
        {/* Sidebar - Chat List */}
        <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50 shrink-0">
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-pink-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm p-4">
                <MessageSquare className="w-10 h-10 mb-3 text-slate-300" />
                <p>No active conversations</p>
              </div>
            ) : filteredChats.map(chat => {
              const isAssigned = !!chat.employeeId;
              const isMine = chat.employeeId === user?.id;

              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full text-left p-3 border-b border-slate-100 hover:bg-pink-50/70 transition-colors ${
                    selectedChat?.id === chat.id ? 'bg-pink-50 border-l-4 border-l-pink-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      isAssigned && isMine ? 'bg-emerald-100 text-emerald-700' : 'bg-pink-100 text-pink-700'
                    }`}>
                      {(chat.customer?.name || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900 text-sm truncate">{chat.customer?.name || 'Anonymous'}</p>
                        <span className="text-[10px] text-slate-400">{chat.messageCount} msgs</span>
                      </div>
                      {chat.lastMessage && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{chat.lastMessage.text}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {chat.game?.name && (
                          <span className="text-[10px] bg-fuchsia-100 text-fuchsia-700 font-bold px-1.5 py-0.5 rounded">
                            {chat.game.name}
                          </span>
                        )}
                        {isMine ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Mine
                          </span>
                        ) : isAssigned && chat.employee ? (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">{chat.employee.name}</span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Waiting
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          chat.status === 'open' ? 'bg-pink-50 text-pink-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {chat.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Chat Area */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-bold">
                  {(selectedChat.customer?.name || '?').charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedChat.customer?.name || 'Anonymous'}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    {selectedChat.employeeId === user?.id ? 'Assigned to you' : !selectedChat.employeeId ? 'Unassigned — reply to claim' : `Assigned to ${selectedChat.employee?.name}`}
                    {selectedChat.game?.name ? ` • ${selectedChat.game.name}` : ''}
                     • #{selectedChat.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isCalling ? (
                  <button
                    onClick={handleStartCall}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors mr-2 border border-emerald-200"
                    title="Voice Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 mr-2">
                    <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md animate-pulse flex items-center gap-1">
                      <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                      {formatDuration(callDuration)}
                    </span>
                    <button
                      onClick={toggleMute}
                      className={`p-1.5 rounded-lg transition-colors ${isMuted ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleEndCall}
                      className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                      title="End Call"
                    >
                      <PhoneOff className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button onClick={handleAnalyze} disabled={analyzing}
                  className="text-xs px-2 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-semibold flex items-center gap-1">
                  {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  NLP
                </button>
                <button onClick={handleClose}
                  className="text-xs px-2 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-semibold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Close
                </button>
              </div>
            </div>

            {/* Unassigned banner */}
            {!selectedChat.employeeId && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700 font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                This conversation is unassigned. <strong>Send a message to claim it.</strong>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/30">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderType === 'customer' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] ${msg.senderType === 'customer'
                    ? 'bg-white text-slate-900 rounded-2xl rounded-bl-md border border-slate-200 shadow-sm'
                    : 'bg-gradient-to-br from-pink-600 to-rose-600 text-white rounded-2xl rounded-br-md shadow-md shadow-pink-500/15'
                  } px-4 py-2.5`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.senderType === 'customer' ? 'text-slate-400' : 'text-pink-200'} text-right`}>
                      {new Date(msg.sentAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEnd} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-200 bg-white">
              <div className="flex items-end gap-2">
                <div className="relative" ref={templateMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsTemplateMenuOpen((prev) => !prev)}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xl leading-none"
                    title="Open quick templates"
                  >
                    +
                  </button>

                  {isTemplateMenuOpen && (
                    <div className="absolute left-0 bottom-12 w-[360px] max-w-[80vw] bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-20">
                      <div className="mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Game Support Questions</p>
                        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                          {GAME_SUPPORT_QUESTIONS.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => applyTemplate(item)}
                              className="text-left text-xs px-2.5 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Quick Replies</p>
                        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                          {GAME_QUICK_REPLIES.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => applyTemplate(item)}
                              className="text-left text-xs px-2.5 py-2 rounded-lg bg-pink-50 text-pink-800 border border-pink-200 hover:bg-pink-100 transition-colors"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <textarea
                  rows={1}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none resize-none text-sm"
                  placeholder="Reply to customer..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="p-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl shadow-md disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-lg font-semibold text-slate-500">Select a conversation</p>
            <p className="text-sm text-slate-400 mt-1">Select a conversation from the left to start replying</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, Send, Paperclip, Image, Mic, MicOff } from 'lucide-react';
import {
  getConversationMessages,
  type DirectMessagePayload,
  uploadMessageFile,
} from '../api/apiClient';
import { subscribeToDm, sendDmMessage } from '../services/websocket';
import { useAuth } from '../context/auth';

// Support topic display config
const TOPIC_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  TECHNICAL: { label: 'Lỗi kỹ thuật', icon: '🔧', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  BILLING: { label: 'Thanh toán', icon: '💳', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  ACCOUNT: { label: 'Tài khoản', icon: '👤', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  GENERAL: { label: 'Chung', icon: '❓', color: 'bg-amber-100 text-amber-700 border-amber-200' },
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

interface Props {
  supportRequest: {
    id: number;
    customerName: string;
    topic: string;
    description: string;
    conversationId: number;
    createdAt: string;
  };
  onClose: () => void;
  onConversationUpdated: () => void;
}

const SupportRequestDetail = ({ supportRequest, onClose, onConversationUpdated }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectMessagePayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const topic = TOPIC_CONFIG[supportRequest.topic] || TOPIC_CONFIG.GENERAL;
  const isWaitingRequest = supportRequest.conversationId === 0;

  const loadMessages = useCallback(async () => {
    if (isWaitingRequest) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getConversationMessages(supportRequest.conversationId, user?.id ?? 0);
      setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [supportRequest.conversationId, user?.id, isWaitingRequest]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (isWaitingRequest) return;
    const unsub = subscribeToDm(supportRequest.conversationId, (msg) => {
      setMessages(prev => [...prev, msg]);
      onConversationUpdated();
    });
    return unsub;
  }, [supportRequest.conversationId, onConversationUpdated, isWaitingRequest]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendText = () => {
    if (!text.trim() || !user) return;
    sendDmMessage({
      conversationId: supportRequest.conversationId,
      senderId: user.id,
      senderName: user.name,
      content: text.trim(),
      messageType: 'TEXT',
    });
    setText('');
    onConversationUpdated();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  const handleFile = async (file: File, type: 'FILE' | 'IMAGE') => {
    if (!user) return;
    setSending(true);
    try {
      const { fileUrl, fileName } = await uploadMessageFile(file);
      sendDmMessage({
        conversationId: supportRequest.conversationId,
        senderId: user.id,
        senderName: user.name,
        content: '',
        messageType: type,
        fileUrl,
        fileName,
      });
      onConversationUpdated();
    } catch (err) {
      console.error('File upload failed', err);
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    if (!user) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setSending(true);
        try {
          const { fileUrl, fileName } = await uploadMessageFile(file);
          sendDmMessage({
            conversationId: supportRequest.conversationId,
            senderId: user.id,
            senderName: user.name,
            content: '',
            messageType: 'VOICE',
            fileUrl,
            fileName,
          });
          onConversationUpdated();
        } catch (err) {
          console.error('Voice upload failed', err);
        } finally {
          setSending(false);
        }
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      console.error('Microphone access denied', err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {supportRequest.customerName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{supportRequest.customerName}</p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${topic.color}`}>
                {topic.label}
              </span>
              <span className="text-xs text-slate-400">Yêu cầu #{supportRequest.id}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Request Info */}
      {supportRequest.description && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold">Mô tả:</span> {supportRequest.description}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isWaitingRequest ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Yêu cầu chưa được tiếp nhận</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">Nhấn "Tiếp nhận hỗ trợ" để bắt đầu cuộc trò chuyện với khách hàng.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-10">Bắt đầu cuộc trò chuyện với khách hàng...</p>
        ) : (
          messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} isSelf={msg.senderId === user?.id} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input - disabled for waiting requests */}
      {!isWaitingRequest && (
        <div className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-end gap-1.5 px-3 py-2.5">
          {/* File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            title="Đính kèm file"
            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex-shrink-0"
          >
            <Paperclip size={16} />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], 'FILE')} />

          {/* Image */}
          <button
            onClick={() => imgInputRef.current?.click()}
            disabled={sending}
            title="Gửi ảnh"
            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors flex-shrink-0"
          >
            <Image size={16} />
          </button>
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], 'IMAGE')} />

          {/* Voice */}
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={sending}
            title={recording ? 'Dừng ghi' : 'Ghi âm'}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
              recording
                ? 'bg-red-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            {recording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Text input */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn... (Enter để gửi)"
            rows={1}
            className="flex-1 resize-none text-sm px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700 dark:text-slate-200 placeholder-slate-400 max-h-32"
            style={{ overflowY: text.split('\n').length > 3 ? 'auto' : 'hidden' }}
          />

          {/* Send */}
          <button
            onClick={sendText}
            disabled={!text.trim() || sending}
            className="p-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white rounded-xl transition-colors flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
      )}
    </div>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble = ({ message, isSelf }: { message: DirectMessagePayload; isSelf: boolean }) => {
  const isFile = message.messageType !== 'TEXT';
  const isVoice = message.messageType === 'VOICE';
  const isImage = message.messageType === 'IMAGE';

  return (
    <div className={`flex gap-2 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isSelf && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
          {message.senderName?.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      <div className={`max-w-[70%] ${isSelf ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {!isSelf && (
          <span className="text-[10px] text-slate-500 px-1">{message.senderName}</span>
        )}
        <div className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
          isSelf
            ? 'bg-emerald-500 text-white rounded-tr-sm'
            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-200 dark:border-slate-700'
        }`}>
          {isVoice ? (
            <audio controls src={`http://localhost:8081${message.fileUrl}`} className="h-8 max-w-[200px]" />
          ) : isImage ? (
            <img
              src={`http://localhost:8081${message.fileUrl}`}
              alt={message.fileName}
              className="max-w-[200px] rounded-lg"
            />
          ) : isFile ? (
            <a
              href={`http://localhost:8081${message.fileUrl}`}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-2 underline text-xs ${isSelf ? 'text-emerald-100' : 'text-blue-600'}`}
            >
              📎 {message.fileName || 'File'}
            </a>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
        <span className="text-[10px] text-slate-400 px-1">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
};

export default SupportRequestDetail;

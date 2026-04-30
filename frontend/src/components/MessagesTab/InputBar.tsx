import { useState, useRef } from 'react';
import { Send, Paperclip, Image, Mic, MicOff, ChevronDown } from 'lucide-react';
import { uploadMessageFile, getTickets, assignTicket, type UserPayload } from '../../api/apiClient';
import type { Ticket } from '../../types/ticket';
import { sendDmMessage } from '../../services/websocket';

interface Props {
  conversationId: number;
  selfId: number;
  selfName: string;
  selfRole: 'AGENT' | 'ADMIN';
  isAdmin: boolean;
  allUsers: UserPayload[];
  onMessageSent: () => void;
}

const InputBar = ({ conversationId, selfId, selfName, isAdmin, onMessageSent }: Props) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<UserPayload[]>([]);
  const [loadingAssign, setLoadingAssign] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const sendText = () => {
    if (!text.trim()) return;
    sendDmMessage({
      conversationId,
      senderId: selfId,
      senderName: selfName,
      content: text.trim(),
      messageType: 'TEXT',
    });
    setText('');
    onMessageSent();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  const handleFile = async (file: File, type: 'FILE' | 'IMAGE') => {
    setSending(true);
    try {
      const { fileUrl, fileName } = await uploadMessageFile(file);
      sendDmMessage({
        conversationId,
        senderId: selfId,
        senderName: selfName,
        content: '',
        messageType: type,
        fileUrl,
        fileName,
      });
      onMessageSent();
    } catch (err) {
      console.error('File upload failed', err);
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
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
            conversationId,
            senderId: selfId,
            senderName: selfName,
            content: '',
            messageType: 'VOICE',
            fileUrl,
            fileName,
          });
          onMessageSent();
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

  const handleAssignOpen = async () => {
    if (showAssign) { setShowAssign(false); return; }
    setLoadingAssign(true);
    try {
      const [t, u] = await Promise.all([
        getTickets(),
        import('../../api/apiClient').then(m => m.getAllUsers('AGENT')),
      ]);
      setTickets(t.filter(tk => tk.status !== 'RESOLVED' && tk.status !== 'CLOSED').slice(0, 20));
      setAgents(u);
    } catch {
      setTickets([]);
      setAgents([]);
    } finally {
      setLoadingAssign(false);
      setShowAssign(true);
    }
  };

  const handleAssign = async (ticketId: number, agentId: number) => {
    try {
      await assignTicket(ticketId, agentId);
      sendDmMessage({
        conversationId,
        senderId: selfId,
        senderName: selfName,
        content: `✅ Ticket #${ticketId} đã được assign cho agent ID ${agentId}`,
        messageType: 'TEXT',
      });
      onMessageSent();
    } catch (err) {
      console.error('Assign failed', err);
    }
    setShowAssign(false);
  };

  return (
    <div className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      {/* Assign panel */}
      {showAssign && (
        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-800">
          <p className="text-[10px] font-bold text-amber-600 uppercase mb-1.5">Assign ticket cho agent</p>
          {loadingAssign ? (
            <div className="text-xs text-slate-400">Đang tải...</div>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {tickets.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-700 dark:text-slate-300 truncate flex-1">#{t.id} {t.title}</span>
                  <select
                    defaultValue=""
                    onChange={e => e.target.value && handleAssign(t.id, Number(e.target.value))}
                    className="text-xs border border-amber-200 dark:border-amber-700 rounded px-1 py-0.5 bg-white dark:bg-slate-800"
                  >
                    <option value="">Chọn agent</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input row */}
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

        {/* Assign (admin only) */}
        {isAdmin && (
          <button
            onClick={handleAssignOpen}
            title="Assign ticket"
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
              showAssign ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
            }`}
          >
            <ChevronDown size={16} />
          </button>
        )}

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
          className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white rounded-xl transition-colors flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default InputBar;

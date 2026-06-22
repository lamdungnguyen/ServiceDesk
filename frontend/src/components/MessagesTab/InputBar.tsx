import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image, Mic, MicOff, ChevronDown, Plus, X } from 'lucide-react';
import { uploadMessageFile, getTickets, assignTicket, type UserPayload } from '../../api/apiClient';
import type { Ticket } from '../../types/ticket';
import { sendDmMessage, sendDmTyping } from '../../services/websocket';

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
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<UserPayload[]>([]);
  const [loadingAssign, setLoadingAssign] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Close attach menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    // Emit typing status
    sendDmTyping(conversationId, selfId, selfName, true);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendDmTyping(conversationId, selfId, selfName, false);
    }, 1500);
  };

  const sendText = () => {
    if (!text.trim()) return;
    
    // Clear typing immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendDmTyping(conversationId, selfId, selfName, false);

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
    setShowAttachMenu(false);
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
    setShowAttachMenu(false);
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
    setShowAttachMenu(false);
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
        content: `✅ Ticket #${ticketId} assigned to agent ID ${agentId}`,
        messageType: 'TEXT',
      });
      onMessageSent();
    } catch (err) {
      console.error('Assign failed', err);
    }
    setShowAssign(false);
  };

  return (
    <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-10 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {/* Assign panel */}
      {showAssign && (
        <div className="absolute bottom-[100%] left-0 right-0 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-xl z-20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assign ticket</p>
            <button onClick={() => setShowAssign(false)}><X size={16} className="text-slate-400 hover:text-slate-600" /></button>
          </div>
          {loadingAssign ? (
            <div className="text-sm text-slate-400 py-2">Loading active tickets...</div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 scrollbar-thin">
              {tickets.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate flex-1">#{t.id} - {t.title}</span>
                  <select
                    defaultValue=""
                    onChange={e => e.target.value && handleAssign(t.id, Number(e.target.value))}
                    className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select agent...</option>
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
      <div className="flex items-end gap-2 px-4 py-3">
        {/* Plus Menu Container */}
        <div className="relative" ref={attachMenuRef}>
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            disabled={sending}
            className={`p-2.5 rounded-full transition-all flex-shrink-0 mb-0.5 ${showAttachMenu ? 'bg-blue-500 text-white shadow-md rotate-45' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
          >
            <Plus size={20} />
          </button>
          
          {/* Attach Menu */}
          {showAttachMenu && (
             <div className="absolute bottom-[120%] left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 flex flex-col gap-1 min-w-[160px] animate-in slide-in-from-bottom-2 fade-in">
               <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], 'FILE')} />
               <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], 'IMAGE')} />
               
               <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-500 flex items-center justify-center"><Paperclip size={16} /></div> File
               </button>
               <button onClick={() => imgInputRef.current?.click()} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-500 flex items-center justify-center"><Image size={16} /></div> Image
               </button>
               <button onClick={recording ? stopRecording : startRecording} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${recording ? 'bg-red-500 text-white animate-pulse' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-500'}`}>
                    {recording ? <MicOff size={16} /> : <Mic size={16} />}
                  </div> 
                  {recording ? 'Stop Recording' : 'Voice'}
               </button>
               {isAdmin && (
                  <button onClick={handleAssignOpen} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                     <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-500 flex items-center justify-center"><ChevronDown size={16} /></div> Assign
                  </button>
               )}
             </div>
          )}
        </div>

        {/* Text input Container */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center pr-2 py-1 pl-4 border border-transparent focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="flex-1 resize-none text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-200 placeholder-slate-400 max-h-32 py-2.5 mr-2 scrollbar-thin"
            style={{ overflowY: text.split('\n').length > 3 ? 'auto' : 'hidden' }}
          />

          {/* Send */}
          {text.trim() ? (
            <button
              onClick={sendText}
              disabled={sending}
              className="w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white flex items-center justify-center transition-all shadow-md shadow-blue-500/20 transform hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <Send size={16} className="ml-0.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 opacity-70">
              <button onClick={() => imgInputRef.current?.click()} className="p-2 text-slate-500 hover:text-blue-500 rounded-full transition-colors"><Image size={18} /></button>
              <button onClick={recording ? stopRecording : startRecording} className={`p-2 rounded-full transition-colors ${recording ? 'text-red-500 animate-pulse' : 'text-slate-500 hover:text-blue-500'}`}>{recording ? <MicOff size={18} /> : <Mic size={18} />}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputBar;

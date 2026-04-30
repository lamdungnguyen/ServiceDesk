import { useState, useEffect, useRef, useCallback } from 'react';
import { Users, UserPlus, MoreVertical, X } from 'lucide-react';
import {
  getConversationMessages,
  addConversationMember,
  removeConversationMember,
  type ConversationPayload,
  type DirectMessagePayload,
  type UserPayload,
} from '../../api/apiClient';
import { subscribeToDm } from '../../services/websocket';
import InputBar from './InputBar';

interface Props {
  conversation: ConversationPayload;
  selfId: number;
  selfName: string;
  selfRole: 'AGENT' | 'ADMIN';
  allUsers: UserPayload[];
  onMessageSent: () => void;
  onConversationUpdated: () => void;
}

const ConversationView = ({
  conversation, selfId, selfName, selfRole, allUsers, onMessageSent, onConversationUpdated,
}: Props) => {
  const [messages, setMessages] = useState<DirectMessagePayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getConversationMessages(conversation.id, selfId);
      setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversation.id, selfId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const unsub = subscribeToDm(conversation.id, (msg) => {
      setMessages(prev => [...prev, msg]);
      onMessageSent();
    });
    return unsub;
  }, [conversation.id, onMessageSent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const headerName = conversation.type === 'GROUP'
    ? conversation.name || 'Group'
    : conversation.members.find(m => m.userId !== selfId)?.userName || 'Unknown';

  const handleAddMember = async (userId: number) => {
    try {
      await addConversationMember(conversation.id, userId, selfId);
      onConversationUpdated();
    } catch (err) {
      console.error('Failed to add member', err);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      await removeConversationMember(conversation.id, userId, selfId);
      onConversationUpdated();
    } catch (err) {
      console.error('Failed to remove member', err);
    }
  };

  const nonMembers = allUsers.filter(
    u => (u.role === 'AGENT' || u.role === 'ADMIN') && !conversation.members.find(m => m.userId === u.id)
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
            conversation.type === 'GROUP'
              ? 'bg-gradient-to-br from-purple-500 to-pink-500'
              : 'bg-gradient-to-br from-blue-400 to-indigo-500'
          }`}>
            {conversation.type === 'GROUP' ? <Users size={16} /> : headerName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{headerName}</p>
            <p className="text-xs text-slate-400">
              {conversation.type === 'GROUP'
                ? `${conversation.members.length} thành viên`
                : conversation.members.find(m => m.userId !== selfId)?.userRole || ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {conversation.type === 'GROUP' && selfRole === 'ADMIN' && (
            <button
              onClick={() => setShowMembers(s => !s)}
              className={`p-2 rounded-lg transition-colors ${showMembers ? 'bg-purple-100 text-purple-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title="Quản lý thành viên"
            >
              <MoreVertical size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Member manager (group, admin only) */}
      {showMembers && conversation.type === 'GROUP' && selfRole === 'ADMIN' && (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-purple-50 dark:bg-purple-900/10 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-purple-600">Thành viên ({conversation.members.length})</p>
            <button onClick={() => setShowMembers(false)}><X size={12} className="text-slate-400" /></button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {conversation.members.map(m => (
              <div key={m.userId} className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 rounded-full px-2 py-0.5">
                <span className="text-xs text-slate-700 dark:text-slate-200">{m.userName}</span>
                {m.userId !== selfId && (
                  <button onClick={() => handleRemoveMember(m.userId)} className="text-red-400 hover:text-red-600">
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {nonMembers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Thêm thành viên</p>
              <div className="flex flex-wrap gap-1">
                {nonMembers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleAddMember(u.id)}
                    className="flex items-center gap-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5 hover:border-purple-400 hover:text-purple-600 transition-colors"
                  >
                    <UserPlus size={10} /> {u.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50 dark:bg-slate-900">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-10">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
        ) : (
          messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} isSelf={msg.senderId === selfId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <InputBar
        conversationId={conversation.id}
        selfId={selfId}
        selfName={selfName}
        selfRole={selfRole}
        isAdmin={selfRole === 'ADMIN'}
        allUsers={allUsers}
        onMessageSent={onMessageSent}
      />
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
            ? 'bg-blue-500 text-white rounded-tr-sm'
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
              className={`flex items-center gap-2 underline text-xs ${isSelf ? 'text-blue-100' : 'text-blue-600'}`}
            >
              📎 {message.fileName || 'File'}
            </a>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
        <span className="text-[10px] text-slate-400 px-1">
          {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default ConversationView;

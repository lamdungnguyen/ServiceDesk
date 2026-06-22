import { useState, useEffect, useRef, useCallback } from 'react';
import { Users, UserPlus, MoreVertical, X, SmilePlus, CheckCheck } from 'lucide-react';
import {
  getConversationMessages,
  addConversationMember,
  removeConversationMember,
  type ConversationPayload,
  type DirectMessagePayload,
  type UserPayload,
} from '../../api/apiClient';
import { subscribeToDm, subscribeToDmUpdates, subscribeToDmTyping, sendDmRead, sendDmReact, type DmTypingPayload } from '../../services/websocket';
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
  const [typists, setTypists] = useState<Map<number, string>>(new Map());
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getConversationMessages(conversation.id, selfId);
      setMessages(data);
      // Mark latest as read if not already
      if (data.length > 0) {
        const lastMsg = data[data.length - 1];
        if (lastMsg.senderId !== selfId) {
          const readers = lastMsg.readByIds ? lastMsg.readByIds.split(',') : [];
          if (!readers.includes(String(selfId)) && lastMsg.id) {
            sendDmRead(conversation.id, lastMsg.id, selfId);
          }
        }
      }
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
    const unsubDm = subscribeToDm(conversation.id, (msg) => {
      setMessages(prev => {
        if (prev.find(p => p.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // If we are viewing, mark as read
      if (msg.senderId !== selfId && msg.id) {
        sendDmRead(conversation.id, msg.id, selfId);
      }
      onMessageSent();
    });

    const unsubUpdate = subscribeToDmUpdates(conversation.id, (updatedMsg) => {
      setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      onMessageSent(); // To update side panel if needed
    });

    const unsubTyping = subscribeToDmTyping(conversation.id, (payload: DmTypingPayload) => {
      if (payload.userId === selfId) return;
      setTypists(prev => {
        const next = new Map(prev);
        if (payload.isTyping) {
          next.set(payload.userId, payload.userName);
        } else {
          next.delete(payload.userId);
        }
        return next;
      });
    });

    return () => {
      unsubDm();
      unsubUpdate();
      unsubTyping();
    };
  }, [conversation.id, selfId, onMessageSent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typists]);

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

  const handleReact = (msgId: number, reaction: string) => {
    sendDmReact(conversation.id, msgId, selfId, reaction);
  };

  // Group messages
  const groupedMessages: { msg: DirectMessagePayload; showAvatar: boolean; showTail: boolean }[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const prevMsg = i > 0 ? messages[i - 1] : null;
    const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;

    const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
    const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

    groupedMessages.push({
      msg,
      showAvatar: isFirstInGroup,
      showTail: isLastInGroup,
    });
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-sm ${
            conversation.type === 'GROUP'
              ? 'bg-gradient-to-br from-purple-500 to-pink-500'
              : 'bg-gradient-to-br from-blue-400 to-indigo-500'
          }`}>
            {conversation.type === 'GROUP' ? <Users size={18} /> : headerName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-slate-800 dark:text-white truncate leading-tight">{headerName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              {conversation.type === 'GROUP' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {conversation.members.length} members
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Active
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversation.type === 'GROUP' && selfRole === 'ADMIN' && (
            <button
              onClick={() => setShowMembers(s => !s)}
              className={`p-2 rounded-xl transition-all ${showMembers ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20' : 'text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'}`}
              title="Manage members"
            >
              <MoreVertical size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Member manager (group, admin only) */}
      {showMembers && conversation.type === 'GROUP' && selfRole === 'ADMIN' && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-4 shadow-sm z-10 absolute top-[70px] left-0 right-0 max-h-[50%] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-800 dark:text-white">Group Members ({conversation.members.length})</p>
            <button onClick={() => setShowMembers(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X size={16} className="text-slate-500" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {conversation.members.map(m => (
              <div key={m.userId} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full pl-3 pr-1 py-1 border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{m.userName}</span>
                {m.userId !== selfId && (
                  <button onClick={() => handleRemoveMember(m.userId)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors">
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {nonMembers.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Add to group</p>
              <div className="flex flex-wrap gap-2">
                {nonMembers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleAddMember(u.id)}
                    className="flex items-center gap-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-full px-3 py-1.5 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-slate-600 dark:text-slate-300"
                  >
                    <UserPlus size={12} /> {u.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1.5 scrollbar-thin relative">
        {loading ? (
          <div className="flex justify-center py-10 my-auto">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center text-slate-400 opacity-70">
            <MessageBubble message={{ content: "Start the conversation!", messageType: 'TEXT', senderId: 0, createdAt: new Date().toISOString() } as any} isSelf={false} showAvatar={false} showTail={false} onReact={() => {}} />
          </div>
        ) : (
          groupedMessages.map((gm, i) => (
            <MessageBubble 
              key={gm.msg.id || i} 
              message={gm.msg} 
              isSelf={gm.msg.senderId === selfId} 
              showAvatar={gm.showAvatar}
              showTail={gm.showTail}
              onReact={handleReact}
            />
          ))
        )}
        
        {/* Typing indicators */}
        {typists.size > 0 && (
          <div className="flex items-center gap-3 mt-2 text-slate-400 animate-in fade-in slide-in-from-bottom-2">
            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 ml-1">
              {Array.from(typists.values())[0].charAt(0).toUpperCase()}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-2" />
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

const AVAILABLE_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const MessageBubble = ({ 
  message, isSelf, showAvatar, showTail, onReact 
}: { 
  message: DirectMessagePayload; 
  isSelf: boolean; 
  showAvatar: boolean;
  showTail: boolean;
  onReact: (id: number, react: string) => void;
}) => {
  const [showReactMenu, setShowReactMenu] = useState(false);
  const isFile = message.messageType !== 'TEXT';
  const isVoice = message.messageType === 'VOICE';
  const isImage = message.messageType === 'IMAGE';

  let reactionsObj: Record<string, string[]> = {};
  try {
    if (message.reactions) {
      reactionsObj = JSON.parse(message.reactions);
    }
  } catch (e) {}

  const readByCount = message.readByIds ? message.readByIds.split(',').filter(Boolean).length : 0;
  
  return (
    <div className={`flex gap-2 group w-full ${isSelf ? 'flex-row-reverse' : 'flex-row'} ${!showTail && isSelf ? 'pr-9' : ''} ${!showTail && !isSelf ? 'pl-9' : ''}`}>
      {!isSelf && (
        <div className={`w-7 h-7 mt-auto rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 shadow-sm ${!showTail ? 'opacity-0 pointer-events-none' : ''}`}>
          {message.senderName?.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      
      <div className={`max-w-[75%] flex flex-col relative ${isSelf ? 'items-end' : 'items-start'} ${!isSelf && !showTail ? 'ml-0' : ''}`}>
        {!isSelf && showAvatar && (
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1 mb-1 ml-0.5">{message.senderName}</span>
        )}
        
        <div className={`flex items-center gap-2 relative ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Main Bubble */}
          <div className={`relative px-4 py-2.5 shadow-sm text-[15px] leading-relaxed transition-all ${
            isImage ? 'p-1 bg-transparent shadow-none' :
            isSelf
              ? `bg-blue-500 text-white ${showTail ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl'} border border-blue-600/20`
              : `bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 ${showTail ? 'rounded-2xl rounded-bl-sm' : 'rounded-2xl'} border border-slate-200/50 dark:border-slate-700/50`
          }`}>
            {isVoice ? (
              <audio controls src={`http://localhost:8081${message.fileUrl}`} className={`h-10 max-w-[220px] rounded-full ${isSelf ? 'opacity-90' : ''}`} />
            ) : isImage ? (
              <img
                src={`http://localhost:8081${message.fileUrl}`}
                alt={message.fileName}
                className={`max-w-[260px] md:max-w-[320px] rounded-2xl shadow-md border border-slate-200/50 dark:border-slate-700/50 object-cover ${showTail && !isSelf ? 'rounded-bl-sm' : ''} ${showTail && isSelf ? 'rounded-br-sm' : ''}`}
              />
            ) : isFile ? (
              <a
                href={`http://localhost:8081${message.fileUrl}`}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-2 underline font-medium ${isSelf ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'}`}
              >
                📎 {message.fileName || 'File'}
              </a>
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}

            {/* Reactions Display (floating at bottom) */}
            {Object.keys(reactionsObj).length > 0 && (
              <div className={`absolute -bottom-3 ${isSelf ? 'right-2' : 'left-2'} flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-1.5 py-0.5 shadow-sm`}>
                {Object.entries(reactionsObj).map(([react, users]) => (
                  <span key={react} className="text-xs flex items-center gap-0.5" title={users.length + " reaction(s)"}>
                    {react} {users.length > 1 && <span className="text-[10px] text-slate-500 font-bold">{users.length}</span>}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions (React, Timestamp) - hidden by default, shown on hover */}
          <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
             <button 
                onClick={() => setShowReactMenu(!showReactMenu)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
             >
                <SmilePlus size={16} />
             </button>
             <span className="text-[11px] font-medium text-slate-400 px-1 whitespace-nowrap">
              {new Date(message.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Reaction Picker Menu */}
          {showReactMenu && (
            <div className={`absolute top-1/2 -translate-y-1/2 ${isSelf ? 'right-[110%]' : 'left-[110%]'} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-full px-2 py-1.5 flex gap-1 z-20`}>
              {AVAILABLE_REACTIONS.map(r => (
                <button 
                  key={r} 
                  onClick={() => { onReact(message.id!, r); setShowReactMenu(false); }}
                  className="hover:scale-125 transition-transform p-1"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Read Receipts (only show for self messages that are read) */}
        {isSelf && readByCount > 0 && showTail && (
           <div className="text-[10px] text-blue-500 dark:text-blue-400 flex items-center gap-0.5 mt-1 mr-1">
             <CheckCheck size={12} /> <span className="font-medium">Seen</span>
           </div>
        )}
      </div>
    </div>
  );
};

export default ConversationView;

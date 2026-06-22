import { useState } from 'react';
import { Users, Search, MessageSquare } from 'lucide-react';
import type { ConversationPayload, UserPayload } from '../../api/apiClient';

interface Props {
  conversations: ConversationPayload[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  contacts: UserPayload[];
  selfId: number;
  selfRole: 'AGENT' | 'ADMIN';
  loading: boolean;
  onCreateDm: (targetUserId: number) => void;
  onCreateGroup: (name: string, memberIds: number[]) => void;
}

const ConversationList = ({
  conversations, selectedId, onSelect, contacts, selfId, selfRole,
  loading, onCreateDm, onCreateGroup,
}: Props) => {
  const [search, setSearch] = useState('');
  const [showNewDm, setShowNewDm] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  const filtered = conversations.filter(c => {
    const name = getConvName(c, selfId);
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    onCreateGroup(groupName.trim(), selectedMembers);
    setGroupName('');
    setSelectedMembers([]);
    setShowNewGroup(false);
  };

  const toggleMember = (id: number) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-72 flex-shrink-0 flex flex-col bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-r border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">Messages</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => { setShowNewDm(s => !s); setShowNewGroup(false); }}
              title="New Direct Message"
              className={`p-2 rounded-xl transition-all ${showNewDm ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
            >
              <MessageSquare size={16} />
            </button>
            {selfRole === 'ADMIN' && (
              <button
                onClick={() => { setShowNewGroup(s => !s); setShowNewDm(false); }}
                title="New Group"
                className={`p-2 rounded-xl transition-all ${showNewGroup ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
              >
                <Users size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-900 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* New DM picker */}
      {showNewDm && (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-900/10 p-3">
          <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Message with...</p>
          <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
            {contacts.map(u => (
              <button
                key={u.id}
                onClick={() => { onCreateDm(u.id); setShowNewDm(false); }}
                className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm shadow-transparent hover:shadow-slate-200/50 dark:hover:shadow-none"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate leading-tight">{u.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{u.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New Group form (admin only) */}
      {showNewGroup && selfRole === 'ADMIN' && (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-purple-50/50 dark:bg-purple-900/10 p-3 space-y-3">
          <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Create Group</p>
          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Group Name..."
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin bg-white/50 dark:bg-slate-900/50 p-2 rounded-xl border border-purple-100 dark:border-purple-900/30">
            {contacts.map(u => (
              <label key={u.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-purple-100/50 dark:hover:bg-purple-800/30 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(u.id)}
                  onChange={() => toggleMember(u.id)}
                  className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 bg-white"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{u.name}</span>
              </label>
            ))}
          </div>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedMembers.length === 0}
            className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 active:bg-purple-700 disabled:bg-slate-300 disabled:dark:bg-slate-700 disabled:text-slate-500 text-white text-sm font-bold transition-all shadow-md shadow-purple-500/20 disabled:shadow-none"
          >
            Create Group
          </button>
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={20} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(conv => {
              const name = getConvName(conv, selfId);
              const isActive = conv.id === selectedId;
              const lastMsg = conv.lastMessage;
              const initial = name.charAt(0).toUpperCase();
              const isGroup = conv.type === 'GROUP';
              
              const isUnread = lastMsg 
                ? lastMsg.senderId !== selfId && (!lastMsg.readByIds || !lastMsg.readByIds.split(',').includes(String(selfId)))
                : false;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-2xl transition-all relative overflow-hidden ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-500'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-sm relative ${
                    isGroup
                      ? (isActive ? 'bg-white/20' : 'bg-gradient-to-br from-purple-500 to-pink-500')
                      : (isActive ? 'bg-white/20' : 'bg-gradient-to-br from-blue-400 to-indigo-500')
                  }`}>
                    {isGroup ? <Users size={18} className={isActive ? 'text-white' : ''} /> : initial}
                    
                    {/* Unread dot indicator over avatar */}
                    {isUnread && !isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 border-2 border-white dark:border-slate-950 rounded-full animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-sm font-semibold truncate pr-2 ${
                        isActive ? 'text-white' : (isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200')
                      }`}>
                        {name}
                      </p>
                      {lastMsg && (
                        <span className={`text-[11px] flex-shrink-0 font-medium ${
                          isActive ? 'text-blue-100' : (isUnread ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')
                        }`}>
                          {formatTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    {lastMsg && (
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate ${
                          isActive 
                            ? 'text-blue-100' 
                            : (isUnread ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-500 dark:text-slate-400')
                        }`}>
                          {lastMsg.senderId === selfId ? 'You: ' : ''}
                          {lastMsg.messageType !== 'TEXT' ? `📎 ${lastMsg.fileName || 'File'}` : lastMsg.content}
                        </p>
                        {isUnread && !isActive && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

function getConvName(conv: ConversationPayload, selfId: number): string {
  if (conv.type === 'GROUP') return conv.name || 'Group';
  const other = conv.members.find(m => m.userId !== selfId);
  return other?.userName || 'Unknown';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });
}

export default ConversationList;

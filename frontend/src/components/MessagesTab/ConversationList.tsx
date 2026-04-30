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
    <div className="w-64 flex-shrink-0 flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Messages</span>
          <div className="flex gap-1">
            <button
              onClick={() => { setShowNewDm(s => !s); setShowNewGroup(false); }}
              title="New Direct Message"
              className={`p-1.5 rounded-lg transition-colors ${showNewDm ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <MessageSquare size={14} />
            </button>
            {selfRole === 'ADMIN' && (
              <button
                onClick={() => { setShowNewGroup(s => !s); setShowNewDm(false); }}
                title="New Group"
                className={`p-1.5 rounded-lg transition-colors ${showNewGroup ? 'bg-purple-100 text-purple-600' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Users size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-transparent rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700 dark:text-slate-300"
          />
        </div>
      </div>

      {/* New DM picker */}
      {showNewDm && (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-900/20 p-2">
          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1.5">Nhắn tin với...</p>
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {contacts.map(u => (
              <button
                key={u.id}
                onClick={() => { onCreateDm(u.id); setShowNewDm(false); }}
                className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{u.name}</p>
                  <p className="text-[10px] text-slate-400">{u.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New Group form (admin only) */}
      {showNewGroup && selfRole === 'ADMIN' && (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-purple-50 dark:bg-purple-900/20 p-2 space-y-2">
          <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Tạo nhóm</p>
          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Tên nhóm..."
            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
          <div className="max-h-36 overflow-y-auto space-y-0.5">
            {contacts.map(u => (
              <label key={u.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-purple-100 dark:hover:bg-purple-800/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(u.id)}
                  onChange={() => toggleMember(u.id)}
                  className="accent-purple-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-200 truncate">{u.name}</span>
              </label>
            ))}
          </div>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedMembers.length === 0}
            className="w-full py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white text-xs font-bold transition-colors"
          >
            Tạo nhóm
          </button>
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Chưa có cuộc trò chuyện nào</p>
        ) : (
          filtered.map(conv => {
            const name = getConvName(conv, selfId);
            const isActive = conv.id === selectedId;
            const lastMsg = conv.lastMessage;
            const initial = name.charAt(0).toUpperCase();
            const isGroup = conv.type === 'GROUP';

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                  isGroup
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                    : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                }`}>
                  {isGroup ? <Users size={14} /> : initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                      {name}
                    </p>
                    {lastMsg && (
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                        {formatTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  {lastMsg && (
                    <p className="text-[11px] text-slate-400 truncate">
                      {lastMsg.messageType !== 'TEXT' ? `📎 ${lastMsg.fileName || 'File'}` : lastMsg.content}
                    </p>
                  )}
                </div>
              </button>
            );
          })
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
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export default ConversationList;

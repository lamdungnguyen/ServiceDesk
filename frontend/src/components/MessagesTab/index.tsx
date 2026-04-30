import { useState, useEffect, useCallback } from 'react';
import {
  getConversations,
  createConversation,
  getAllUsers,
  type ConversationPayload,
  type UserPayload,
} from '../../api/apiClient';
import { connectWebSocket } from '../../services/websocket';
import ConversationList from './ConversationList';
import ConversationView from './ConversationView';

interface MessagesTabProps {
  selfId: number;
  selfName: string;
  selfRole: 'AGENT' | 'ADMIN';
  initialConvId?: number | null;
}

const MessagesTab = ({ selfId, selfName, selfRole, initialConvId }: MessagesTabProps) => {
  const [conversations, setConversations] = useState<ConversationPayload[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(initialConvId || null);
  const [allUsers, setAllUsers] = useState<UserPayload[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await getConversations(selfId);
      setConversations(data);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [selfId]);

  useEffect(() => {
    fetchConversations();
    getAllUsers().then(setAllUsers).catch(() => {});
    connectWebSocket().catch(console.error);
  }, [fetchConversations]);

  useEffect(() => {
    if (initialConvId && conversations.some(c => c.id === initialConvId)) {
      setSelectedConvId(initialConvId);
    }
  }, [initialConvId, conversations]);

  const handleCreateDm = async (targetUserId: number) => {
    try {
      const conv = await createConversation(selfId, {
        type: 'DM',
        memberIds: [targetUserId],
      });
      await fetchConversations();
      setSelectedConvId(conv.id);
    } catch (err) {
      console.error('Failed to create DM', err);
    }
  };

  const handleCreateGroup = async (name: string, memberIds: number[]) => {
    try {
      const conv = await createConversation(selfId, {
        type: 'GROUP',
        name,
        memberIds,
      });
      await fetchConversations();
      setSelectedConvId(conv.id);
    } catch (err) {
      console.error('Failed to create group', err);
    }
  };

  const handleNewMessage = (convId: number) => {
    fetchConversations();
    if (selectedConvId !== convId) {
      setSelectedConvId(convId);
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConvId) ?? null;

  // Contacts: AGENT + ADMIN, excluding self
  const contacts = allUsers.filter(
    u => (u.role === 'AGENT' || u.role === 'ADMIN') && u.id !== selfId
  );

  return (
    <div className="flex h-full overflow-hidden">
      <ConversationList
        conversations={conversations}
        selectedId={selectedConvId}
        onSelect={setSelectedConvId}
        contacts={contacts}
        selfId={selfId}
        selfRole={selfRole}
        loading={loading}
        onCreateDm={handleCreateDm}
        onCreateGroup={handleCreateGroup}
      />

      <div className="flex-1 flex flex-col overflow-hidden border-l border-slate-200 dark:border-slate-800">
        {selectedConv ? (
          <ConversationView
            conversation={selectedConv}
            selfId={selfId}
            selfName={selfName}
            selfRole={selfRole}
            allUsers={allUsers}
            onMessageSent={() => handleNewMessage(selectedConv.id)}
            onConversationUpdated={fetchConversations}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="text-sm font-medium">Chọn một cuộc trò chuyện</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;

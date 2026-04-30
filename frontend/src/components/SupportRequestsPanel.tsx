import { useState, useEffect, useCallback } from 'react';
import { Headset, Clock, CheckCircle, UserPlus, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/auth';
import {
  getWaitingSupportRequests,
  getMyActiveSupportChats,
  acceptSupportRequest,
  type SupportRequestPayload,
} from '../api/apiClient';
import { connectWebSocket, subscribeToSupportRequests, subscribeToSupportTaken } from '../services/websocket';

// Support topic display config
const TOPIC_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  TECHNICAL: { label: 'Lỗi kỹ thuật', icon: '🔧', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  BILLING: { label: 'Thanh toán', icon: '💳', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  ACCOUNT: { label: 'Tài khoản', icon: '👤', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  GENERAL: { label: 'Chung', icon: '❓', color: 'bg-amber-100 text-amber-700 border-amber-200' },
};

interface SupportRequestsPanelProps {
  onSelectRequest?: (request: {
    id: number;
    customerName: string;
    topic: string;
    description: string;
    conversationId: number;
    createdAt: string;
  }) => void;
}

const SupportRequestsPanel = ({ onSelectRequest }: SupportRequestsPanelProps) => {
  const { user } = useAuth();
  const [waitingRequests, setWaitingRequests] = useState<SupportRequestPayload[]>([]);
  const [myChats, setMyChats] = useState<SupportRequestPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'waiting' | 'my-chats'>('waiting');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [waiting, mine] = await Promise.all([
        getWaitingSupportRequests(),
        getMyActiveSupportChats(),
      ]);
      setWaitingRequests(waiting);
      setMyChats(mine);
    } catch {
      setWaitingRequests([]);
      setMyChats([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    connectWebSocket().catch(() => {});
  }, [fetchData]);

  // WebSocket subscriptions
  useEffect(() => {
    const unsubRequests = subscribeToSupportRequests((newRequest) => {
      setWaitingRequests(prev => {
        if (prev.some(r => r.id === newRequest.id)) return prev;
        return [newRequest, ...prev];
      });
    });

    const unsubTaken = subscribeToSupportTaken((takenRequest) => {
      setWaitingRequests(prev => prev.filter(r => r.id !== takenRequest.id));
      if (takenRequest.agentId === user?.id) {
        setMyChats(prev => {
          if (prev.some(r => r.id === takenRequest.id)) return prev;
          return [takenRequest, ...prev];
        });
      }
    });

    return () => {
      unsubRequests();
      unsubTaken();
    };
  }, [user?.id]);

  const handleAccept = async (requestId: number) => {
    setAcceptingId(requestId);
    try {
      const accepted = await acceptSupportRequest(requestId);
      // Remove from waiting
      setWaitingRequests(prev => prev.filter(r => r.id !== requestId));
      // Add to my chats
      setMyChats(prev => [accepted, ...prev]);
      setActiveTab('my-chats');
      // Select request if callback provided
      if (accepted.conversationId && onSelectRequest) {
        onSelectRequest({
          id: accepted.id,
          customerName: accepted.customerName,
          topic: accepted.topic,
          description: accepted.description,
          conversationId: accepted.conversationId,
          createdAt: accepted.createdAt,
        });
      }
    } catch (err) {
      console.error('Failed to accept request', err);
    } finally {
      setAcceptingId(null);
    }
  };

  const formatWaitTime = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ`;
    return `${Math.floor(hours / 24)} ngày`;
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Headset size={20} className="text-primary-500" />
          Yêu cầu hỗ trợ
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tiếp nhận và xử lý các yêu cầu hỗ trợ từ khách hàng
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <button
          onClick={() => setActiveTab('waiting')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'waiting'
              ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50 dark:bg-primary-900/10'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Clock size={16} />
          Đang chờ
          {waitingRequests.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
              {waitingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('my-chats')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'my-chats'
              ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50 dark:bg-primary-900/10'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <MessageSquare size={16} />
          Đang xử lý
          {myChats.length > 0 && (
            <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">
              {myChats.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={28} className="animate-spin text-slate-400" />
          </div>
        ) : activeTab === 'waiting' ? (
          waitingRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Không có yêu cầu chờ</p>
              <p className="text-xs text-slate-400">Tất cả yêu cầu hỗ trợ đã được tiếp nhận.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {waitingRequests.map(request => {
                const topic = TOPIC_CONFIG[request.topic] || TOPIC_CONFIG.GENERAL;
                return (
                  <button
                    key={request.id}
                    onClick={() => onSelectRequest?.({
                      id: request.id,
                      customerName: request.customerName,
                      topic: request.topic,
                      description: request.description,
                      conversationId: 0, // No conversation yet
                      createdAt: request.createdAt,
                    })}
                    className="w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{topic.icon}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${topic.color}`}>
                            {topic.label}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                            <Clock size={12} />
                            {formatWaitTime(request.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1">
                          {request.customerName}
                        </p>
                        {request.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            "{request.description}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAccept(request.id);
                        }}
                        disabled={acceptingId === request.id}
                        className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        {acceptingId === request.id ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Đang tiếp nhận...
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} />
                            Tiếp nhận hỗ trợ
                          </>
                        )}
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ) : myChats.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Chưa có chat nào</p>
            <p className="text-xs text-slate-400">Tiếp nhận yêu cầu từ tab "Đang chờ" để bắt đầu hỗ trợ.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myChats.map(chat => {
              const topic = TOPIC_CONFIG[chat.topic] || TOPIC_CONFIG.GENERAL;
              return (
                <button
                  key={chat.id}
                  onClick={() => chat.conversationId && onSelectRequest?.({
                    id: chat.id,
                    customerName: chat.customerName,
                    topic: chat.topic,
                    description: chat.description,
                    conversationId: chat.conversationId,
                    createdAt: chat.createdAt,
                  })}
                  className="w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                      {chat.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                          {chat.customerName}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${topic.color}`}>
                          {topic.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-emerald-600 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Đang hoạt động
                      </div>
                    </div>
                    <MessageSquare size={18} className="text-slate-400" />
                  </div>
                  {chat.description && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-1 pl-[52px]">
                      {chat.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportRequestsPanel;

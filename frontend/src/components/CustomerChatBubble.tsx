import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Loader2, Headset, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/auth';
import {
  createSupportRequest,
  getMySupportRequests,
  getConversationMessages,
  type SupportRequestPayload,
  type DirectMessagePayload,
} from '../api/apiClient';
import { connectWebSocket, subscribeToDm, sendDmMessage, subscribeToCustomerSupport } from '../services/websocket';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}


// Support topics
const SUPPORT_TOPICS = [
  { id: 'TECHNICAL', label: 'Lỗi kỹ thuật', icon: '🔧', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'BILLING', label: 'Thanh toán & Hoá đơn', icon: '💳', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'ACCOUNT', label: 'Tài khoản', icon: '👤', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'GENERAL', label: 'Câu hỏi chung', icon: '❓', color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

const CustomerChatBubble = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [supportRequest, setSupportRequest] = useState<SupportRequestPayload | null>(null);
  const [messages, setMessages] = useState<DirectMessagePayload[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch my support requests on open
  const fetchMyRequests = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMySupportRequests();
      // Find active or waiting request
      const active = data.find(r => r.status === 'ACTIVE');
      const waiting = data.find(r => r.status === 'WAITING');
      setSupportRequest(active || waiting || null);
    } catch {
      setSupportRequest(null);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      fetchMyRequests();
      connectWebSocket().catch(() => {});
    }
  }, [open, user, fetchMyRequests]);

  // Load messages when active conversation exists
  useEffect(() => {
    if (!supportRequest?.conversationId || !user || supportRequest.status !== 'ACTIVE') return;
    let cancelled = false;
    setLoading(true);
    getConversationMessages(supportRequest.conversationId, user.id)
      .then(data => { if (!cancelled) setMessages(data); })
      .catch(() => { if (!cancelled) setMessages([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    const unsub = subscribeToDm(supportRequest.conversationId, (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => { cancelled = true; unsub(); };
  }, [supportRequest?.conversationId, supportRequest?.status, user]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to support request updates (when agent accepts)
  useEffect(() => {
    if (!open || !user) return;
    const unsub = subscribeToCustomerSupport(user.id, (updatedRequest) => {
      setSupportRequest(updatedRequest);
      // Auto-clear topic selection when request becomes active
      if (updatedRequest.status === 'ACTIVE') {
        setSelectedTopic(null);
        setDescription('');
      }
    });
    return unsub;
  }, [open, user]);

  // Handle creating support request
  const handleCreateRequest = async () => {
    if (!selectedTopic || !user) return;
    setLoading(true);
    try {
      const req = await createSupportRequest({
        topic: selectedTopic,
        description: description.trim() || undefined,
      });
      setSupportRequest(req);
    } catch (err) {
      console.error('Failed to create support request', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle send message
  const handleSend = () => {
    if (!text.trim() || !supportRequest?.conversationId || !user) return;
    sendDmMessage({
      conversationId: supportRequest.conversationId,
      senderId: user.id,
      senderName: user.name,
      content: text.trim(),
      messageType: 'TEXT',
    });
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  if (!user || user.role !== 'CUSTOMER') return null;

  return (
    <>
      {/* Floating Button - BOTTOM RIGHT */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open
            ? 'bg-slate-600 hover:bg-slate-700 rotate-0'
            : 'bg-gradient-to-br from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 hover:scale-110'
        }`}
      >
        {open ? (
          <X size={22} className="text-white" />
        ) : (
          <>
            <Headset size={24} className="text-white" />
            {supportRequest?.status === 'ACTIVE' && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            )}
            {supportRequest?.status === 'WAITING' && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </>
        )}
      </button>

      {/* Chat Panel - BOTTOM RIGHT */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200">
          {supportRequest?.status === 'ACTIVE' && supportRequest.conversationId ? (
            /* ───── Active Chat View ───── */
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {supportRequest.agentName?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                    {supportRequest.agentName || 'Nhân viên hỗ trợ'}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-600 font-medium">Đang trực tuyến</span>
                  </div>
                </div>
                <div className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                  {SUPPORT_TOPICS.find(t => t.id === supportRequest.topic)?.label || supportRequest.topic}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 bg-slate-50/50 dark:bg-slate-900">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle size={20} className="text-emerald-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Đã kết nối!</p>
                    <p className="text-xs text-slate-400">{supportRequest.agentName || 'Nhân viên'} đã nhận yêu cầu hỗ trợ của bạn.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isSelf = msg.senderId === user.id;
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isSelf ? 'flex-row-reverse' : ''}`}>
                        {!isSelf && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold mt-1 flex-shrink-0">
                            {msg.senderName?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div className={`max-w-[75%] flex flex-col ${isSelf ? 'items-end' : ''}`}>
                          <div className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
                            isSelf
                              ? 'bg-primary-600 text-white rounded-tr-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-sm'
                          }`}>
                            {msg.messageType === 'IMAGE' ? (
                              <img src={`http://localhost:8081${msg.fileUrl}`} alt={msg.fileName} className="max-w-[180px] rounded-lg" />
                            ) : msg.messageType === 'FILE' ? (
                              <a href={`http://localhost:8081${msg.fileUrl}`} target="_blank" rel="noreferrer" className={`text-xs underline ${isSelf ? 'text-blue-100' : 'text-blue-600'}`}>
                                📎 {msg.fileName || 'File'}
                              </a>
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 mt-0.5 px-1">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-end gap-2">
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn..."
                  rows={1}
                  className="flex-1 resize-none text-sm px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-400 text-slate-700 dark:text-slate-200 placeholder-slate-400 max-h-24 border-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim()}
                  className="p-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition-colors flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : supportRequest?.status === 'WAITING' ? (
            /* ───── Waiting State ───── */
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Clock size={16} className="text-amber-500" />
                  Đang chờ nhân viên
                </h3>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                    <Loader2 size={32} className="text-amber-500 animate-spin" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-amber-200 flex items-center justify-center text-lg">
                    {SUPPORT_TOPICS.find(t => t.id === supportRequest.topic)?.icon}
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Yêu cầu của bạn đang được xử lý</p>
                <p className="text-xs text-slate-400 mb-4 max-w-[260px]">
                  Chúng tôi đã thông báo đến đội ngũ hỗ trợ. Một nhân viên sẽ tiếp nhận và phản hồi trong thời gian sớm nhất.
                </p>
                <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <span className="font-semibold">Chủ đề:</span> {SUPPORT_TOPICS.find(t => t.id === supportRequest.topic)?.label || supportRequest.topic}
                  </p>
                </div>
                {supportRequest.description && (
                  <p className="mt-3 text-xs text-slate-400 max-w-[260px] line-clamp-2">
                    "{supportRequest.description}"
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* ───── Topic Selection ───── */
            <div className="flex-1 flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/10 dark:to-indigo-900/10">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Headset size={16} className="text-primary-500" />
                  Trung tâm hỗ trợ
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Chọn chủ đề bạn cần hỗ trợ</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-xs text-slate-500 mb-3">Bạn cần hỗ trợ về vấn đề gì?</p>
                <div className="space-y-2 mb-4">
                  {SUPPORT_TOPICS.map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        selectedTopic === topic.id
                          ? `${topic.color} ring-2 ring-offset-1 ring-primary-500/30`
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-2xl">{topic.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{topic.label}</p>
                      </div>
                      {selectedTopic === topic.id && (
                        <CheckCircle size={18} className="ml-auto text-primary-500" />
                      )}
                    </button>
                  ))}
                </div>
                
                {selectedTopic && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <p className="text-xs text-slate-500 mb-2">Mô tả thêm (tùy chọn):</p>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Mô tả ngắn gọn vấn đề bạn gặp phải..."
                      rows={3}
                      className="w-full resize-none text-sm px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-400 text-slate-700 dark:text-slate-200 placeholder-slate-400 border-none mb-3"
                    />
                    <button
                      onClick={handleCreateRequest}
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-primary-500 to-indigo-500 hover:from-primary-600 hover:to-indigo-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Gửi yêu cầu hỗ trợ
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {!selectedTopic && (
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-slate-500">
                        Chọn chủ đề phù hợp để chúng tôi có thể chuyển yêu cầu đến đúng chuyên viên hỗ trợ.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CustomerChatBubble;

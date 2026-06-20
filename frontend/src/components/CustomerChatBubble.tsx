```typescript
import { useState, useEffect, useRef, useCallback, type ComponentType } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  HelpCircle,
  Loader2,
  MessageCircle,
  Minus,
  Send,
  Sparkles,
  UserCircle2,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../context/auth';
import {
  closeSupportRequest,
  createSupportRequest,
  getConversationMessages,
  getMySupportRequests,
  type DirectMessagePayload,
  type SupportRequestPayload,
} from '../api/apiClient';
import { connectWebSocket, sendDmMessage, subscribeToCustomerSupport, subscribeToDm } from '../services/websocket';

const FILE_BASE_URL = process.env.REACT_APP_FILE_SERVER_URL || '';

type TopicId = 'TECHNICAL' | 'BILLING' | 'ACCOUNT' | 'GENERAL';

interface SupportTopic {
  id: TopicId;
  title: string;
  description: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  accent: string;
}

const SUPPORT_TOPICS: SupportTopic[] = [
  {
    id: 'TECHNICAL',
    title: 'Technical issue',
    description: 'Apps, devices, network, or system errors',
    Icon: Wrench,
    accent: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  {
    id: 'BILLING',
    title: 'Billing',
    description: 'Invoices, plans, payment, or receipts',
    Icon: CreditCard,
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    id: 'ACCOUNT',
    title: 'Account access',
    description: 'Profile, permissions, password, or login help',
    Icon: UserCircle2,
    accent: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  {
    id: 'GENERAL',
    title: 'General question',
    description: 'Anything else our team can help with',
    Icon: HelpCircle,
    accent: 'bg-amber-50 text-amber-700 border-amber-100',
  },
];

const TOPIC_BY_ID = SUPPORT_TOPICS.reduce<Record<string, SupportTopic>>((acc, topic) => {
  acc[topic.id] = topic;
  return acc;
}, {});

function formatTime(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

const getInitials = (name?: string) => {
  if (!name) return 'SD';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SD';
  return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
};

const CustomerChatBubble = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [supportRequest, setSupportRequest] = useState<SupportRequestPayload | null>(null);
  const [lastClosedRequest, setLastClosedRequest] = useState<SupportRequestPayload | null>(null);
  const [messages, setMessages] = useState<DirectMessagePayload[]>([]);
  const [text, setText] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<TopicId | null>(null);
  const [description, setDescription] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeTopic = supportRequest?.topic ? TOPIC_BY_ID[supportRequest.topic] : null;
  const selectedTopicMeta = selectedTopic ? TOPIC_BY_ID[selectedTopic] : null;
  const hasActiveChat = supportRequest?.status === 'ACTIVE' && Boolean(supportRequest.conversationId);
  const hasWaitingRequest = supportRequest?.status === 'WAITING';

  const fetchMyRequests = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMySupportRequests();
      const active = data.find(request => request.status === 'ACTIVE');
      const waiting = data.find(request => request.status === 'WAITING');
      const closed = data.find(request => request.status === 'CLOSED');
      setSupportRequest(active || waiting || null);
      setLastClosedRequest(active || waiting ? null : closed || null);
    } catch {
      setSupportRequest(null);
    }
  }, [user]);

  useEffect(() => {
    if (!open || !user) return;
    fetchMyRequests();
    connectWebSocket().catch(() => {});
  }, [fetchMyRequests, open, user]);

  useEffect(() => {
    if (!open || !user) return;

    const unsubscribe = subscribeToCustomerSupport(user.id, (updatedRequest) => {
      if (updatedRequest.status === 'CLOSED') {
        setLastClosedRequest(updatedRequest);
        setSupportRequest(null);
        setMessages([]);
        setSelectedTopic(null);
        setDescription('');
        return;
      }

      setSupportRequest(updatedRequest);
      setLastClosedRequest(null);
      if (updatedRequest.status === 'ACTIVE') {
        setSelectedTopic(null);
        setDescription('');
      }
    });

    return unsubscribe;
  }, [open, user]);

  useEffect(() => {
    if (!supportRequest?.conversationId || !user || supportRequest.status !== 'ACTIVE') return;

    let cancelled = false;
    setMessagesLoading(true);
    getConversationMessages(supportRequest.conversationId, user.id)
      .then(data => {
        if (!cancelled) setMessages(data);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });

    const unsubscribe = subscribeToDm(supportRequest.conversationId, (msg) => {
      setMessages(prev => {
        if (prev.some(item => item.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [supportRequest?.conversationId, supportRequest?.status, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleCreateRequest = async () => {
    if (!selectedTopic || !user) return;

    setRequestLoading(true);
    setError(null);
    try {
      const request = await createSupportRequest({
        topic: selectedTopic,
        description: description.trim() || undefined,
      });
      setSupportRequest(request.status === 'CLOSED' ? null : request);
      setLastClosedRequest(null);
      setSelectedTopic(null);
      setDescription('');
    } catch {
      setError('We could not send your request. Please try again.');
    } finally {
      setRequestLoading(false);
    }
  };

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

  const handleCloseChat = async () => {
    if (!supportRequest || closing) return;

    setClosing(true);
    setError(null);
    try {
      const closed = await closeSupportRequest(supportRequest.id);
      setLastClosedRequest(closed);
      setSupportRequest(null);
      setMessages([]);
      setText('');
    } catch {
      setError('We could not close this chat. Please try again.');
    } finally {
      setClosing(false);
    }
  };

  const handleStartAnother = () => {
    setLastClosedRequest(null);
    setSupportRequest(null);
    setMessages([]);
    setSelectedTopic(null);
    setDescription('');
    setError(null);
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
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-label={open ? 'Close support messenger' : 'Open support messenger'}
        className={`fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full shadow-[0_18px_45px_rgba(15,23,42,0.25)] transition-all duration-200 sm:bottom-6 sm:right-6 ${
          open
            ? 'bg-slate-900 text-white hover:bg-slate-800'
            : 'bg-[#12312b] text-white hover:-translate-y-0.5 hover:bg-[#17433a]'
        }`}
      >
        {open ? <X size={22} /> : <MessageCircle size={25} />}
        {!open && (hasActiveChat || hasWaitingRequest) && (
          <span
            className={`absolute right-0 top-0 h-4 w-4 rounded-full border-2 border-white ${
              hasActiveChat ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
        )}
      </button>

      {open && (
        <section className="fixed inset-x-3 bottom-24 z-50 flex h-[min(680px,calc(100vh-120px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:inset-x-auto sm:right-6 sm:w-[400px] dark:border-slate-700 dark:bg-slate-950">
          <MessengerHeader
            title={hasActiveChat ? supportRequest?.agentName || 'Support agent' : 'ServiceDesk Support'}
            subtitle={hasActiveChat ? 'Online now' : 'We usually reply in a few minutes'}
            initials={hasActiveChat ? getInitials(supportRequest?.agentName) : 'SD'}
            onMinimize={() => setOpen(false)}
          />

          {error && (
            <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {hasActiveChat && supportRequest?.conversationId ? (
            <ActiveChatView
              agentName={supportRequest.agentName}
              closing={closing}
              messages={messages}
              messagesLoading={messagesLoading}
              onCloseChat={handleCloseChat}
              onKeyDown={handleKeyDown}
              onSend={handleSend}
              text={text}
              topic={activeTopic}
              userId={user.id}
              valueSetter={setText}
              bottomRef={bottomRef}
            />
          ) : hasWaitingRequest ? (
            <WaitingView request={supportRequest} topic={activeTopic} onBack={handleStartAnother} />
          ) : lastClosedRequest ? (
            <ClosedView request={lastClosedRequest} onStartAnother={handleStartAnother} />
          ) : (
            <HomeView
              description={description}
              loading={requestLoading}
              onCreateRequest={handleCreateRequest}
              onSelectTopic={setSelectedTopic}
              selectedTopic={selectedTopic}
              selectedTopicMeta={selectedTopicMeta}
              setDescription={setDescription}
            />
          )}
        </section>
      )}
    </>
  );
};

interface HeaderProps {
  title: string;
  subtitle: string;
  initials: string;
  onMinimize: () => void;
}

const MessengerHeader = ({ title, subtitle, initials, onMinimize }: HeaderProps) => (
  <div className="relative overflow-hidden bg-[#12312b] px-4 pb-4 pt-4 text-white">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_34%)]" />
    <div className="relative flex items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-bold ring-1 ring-white/20">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-white/75">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          <span className="truncate">{subtitle}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onMinimize}
        aria-label="Minimize support messenger"
        className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        <Minus size={18} />
      </button>
    </div>
  </div>
);

interface HomeViewProps {
  description: string;
  loading: boolean;
  onCreateRequest: () => void;
  onSelectTopic: (topic: TopicId) => void;
  selectedTopic: TopicId | null;
  selectedTopicMeta?: SupportTopic | null;
  setDescription: (value: string) => void;
}

const HomeView = ({
  description,
  loading,
  onCreateRequest,
  onSelectTopic,
  selectedTopic,
  selectedTopicMeta,
  setDescription,
}: HomeViewProps) => (
  <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 dark:bg-slate-950">
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <Sparkles size={19} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Hi, how can we help?</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
            Pick a topic and our support team will join the conversation.
          </p>
        </div>
      </div>
    </div>

    <div className="mt-4 space-y-2">
      {SUPPORT_TOPICS.map(topic => {
        const selected = selectedTopic === topic.id;
        return (
          <button
            key={topic.id}
            type="button"
            onClick={() => onSelectTopic(topic.id)}
            className={`group flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:bg-slate-900 dark:hover:border-slate-600 ${
              selected ? 'border-[#12312b] ring-2 ring-[#12312b]/10 dark:border-emerald-400' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${topic.accent}`}>
              <topic.Icon size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-900 dark:text-white">{topic.title}</span>
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{topic.description}</span>
            </span>
            {selected ? (
              <CheckCircle2 size={18} className="text-[#12312b] dark:text-emerald-300" />
            ) : (
              <ChevronRight size={18} className="text-slate-300 transition group-hover:text-slate-500" />
            )}
          </button>
        );
      })}
    </div>

    {selectedTopicMeta && (
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <selectedTopicMeta.Icon size={16} />
          {selectedTopicMeta.title}
        </div>
        <textarea
          value={description}
          onChange={event => setDescription(event.target.value)}
          rows={4}
          placeholder="Add a short note so the agent has context..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#12312b] focus:ring-2 focus:ring-[#12312b]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={onCreateRequest}
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#12312b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#17433a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {loading ? 'Sending request...' : 'Start chat'}
        </button>
      </div>
    )}
  </div>
);

interface WaitingViewProps {
  request: SupportRequestPayload;
  topic?: SupportTopic | null;
  onBack: () => void;
}

const WaitingView = ({ request, topic, onBack }: WaitingViewProps) => {
  const TopicIcon = topic?.Icon || HelpCircle;

  return (
    <div className="flex flex-1 flex-col bg-slate-50 px-4 py-4 dark:bg-slate-950">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex w-fit items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-900 dark:hover:text-slate-200"
      >
        <ArrowLeft size={14} />
        New topic
      </button>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-amber-50 text-amber-600 ring-8 ring-white dark:bg-amber-950/40 dark:text-amber-300 dark:ring-slate-900">
            <Clock3 size={34} />
          </div>
          <span className="absolute -bottom-1 -right-1 grid h-10 w-10 place-items-center rounded-full border-4 border-slate-50 bg-white text-slate-700 shadow-sm dark:border-slate-950 dark:bg-slate-900 dark:text-slate-200">
            <TopicIcon size={18} />
          </span>
        </div>
        <h2 className="mt-7 text-lg font-semibold text-slate-950 dark:text-white">You are in the queue</h2>
        <p className="mt-2 max-w-[300px] text-sm leading-6 text-slate-500 dark:text-slate-400">
          We have notified the support team. An agent will join this chat as soon as possible.
        </p>
        <div className="mt-5 rounded-2xl border border-amber-100 bg-white px-4 py-3 text-left shadow-sm dark:border-amber-900/40 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">Request #{request.id}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{topic?.title || request.topic}</p>
          {request.description && (
            <p className="mt-1 max-w-[280px] text-xs leading-5 text-slate-500 dark:text-slate-400">{request.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

interface ActiveChatViewProps {
  agentName?: string;
  closing: boolean;
  messages: DirectMessagePayload[];
  messagesLoading: boolean;
  onCloseChat: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onSend: () => void;
  text: string;
  topic?: SupportTopic | null;
  userId: number;
  valueSetter: (value: string) => void;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}

const ActiveChatView = ({
  agentName,
  closing,
  messages,
  messagesLoading,
  onCloseChat,
  onKeyDown,
  onSend,
  text,
  topic,
  userId,
  valueSetter,
  bottomRef,
}: ActiveChatViewProps) => (
  <div className="flex min-h-0 flex-1 flex-col bg-slate-50 dark:bg-slate-950">

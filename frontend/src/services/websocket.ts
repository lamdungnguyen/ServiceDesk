import { Client, type IMessage } from '@stomp/stompjs';
import type { DirectMessagePayload, SupportRequestPayload } from '../api/apiClient';
import SockJS from 'sockjs-client';

export interface ChatMessagePayload {
  id?: number;
  ticketId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp?: string;
}

type MessageHandler = (message: ChatMessagePayload) => void;

let stompClient: Client | null = null;
let connectionPromise: Promise<void> | null = null;
const subscriptions = new Map<string, { unsubscribe: () => void }>();

function getWsUrl(): string {
  // Use relative URL — Vite proxy will forward to backend
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  return `${protocol}://${window.location.host}/ws`;
}

export function connectWebSocket(): Promise<void> {
  if (stompClient?.connected) {
    return Promise.resolve();
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = new Promise((resolve, reject) => {
    stompClient = new Client({
      webSocketFactory: () => new SockJS(getWsUrl()),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (msg) => {
        if (import.meta.env.DEV) {
          // Quiet the heartbeat spam, only log important stuff
          if (!msg.includes('heart-beat') && !msg.includes('PING') && !msg.includes('PONG')) {
            console.log('[WS]', msg);
          }
        }
      },
    });

    stompClient.onConnect = () => {
      console.log('[WS] Connected');
      resolve();
    };

    stompClient.onStompError = (frame) => {
      console.error('[WS] STOMP error', frame);
      connectionPromise = null;
      reject(new Error(frame.headers?.message || 'WebSocket connection failed'));
    };

    stompClient.onWebSocketClose = () => {
      connectionPromise = null;
    };

    stompClient.activate();
  });

  return connectionPromise;
}

export function subscribeToTicket(ticketId: number, onMessage: MessageHandler): () => void {
  const destination = `/topic/ticket/${ticketId}`;

  // Avoid duplicate subscriptions
  if (subscriptions.has(destination)) {
    subscriptions.get(destination)!.unsubscribe();
    subscriptions.delete(destination);
  }

  let isUnsubscribed = false;

  if (!stompClient?.connected) {
    console.warn('[WS] Not connected, attempting to connect and subscribe...');
    connectWebSocket().then(() => {
      if (!isUnsubscribed) {
        doSubscribe(destination, onMessage);
      }
    });
    return () => {
      isUnsubscribed = true;
      if (subscriptions.has(destination)) {
        subscriptions.get(destination)!.unsubscribe();
        subscriptions.delete(destination);
      }
    };
  }

  doSubscribe(destination, onMessage);

  return () => {
    isUnsubscribed = true;
    if (subscriptions.has(destination)) {
      subscriptions.get(destination)!.unsubscribe();
      subscriptions.delete(destination);
    }
  };
}

function doSubscribe(destination: string, onMessage: MessageHandler) {
  if (!stompClient?.connected) return;

  const sub = stompClient.subscribe(destination, (message: IMessage) => {
    try {
      const parsed: ChatMessagePayload = JSON.parse(message.body);
      onMessage(parsed);
    } catch (err) {
      console.error('[WS] Failed to parse message', err);
    }
  });

  subscriptions.set(destination, sub);
}

export function sendChatMessage(message: Omit<ChatMessagePayload, 'id' | 'timestamp'>): void {
  if (!stompClient?.connected) {
    console.error('[WS] Cannot send - not connected');
    return;
  }

  stompClient.publish({
    destination: '/app/chat.send',
    body: JSON.stringify(message),
  });
}

export function disconnectWebSocket(): void {
  subscriptions.forEach((sub) => sub.unsubscribe());
  subscriptions.clear();
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
}

// ─── Notification Subscription ───────────────────────────────────────────────

export interface NotificationPayload {
  id: number;
  userId: number;
  message: string;
  type: string;
  ticketId?: number;
  isRead: boolean;
  createdAt: string;
}

type NotificationHandler = (notification: NotificationPayload) => void;

export function subscribeToNotifications(userId: number, onNotification: NotificationHandler): () => void {
  const destination = `/topic/notifications/${userId}`;

  if (subscriptions.has(destination)) {
    subscriptions.get(destination)!.unsubscribe();
    subscriptions.delete(destination);
  }

  let isUnsubscribed = false;

  const doNotifSubscribe = () => {
    if (!stompClient?.connected) return;
    const sub = stompClient.subscribe(destination, (message: IMessage) => {
      try {
        const parsed: NotificationPayload = JSON.parse(message.body);
        onNotification(parsed);
      } catch (err) {
        console.error('[WS] Failed to parse notification', err);
      }
    });
    subscriptions.set(destination, sub);
  };

  if (!stompClient?.connected) {
    connectWebSocket().then(() => {
      if (!isUnsubscribed) {
        doNotifSubscribe();
      }
    }).catch(err => console.error('[WS] connect failed for notifications', err));
  } else {
    doNotifSubscribe();
  }

  return () => {
    isUnsubscribed = true;
    if (subscriptions.has(destination)) {
      subscriptions.get(destination)!.unsubscribe();
      subscriptions.delete(destination);
    }
  };
}

// ─── Call Signaling ──────────────────────────────────────────────────────────

export type CallSignalType =
  | 'CALL_REQUEST'
  | 'CALL_ACCEPT'
  | 'CALL_REJECT'
  | 'CALL_END'
  | 'OFFER'
  | 'ANSWER'
  | 'ICE';

export interface CallSignal {
  type: CallSignalType;
  ticketId: number;
  senderId: number;
  senderName?: string;
  senderRole?: string;
  targetUserId?: number;
  payload?: string;
}

type CallSignalHandler = (signal: CallSignal) => void;

export function subscribeToCall(ticketId: number, onSignal: CallSignalHandler): () => void {
  const destination = `/topic/call/${ticketId}`;

  if (subscriptions.has(destination)) {
    subscriptions.get(destination)!.unsubscribe();
    subscriptions.delete(destination);
  }

  let isUnsubscribed = false;

  const doCallSubscribe = () => {
    if (!stompClient?.connected) return;
    const sub = stompClient.subscribe(destination, (message: IMessage) => {
      try {
        const parsed: CallSignal = JSON.parse(message.body);
        onSignal(parsed);
      } catch (err) {
        console.error('[WS] Failed to parse call signal', err);
      }
    });
    subscriptions.set(destination, sub);
  };

  if (!stompClient?.connected) {
    connectWebSocket().then(() => {
      if (!isUnsubscribed) {
        doCallSubscribe();
      }
    }).catch(err => console.error('[WS] connect failed', err));
  } else {
    doCallSubscribe();
  }

  return () => {
    isUnsubscribed = true;
    if (subscriptions.has(destination)) {
      subscriptions.get(destination)!.unsubscribe();
      subscriptions.delete(destination);
    }
  };
}

// ─── Direct Messaging WebSocket ──────────────────────────────────────────────

type DmMessageHandler = (message: DirectMessagePayload) => void;

export function subscribeToDm(conversationId: number, onMessage: DmMessageHandler): () => void {
  const destination = `/topic/dm/${conversationId}`;

  if (subscriptions.has(destination)) {
    subscriptions.get(destination)!.unsubscribe();
    subscriptions.delete(destination);
  }

  let isUnsubscribed = false;

  const doSubscribe = () => {
    if (!stompClient?.connected) return;
    const sub = stompClient.subscribe(destination, (message: IMessage) => {
      try {
        const parsed: DirectMessagePayload = JSON.parse(message.body);
        onMessage(parsed);
      } catch (err) {
        console.error('[WS] Failed to parse DM message', err);
      }
    });
    subscriptions.set(destination, sub);
  };

  if (!stompClient?.connected) {
    connectWebSocket()
      .then(() => { if (!isUnsubscribed) doSubscribe(); })
      .catch(err => console.error('[WS] connect failed for DM', err));
  } else {
    doSubscribe();
  }

  return () => {
    isUnsubscribed = true;
    if (subscriptions.has(destination)) {
      subscriptions.get(destination)!.unsubscribe();
      subscriptions.delete(destination);
    }
  };
}

export function sendDmMessage(payload: {
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  messageType?: string;
  fileUrl?: string;
  fileName?: string;
}): void {
  if (!stompClient?.connected) {
    console.error('[WS] Cannot send DM - not connected');
    return;
  }
  stompClient.publish({
    destination: '/app/dm.send',
    body: JSON.stringify(payload),
  });
}

/** Subscribe to incoming call requests for a specific user (global — not tied to a ticket) */
export function subscribeToUserCalls(userId: number, onSignal: CallSignalHandler): () => void {
  const destination = `/topic/call/user/${userId}`;

  if (subscriptions.has(destination)) {
    subscriptions.get(destination)!.unsubscribe();
    subscriptions.delete(destination);
  }

  let isUnsubscribed = false;

  const doSubscribe = () => {
    if (!stompClient?.connected) return;
    const sub = stompClient.subscribe(destination, (message: IMessage) => {
      try {
        const parsed: CallSignal = JSON.parse(message.body);
        onSignal(parsed);
      } catch (err) {
        console.error('[WS] Failed to parse user call signal', err);
      }
    });
    subscriptions.set(destination, sub);
  };

  if (!stompClient?.connected) {
    connectWebSocket()
      .then(() => { if (!isUnsubscribed) doSubscribe(); })
      .catch(err => console.error('[WS] connect failed for user calls', err));
  } else {
    doSubscribe();
  }

  return () => {
    isUnsubscribed = true;
    if (subscriptions.has(destination)) {
      subscriptions.get(destination)!.unsubscribe();
      subscriptions.delete(destination);
    }
  };
}

export function sendCallSignal(signal: CallSignal): void {
  if (!stompClient?.connected) {
    console.error('[WS] Cannot send call signal - not connected');
    return;
  }
  stompClient.publish({
    destination: '/app/call.signal',
    body: JSON.stringify(signal),
  });
}

// ─── Support Request WebSocket ───────────────────────────────────────────────

type SupportRequestHandler = (request: SupportRequestPayload) => void;

export function subscribeToSupportRequests(onRequest: SupportRequestHandler): () => void {
  const destination = '/topic/support/requests';

  if (subscriptions.has(destination)) {
    subscriptions.get(destination)!.unsubscribe();
    subscriptions.delete(destination);
  }

  let isUnsubscribed = false;

  const doSubscribe = () => {
    if (!stompClient?.connected) return;
    const sub = stompClient.subscribe(destination, (message: IMessage) => {
      try {
        const parsed: SupportRequestPayload = JSON.parse(message.body);
        onRequest(parsed);
      } catch (err) {
        console.error('[WS] Failed to parse support request', err);
      }
    });
    subscriptions.set(destination, sub);
  };

  if (!stompClient?.connected) {
    connectWebSocket()
      .then(() => { if (!isUnsubscribed) doSubscribe(); })
      .catch(err => console.error('[WS] connect failed for support requests', err));
  } else {
    doSubscribe();
  }

  return () => {
    isUnsubscribed = true;
    if (subscriptions.has(destination)) {
      subscriptions.get(destination)!.unsubscribe();
      subscriptions.delete(destination);
    }
  };
}

export function subscribeToSupportTaken(onTaken: SupportRequestHandler): () => void {
  const destination = '/topic/support/requests/taken';

  if (subscriptions.has(destination)) {
    subscriptions.get(destination)!.unsubscribe();
    subscriptions.delete(destination);
  }

  let isUnsubscribed = false;

  const doSubscribe = () => {
    if (!stompClient?.connected) return;
    const sub = stompClient.subscribe(destination, (message: IMessage) => {
      try {
        const parsed: SupportRequestPayload = JSON.parse(message.body);
        onTaken(parsed);
      } catch (err) {
        console.error('[WS] Failed to parse support taken', err);
      }
    });
    subscriptions.set(destination, sub);
  };

  if (!stompClient?.connected) {
    connectWebSocket()
      .then(() => { if (!isUnsubscribed) doSubscribe(); })
      .catch(err => console.error('[WS] connect failed for support taken', err));
  } else {
    doSubscribe();
  }

  return () => {
    isUnsubscribed = true;
    if (subscriptions.has(destination)) {
      subscriptions.get(destination)!.unsubscribe();
      subscriptions.delete(destination);
    }
  };
}

export function subscribeToCustomerSupport(customerId: number, onUpdate: SupportRequestHandler): () => void {
  const destination = `/topic/support/customer/${customerId}`;

  if (subscriptions.has(destination)) {
    subscriptions.get(destination)!.unsubscribe();
    subscriptions.delete(destination);
  }

  let isUnsubscribed = false;

  const doSubscribe = () => {
    if (!stompClient?.connected) return;
    const sub = stompClient.subscribe(destination, (message: IMessage) => {
      try {
        const parsed: SupportRequestPayload = JSON.parse(message.body);
        onUpdate(parsed);
      } catch (err) {
        console.error('[WS] Failed to parse customer support update', err);
      }
    });
    subscriptions.set(destination, sub);
  };

  if (!stompClient?.connected) {
    connectWebSocket()
      .then(() => { if (!isUnsubscribed) doSubscribe(); })
      .catch(err => console.error('[WS] connect failed for customer support', err));
  } else {
    doSubscribe();
  }

  return () => {
    isUnsubscribed = true;
    if (subscriptions.has(destination)) {
      subscriptions.get(destination)!.unsubscribe();
      subscriptions.delete(destination);
    }
  };
}

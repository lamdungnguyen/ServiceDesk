import { sendCallSignal, type CallSignal } from './websocket';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
];

export interface WebRTCCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
}

let peerConnection: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let currentCallbacks: WebRTCCallbacks | null = null;
let currentCtx: { ticketId: number; selfId: number; selfName: string; selfRole: string; targetUserId: number } | null = null;
let currentMicId: string | undefined = undefined;

function ensurePeerConnection(): RTCPeerConnection {
  if (peerConnection) return peerConnection;

  peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate && currentCtx) {
      sendCallSignal({
        type: 'ICE',
        ticketId: currentCtx.ticketId,
        senderId: currentCtx.selfId,
        senderName: currentCtx.selfName,
        senderRole: currentCtx.selfRole,
        targetUserId: currentCtx.targetUserId,
        payload: JSON.stringify(event.candidate.toJSON()),
      });
    }
  };

  peerConnection.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      currentCallbacks?.onRemoteStream(event.streams[0]);
    }
  };

  peerConnection.onconnectionstatechange = () => {
    if (peerConnection) {
      currentCallbacks?.onConnectionStateChange(peerConnection.connectionState);
    }
  };

  return peerConnection;
}

async function attachLocalStream(): Promise<MediaStream> {
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
  }
  const constraints = currentMicId ? { audio: { deviceId: { exact: currentMicId } }, video: false } : { audio: true, video: false };
  localStream = await navigator.mediaDevices.getUserMedia(constraints);
  
  const pc = ensurePeerConnection();
  
  // Clear old senders
  pc.getSenders().forEach(sender => {
    if (sender.track) pc.removeTrack(sender);
  });

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream!));
  return localStream;
}

export async function setAudioInputDevice(deviceId: string): Promise<void> {
  currentMicId = deviceId;
  if (peerConnection && peerConnection.connectionState !== 'closed') {
    await attachLocalStream();
    
    // Renegotiate to update track
    const offer = await peerConnection.createOffer({ offerToReceiveAudio: true });
    await peerConnection.setLocalDescription(offer);
    if (currentCtx) {
      sendCallSignal({
        type: 'OFFER',
        ticketId: currentCtx.ticketId,
        senderId: currentCtx.selfId,
        senderName: currentCtx.selfName,
        senderRole: currentCtx.selfRole,
        targetUserId: currentCtx.targetUserId,
        payload: JSON.stringify(offer),
      });
    }
  }
}

export interface WebRTCContext {
  ticketId: number;
  selfId: number;
  selfName: string;
  selfRole: string;
  targetUserId: number;
}

export function setContext(ctx: WebRTCContext) {
  currentCtx = ctx;
}

export function setCallbacks(cb: WebRTCCallbacks) {
  currentCallbacks = cb;
}

export async function startOffer(): Promise<void> {
  if (!currentCtx) throw new Error('WebRTC context not set');
  await attachLocalStream();
  const pc = ensurePeerConnection();
  const offer = await pc.createOffer({ offerToReceiveAudio: true });
  await pc.setLocalDescription(offer);
  sendCallSignal({
    type: 'OFFER',
    ticketId: currentCtx.ticketId,
    senderId: currentCtx.selfId,
    senderName: currentCtx.selfName,
    senderRole: currentCtx.selfRole,
    targetUserId: currentCtx.targetUserId,
    payload: JSON.stringify(offer),
  });
}

let iceCandidateQueue: RTCIceCandidateInit[] = [];

export async function handleOffer(signal: CallSignal): Promise<void> {
  if (!signal.payload || !currentCtx) return;
  await attachLocalStream();
  const pc = ensurePeerConnection();
  const offer = JSON.parse(signal.payload) as RTCSessionDescriptionInit;
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  
  // Process queued ICE candidates
  for (const candidate of iceCandidateQueue) {
    await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => console.error('[WebRTC] Failed to add queued ICE candidate', err));
  }
  iceCandidateQueue = [];

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  sendCallSignal({
    type: 'ANSWER',
    ticketId: currentCtx.ticketId,
    senderId: currentCtx.selfId,
    senderName: currentCtx.selfName,
    senderRole: currentCtx.selfRole,
    targetUserId: signal.senderId,
    payload: JSON.stringify(answer),
  });
}

export async function handleAnswer(signal: CallSignal): Promise<void> {
  if (!signal.payload || !peerConnection) return;
  const answer = JSON.parse(signal.payload) as RTCSessionDescriptionInit;
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

  // Process queued ICE candidates
  for (const candidate of iceCandidateQueue) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => console.error('[WebRTC] Failed to add queued ICE candidate', err));
  }
  iceCandidateQueue = [];
}

export async function handleIce(signal: CallSignal): Promise<void> {
  if (!signal.payload || !peerConnection) return;
  try {
    const candidate = JSON.parse(signal.payload) as RTCIceCandidateInit;
    if (peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      iceCandidateQueue.push(candidate);
    }
  } catch (err) {
    console.error('[WebRTC] Failed to add ICE candidate', err);
  }
}

export function setMuted(muted: boolean): void {
  if (!localStream) return;
  localStream.getAudioTracks().forEach((track) => {
    track.enabled = !muted;
  });
}

export function endCall(): void {
  if (peerConnection) {
    try { peerConnection.close(); } catch { /* ignore */ }
    peerConnection = null;
  }
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
  iceCandidateQueue = [];
  currentCallbacks = null;
  currentCtx = null;
  currentMicId = undefined;
}

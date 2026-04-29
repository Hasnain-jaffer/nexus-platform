/**
 * useWebRTC.ts — WebRTC hook for video/voice calls
 *
 * Uses Socket.IO for signalling (offer/answer/ICE exchange).
 * Actual media streams travel peer-to-peer — never through the server.
 *
 * Usage in ChatPage:
 *   const webrtc = useWebRTC(chatPartnerId);
 *   <button onClick={() => webrtc.startCall('video')}>Video Call</button>
 *   {webrtc.callState !== 'idle' && <CallModal webrtc={webrtc} partner={chatPartner} />}
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket';

export type CallType   = 'video' | 'voice';
export type CallState  = 'idle' | 'calling' | 'incoming' | 'connected';

export interface IncomingCallInfo {
  from:       string;
  fromName:   string;
  fromAvatar: string;
  callType:   CallType;
  offer:      RTCSessionDescriptionInit;
}

export interface WebRTCControls {
  callState:    CallState;
  callType:     CallType | null;
  localStream:  MediaStream | null;
  remoteStream: MediaStream | null;
  incomingCall: IncomingCallInfo | null;
  isMuted:      boolean;
  isCamOff:     boolean;
  startCall:    (type: CallType) => Promise<void>;
  answerCall:   () => Promise<void>;
  rejectCall:   () => void;
  endCall:      () => void;
  toggleMute:   () => void;
  toggleCam:    () => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export const useWebRTC = (remoteUserId: string | undefined): WebRTCControls => {
  const { socket, emit } = useSocket();

  const [callState,    setCallState]    = useState<CallState>('idle');
  const [callType,     setCallType]     = useState<CallType | null>(null);
  const [localStream,  setLocalStream]  = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
  const [isMuted,      setIsMuted]      = useState(false);
  const [isCamOff,     setIsCamOff]     = useState(false);

  const pcRef           = useRef<RTCPeerConnection | null>(null);
  const localStreamRef  = useRef<MediaStream | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const stopLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
  }, []);

  const closePeerConnection = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    pendingCandidates.current = [];
  }, []);

  const cleanup = useCallback(() => {
    stopLocalStream();
    closePeerConnection();
    setRemoteStream(null);
    setCallState('idle');
    setCallType(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsCamOff(false);
  }, [stopLocalStream, closePeerConnection]);

  const getMedia = useCallback(async (type: CallType): Promise<MediaStream> => {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video' ? { width: 1280, height: 720 } : false,
    });
  }, []);

  const createPC = useCallback((onIceCandidate: (c: RTCIceCandidate) => void): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate) onIceCandidate(e.candidate);
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0] || new MediaStream([e.track]));
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        cleanup();
      }
    };

    return pc;
  }, [cleanup]);

  // ── Start an outgoing call ───────────────────────────────────────────────

  const startCall = useCallback(async (type: CallType) => {
    if (!remoteUserId || callState !== 'idle') return;

    setCallType(type);
    setCallState('calling');

    try {
      const stream = await getMedia(type);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPC((candidate) => {
        emit('call:ice', { to: remoteUserId, candidate });
      });
      pcRef.current = pc;

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      emit('call:initiate', { to: remoteUserId, callType: type, offer });
    } catch (err) {
      console.error('[WebRTC] startCall error:', err);
      cleanup();
    }
  }, [remoteUserId, callState, getMedia, createPC, emit, cleanup]);

  // ── Answer an incoming call ───────────────────────────────────────────────

  const answerCall = useCallback(async () => {
    if (!incomingCall) return;

    setCallState('connected');

    try {
      const stream = await getMedia(incomingCall.callType);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPC((candidate) => {
        emit('call:ice', { to: incomingCall.from, candidate });
      });
      pcRef.current = pc;

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

      // Flush any ICE candidates that arrived before remote description was set
      for (const c of pendingCandidates.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      }
      pendingCandidates.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      emit('call:answer', { to: incomingCall.from, answer });
    } catch (err) {
      console.error('[WebRTC] answerCall error:', err);
      cleanup();
    }
  }, [incomingCall, getMedia, createPC, emit, cleanup]);

  // ── Reject incoming call ─────────────────────────────────────────────────

  const rejectCall = useCallback(() => {
    if (incomingCall) emit('call:reject', { to: incomingCall.from });
    cleanup();
  }, [incomingCall, emit, cleanup]);

  // ── End the call ─────────────────────────────────────────────────────────

  const endCall = useCallback(() => {
    const target = incomingCall?.from || remoteUserId;
    if (target) emit('call:end', { to: target });
    cleanup();
  }, [incomingCall, remoteUserId, emit, cleanup]);

  // ── Toggle mute ──────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => {
      t.enabled = !t.enabled;
    });
    setIsMuted(m => !m);
  }, []);

  // ── Toggle camera ────────────────────────────────────────────────────────

  const toggleCam = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => {
      t.enabled = !t.enabled;
    });
    setIsCamOff(c => !c);
  }, []);

  // ── Socket event listeners ───────────────────────────────────────────────

  useEffect(() => {
    if (!socket) return;

    // Someone is calling us
    const onIncoming = (data: IncomingCallInfo) => {
      if (callState !== 'idle') {
        // Already in a call — auto-reject
        emit('call:reject', { to: data.from });
        return;
      }
      setIncomingCall(data);
      setCallType(data.callType);
      setCallState('incoming');
    };

    // The other person answered our call
    const onAnswered = async ({ answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));

        for (const c of pendingCandidates.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
        pendingCandidates.current = [];

        setCallState('connected');
      } catch (err) {
        console.error('[WebRTC] setRemoteDescription error:', err);
      }
    };

    // The other person rejected our call
    const onRejected = () => {
      cleanup();
    };

    // ICE candidate from remote peer
    const onIce = async ({ candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      if (pcRef.current?.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      } else {
        pendingCandidates.current.push(candidate);
      }
    };

    // Remote ended the call
    const onEnded = () => {
      cleanup();
    };

    socket.on('call:incoming', onIncoming);
    socket.on('call:answered', onAnswered);
    socket.on('call:rejected', onRejected);
    socket.on('call:ice',      onIce);
    socket.on('call:ended',    onEnded);

    return () => {
      socket.off('call:incoming', onIncoming);
      socket.off('call:answered', onAnswered);
      socket.off('call:rejected', onRejected);
      socket.off('call:ice',      onIce);
      socket.off('call:ended',    onEnded);
    };
  }, [socket, callState, emit, cleanup]);

  // Cleanup on unmount
  useEffect(() => () => { cleanup(); }, [cleanup]);

  return {
    callState,
    callType,
    localStream,
    remoteStream,
    incomingCall,
    isMuted,
    isCamOff,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCam,
  };
};

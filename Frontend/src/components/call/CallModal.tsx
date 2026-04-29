/**
 * CallModal.tsx — Full-screen modal for video / voice calls
 *
 * States it renders:
 *  - calling   : "Calling Alex…" with cancel button
 *  - incoming  : "Alex is calling you" with accept / reject buttons
 *  - connected : live video/audio feeds with mute / cam / end controls
 */
import React, { useEffect, useRef } from 'react';
import {
  Phone, PhoneOff, PhoneMissed,
  Video, VideoOff, Mic, MicOff,
} from 'lucide-react';
import { WebRTCControls, CallType } from '../../hooks/useWebRTC';
import { User } from '../../types';
import { Avatar } from '../ui/Avatar';

interface CallModalProps {
  webrtc:   WebRTCControls;
  partner:  User | null;
}

export const CallModal: React.FC<CallModalProps> = ({ webrtc, partner }) => {
  const {
    callState, callType, incomingCall,
    localStream, remoteStream,
    isMuted, isCamOff,
    answerCall, rejectCall, endCall,
    toggleMute, toggleCam,
  } = webrtc;

  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach streams to <video> elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callState === 'idle') return null;

  const callerName   = incomingCall?.fromName   || partner?.name || 'Unknown';
  const callerAvatar = incomingCall?.fromAvatar  || partner?.avatarUrl;
  const activeType   = (incomingCall?.callType ?? callType) as CallType | null;
  const isVideo      = activeType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in">

      {/* ── CONNECTED: show video/audio feeds ── */}
      {callState === 'connected' && (
        <div className="relative w-full h-full flex items-center justify-center bg-gray-900">

          {/* Remote video (full screen) */}
          {isVideo ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            /* Voice call — show avatar */
            <div className="flex flex-col items-center gap-4">
              <Avatar src={partner?.avatarUrl} alt={callerName} size="xl" status="online" />
              <p className="text-white text-2xl font-semibold">{callerName}</p>
              <p className="text-gray-300 text-sm animate-pulse">Connected · Voice call</p>
            </div>
          )}

          {/* Local video PiP */}
          {isVideo && (
            <div className="absolute top-4 right-4 w-36 h-24 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isCamOff && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff size={20} className="text-gray-400" />
                </div>
              )}
            </div>
          )}

          {/* Controls bar */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
            {/* Mute */}
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            {/* End call */}
            <button
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-colors"
              title="End call"
            >
              <PhoneOff size={28} />
            </button>

            {/* Toggle cam (video calls only) */}
            {isVideo && (
              <button
                onClick={toggleCam}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isCamOff ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title={isCamOff ? 'Turn camera on' : 'Turn camera off'}
              >
                {isCamOff ? <VideoOff size={22} /> : <Video size={22} />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── CALLING: outgoing ring ── */}
      {callState === 'calling' && (
        <div className="bg-gray-900 rounded-2xl p-10 flex flex-col items-center gap-6 min-w-[320px] shadow-2xl">
          <div className="relative">
            <Avatar src={partner?.avatarUrl} alt={partner?.name || ''} size="xl" />
            <span className="absolute inset-0 rounded-full border-4 border-primary-400 animate-ping opacity-40" />
          </div>
          <div className="text-center">
            <p className="text-white text-xl font-semibold">{partner?.name}</p>
            <p className="text-gray-400 text-sm mt-1 animate-pulse">
              {isVideo ? 'Video calling…' : 'Voice calling…'}
            </p>
          </div>
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-colors"
            title="Cancel call"
          >
            <PhoneOff size={28} />
          </button>
        </div>
      )}

      {/* ── INCOMING: ringing ── */}
      {callState === 'incoming' && (
        <div className="bg-gray-900 rounded-2xl p-10 flex flex-col items-center gap-6 min-w-[320px] shadow-2xl">
          <div className="relative">
            <Avatar src={callerAvatar} alt={callerName} size="xl" />
            <span className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-40" />
          </div>
          <div className="text-center">
            <p className="text-white text-xl font-semibold">{callerName}</p>
            <p className="text-gray-400 text-sm mt-1">
              Incoming {activeType === 'video' ? 'video' : 'voice'} call…
            </p>
          </div>
          <div className="flex items-center gap-8">
            {/* Reject */}
            <button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-colors"
              title="Decline"
            >
              <PhoneMissed size={28} />
            </button>
            {/* Accept */}
            <button
              onClick={answerCall}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg transition-colors"
              title="Accept"
            >
              <Phone size={28} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

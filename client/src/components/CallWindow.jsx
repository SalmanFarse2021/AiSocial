'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useCall } from '@/contexts/CallContext';
import { X, Phone, PhoneOff, Mic, MicOff, Video, VideoOff, PhoneIncoming } from 'lucide-react';

export default function CallWindow() {
  const {
    isCallActive,
    callType,
    incomingCall,
    remoteUser,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callStartTime,
    callStatus,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);

  // Update local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Update remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Update call duration
  useEffect(() => {
    if (callStatus === 'connected' && callStartTime) {
      const interval = setInterval(() => {
        const duration = Math.floor((Date.now() - callStartTime) / 1000);
        setCallDuration(duration);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [callStatus, callStartTime]);

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render incoming call notification
  if (incomingCall && !isCallActive) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
            {/* Caller Avatar */}
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                {incomingCall.fromPic ? (
                  <Image
                    src={incomingCall.fromPic}
                    alt={incomingCall.fromName}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  incomingCall.fromName.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Caller Info */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {incomingCall.fromName}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Incoming {incomingCall.callType === 'video' ? 'video' : 'audio'} call...
            </p>

            {/* Call Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={rejectCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                onClick={answerCall}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors shadow-lg animate-pulse"
              >
                <PhoneIncoming className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render active call window
  if (isCallActive) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Remote Video (full screen) */}
        <div className="absolute inset-0">
          {callType === 'video' && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold mb-4">
                  {remoteUser?.profilePic ? (
                    <Image
                      src={remoteUser.profilePic}
                      alt={remoteUser.username || 'Remote user avatar'}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    remoteUser?.username?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <h2 className="text-white text-2xl font-semibold mb-2">
                  {remoteUser?.username || 'Unknown User'}
                </h2>
                <p className="text-gray-400">
                  {callStatus === 'calling' && 'Calling...'}
                  {callStatus === 'ringing' && 'Ringing...'}
                  {callStatus === 'connecting' && 'Connecting...'}
                  {callStatus === 'connected' && formatDuration(callDuration)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (picture-in-picture) */}
        {callType === 'video' && localStream && (
          <div className="absolute top-4 right-4 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            />
            {isVideoOff && (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <VideoOff className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        )}

        {/* Call Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
          <div className="max-w-md mx-auto">
            {/* Call Info */}
            {callStatus === 'connected' && (
              <div className="text-center mb-6">
                <p className="text-white text-lg font-semibold mb-1">
                  {remoteUser?.username || 'Unknown User'}
                </p>
                <p className="text-gray-300">
                  {formatDuration(callDuration)}
                </p>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-4 justify-center items-center">
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                  isMuted
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                } text-white`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Toggle Button (only for video calls) */}
              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                    isVideoOff
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  } text-white`}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {/* End Call Button */}
              <button
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

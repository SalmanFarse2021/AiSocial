'use client';

import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';

const IncomingCall = () => {
  const { incomingCall, answerCall, rejectCall } = useCall();
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    if (incomingCall) {
      setIsRinging(true);
      // Play ringtone (optional)
      // const audio = new Audio('/sounds/ringtone.mp3');
      // audio.loop = true;
      // audio.play();
    } else {
      setIsRinging(false);
    }
  }, [incomingCall]);

  if (!incomingCall) return null;

  const hasVideo = incomingCall.offer?.sdp?.includes('m=video');
  const callType = hasVideo ? 'Video' : 'Audio';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-8 w-[90%] max-w-md mx-4 animate-fadeIn">
        {/* Caller Info */}
        <div className="text-center mb-8">
          <div className={`relative inline-block mb-4 ${isRinging ? 'animate-pulse' : ''}`}>
            <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm p-1">
              <img
                src={incomingCall.fromPic || '/default-avatar.png'}
                alt={incomingCall.fromName}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
            </div>
            {/* Ring animation */}
            {isRinging && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-pulse"></div>
              </>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {incomingCall.fromName || 'Unknown User'}
          </h2>
          
          <div className="flex items-center justify-center gap-2 text-white/90">
            {hasVideo ? (
              <Video className="w-5 h-5" />
            ) : (
              <Phone className="w-5 h-5" />
            )}
            <span className="text-lg">Incoming {callType} Call...</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {/* Reject Button */}
          <button
            onClick={rejectCall}
            className="group relative bg-red-500 hover:bg-red-600 text-white rounded-full p-6 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg"
            aria-label="Reject call"
          >
            <PhoneOff className="w-8 h-8 transform group-hover:rotate-12 transition-transform" />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-sm whitespace-nowrap">
              Decline
            </span>
          </button>

          {/* Answer Button */}
          <button
            onClick={answerCall}
            className="group relative bg-green-500 hover:bg-green-600 text-white rounded-full p-6 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg animate-bounce"
            aria-label="Answer call"
          >
            <Phone className="w-8 h-8 transform group-hover:-rotate-12 transition-transform" />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-sm whitespace-nowrap">
              Accept
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;

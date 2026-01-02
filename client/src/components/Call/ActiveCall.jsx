"use client";
import React, { useEffect, useRef } from 'react';
import { useCall } from '@/contexts/CallContext';
import { getSocket } from '@/lib/socket';

const ActiveCall = () => {
    const { state, dispatch } = useCall();
    const { localStream, remoteStream, callType, isMuted, isVideoEnabled, callId } = state;
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

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

    const handleEndCall = () => {
        const socket = getSocket();
        socket?.emit('call:end', { callId });
        dispatch({ type: 'END_CALL' });
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
            dispatch({ type: 'TOGGLE_MUTE' });
        }
    };

    const toggleVideo = () => {
        if (localStream && callType === 'video') {
            localStream.getVideoTracks().forEach(track => track.enabled = !isVideoEnabled);
            dispatch({ type: 'TOGGLE_VIDEO' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
            {/* Remote Video (Full Screen) */}
            <div className="absolute inset-0 w-full h-full bg-zinc-900">
                {remoteStream ? (
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col gap-4">
                        <div className="w-24 h-24 rounded-full bg-zinc-800 animate-pulse" />
                        <p className="text-zinc-500">Connecting...</p>
                    </div>
                )}
            </div>

            {/* Local Video (PiP) */}
            {callType === 'video' && (
                <div className="absolute top-4 right-4 w-32 h-48 bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-700">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror-mode" />
                    {!isVideoEnabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                            <p className="text-xs text-white">Camera Off</p>
                        </div>
                    )}
                </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-zinc-900/80 backdrop-blur-md px-8 py-4 rounded-full border border-zinc-700 shadow-xl">
                {/* Mute */}
                <button onClick={toggleMute} className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>
                    {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18ZM20.25 13.5v-3c0-1.025-.2-2-.56-2.903.018.196.028.396.028.604a.75.75 0 0 1 .75.75c0 .513-.178 1.488-.218 1.549Z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                            <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                        </svg>
                    )}
                </button>

                {/* Video Toggle */}
                {callType === 'video' && (
                    <button onClick={toggleVideo} className={`p-4 rounded-full transition-colors ${!isVideoEnabled ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>
                        {!isVideoEnabled ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18Z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
                            </svg>
                        )}
                    </button>
                )}

                {/* End Call */}
                <button onClick={handleEndCall} className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ActiveCall;

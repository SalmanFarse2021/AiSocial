"use client";
import { useEffect, useRef } from 'react';

export default function AudioCall({
    remoteStream,
    isMuted,
    callDuration,
    onToggleMute,
    onEndCall,
    callerName
}) {
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioRef.current && remoteStream) {
            audioRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="p-8 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{callerName || 'Unknown'}</h2>
                    <p className="text-green-400 text-sm font-medium mb-1">Call in progress</p>
                    <p className="text-slate-400 text-lg font-mono">{callDuration}</p>
                </div>

                {/* Audio element */}
                <audio ref={audioRef} autoPlay />

                {/* Controls */}
                <div className="p-6 flex items-center justify-center gap-4">
                    {/* Mute button */}
                    <button
                        onClick={onToggleMute}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isMuted
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-slate-700 hover:bg-slate-600'
                            }`}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        )}
                    </button>

                    {/* End call button */}
                    <button
                        onClick={onEndCall}
                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg"
                        title="End call"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

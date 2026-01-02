"use client";
import React from 'react';
import { useCall } from '@/contexts/CallContext';
import { getSocket } from '@/lib/socket';

const OutgoingCall = () => {
    const { state, dispatch } = useCall();
    const { callId, callee, callType } = state;

    const handleCancel = () => {
        const socket = getSocket();
        socket?.emit('call:cancel', { callId });
        dispatch({ type: 'END_CALL' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 w-80 flex flex-col items-center">
                <div className="relative mb-6">
                    {callee?.profilePic ? (
                        <img src={callee.profilePic} alt={callee.username} className="w-24 h-24 rounded-full object-cover shadow-lg border-2 border-white dark:border-zinc-700 animate-pulse" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center text-3xl font-bold shadow-lg border-2 border-white dark:border-zinc-700 animate-pulse">
                            {callee?.username?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>

                <h3 className="text-xl font-bold mb-1">{callee?.username}</h3>
                <p className="text-gray-500 text-sm mb-8 capitalize">Calling {callType}...</p>

                <button onClick={handleCancel} className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default OutgoingCall;

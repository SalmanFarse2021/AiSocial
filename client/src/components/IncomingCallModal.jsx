"use client";

export default function IncomingCallModal({ callerName, onAccept, onReject }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden animate-pulse-slow">
                {/* Header */}
                <div className="p-8 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-bounce">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Incoming Call</h2>
                    <p className="text-slate-300 text-lg">{callerName || 'Unknown'}</p>
                    <p className="text-slate-400 text-sm mt-2">wants to audio call you</p>
                </div>

                {/* Actions */}
                <div className="p-6 flex items-center justify-center gap-6">
                    {/* Reject button */}
                    <button
                        onClick={onReject}
                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg hover:scale-110"
                        title="Reject call"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Accept button */}
                    <button
                        onClick={onAccept}
                        className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all shadow-lg hover:scale-110"
                        title="Accept call"
                    >
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

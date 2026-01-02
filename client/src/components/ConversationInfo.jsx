import React from 'react';

const ConversationInfo = ({ conversation, onClose, onMute, onDelete, messages, currentUserId, onBlock }) => {
    if (!conversation) return null;

    // Find other participant for direct chat
    const otherUser = conversation.participants.find(p => p._id !== currentUserId);

    // Shared Media (Images)
    const sharedImages = messages
        .filter(msg => msg.attachment?.type === 'image')
        .map(msg => msg.attachment.url)
        .reverse();

    const isMuted = conversation.mutedBy?.includes(currentUserId);

    return (
        <div className="w-[350px] border-l border-gray-200 dark:border-zinc-800 bg-white dark:bg-black h-full flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-300 shadow-xl z-20">
            {/* Header */}
            <div className="h-[60px] border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between px-6 sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-sm z-10">
                <h2 className="font-bold text-xl tracking-tight">Details</h2>
                <button
                    onClick={onClose}
                    className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Profile Section */}
                <div className="flex flex-col items-center pt-8 pb-6 px-4">
                    <div className="relative mb-4 group cursor-pointer">
                        {otherUser?.profilePic ? (
                            <img src={otherUser.profilePic} alt={otherUser.username} className="w-28 h-28 rounded-full object-cover shadow-sm ring-2 ring-gray-100 dark:ring-zinc-800" />
                        ) : (
                            <div className="w-28 h-28 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-4xl font-bold text-indigo-500 ring-2 ring-indigo-50 dark:ring-indigo-900/50">
                                {otherUser?.username?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <h3 className="font-bold text-2xl tracking-tight mb-1">{otherUser?.username}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-4">{otherUser?.displayName || 'Instagram User'}</p>

                    <div className="flex gap-4 w-full justify-center px-8">
                        <button className="flex-1 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors">
                            Profile
                        </button>
                        <button className="flex-1 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors">
                            Search
                        </button>
                    </div>
                </div>

                <div className="px-4">
                    {/* Settings Section */}
                    <div className="py-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Chat Settings</h4>

                        <button onClick={onMute} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="text-black dark:text-white">
                                    Theme
                                </div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 border-2 border-white dark:border-black shadow-sm" />
                        </button>

                        <button onClick={onMute} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors group">
                            <div className="text-black dark:text-white">
                                Mute Messages
                            </div>
                            <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${isMuted ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-zinc-600'}`}>
                                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${isMuted ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </button>
                    </div>

                    <hr className="border-gray-100 dark:border-zinc-800 my-2" />

                    {/* Media Section */}
                    <div className="py-4">
                        <div className="flex items-center justify-between px-2 mb-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shared Media</h4>
                            <button className="text-xs font-semibold text-blue-500 hover:text-blue-600">See All</button>
                        </div>

                        {sharedImages.length > 0 ? (
                            <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
                                {sharedImages.slice(0, 6).map((src, idx) => (
                                    <div key={idx} className="aspect-square relative cursor-pointer hover:opacity-90 transition-opacity">
                                        <img src={src} alt="" className="w-full h-full object-cover" onClick={() => window.open(src, '_blank')} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 dark:bg-zinc-900 rounded-xl">
                                <p className="text-gray-400 text-sm">No photos shared yet</p>
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-100 dark:border-zinc-800 my-2" />

                    {/* Privacy & Support */}
                    <div className="py-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Privacy & Support</h4>

                        <button onClick={onBlock} className="w-full text-left p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-medium transition-colors flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                            </svg>
                            Block {otherUser?.username}
                        </button>
                        <button onClick={onDelete} className="w-full text-left p-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 font-medium transition-colors flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.65l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                            </svg>
                            Delete Chat
                        </button>
                    </div>

                    <div className="py-6 text-center">
                        <p className="text-xs text-gray-300 dark:text-gray-600">AiSocial Messenger v1.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConversationInfo;

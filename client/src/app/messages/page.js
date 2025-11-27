"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Messenger from '@/components/Messenger';
import Navbar from '@/components/Navbar';

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const toUsername = searchParams.get('to');

  useEffect(() => {
    const createOrFindConversation = async () => {
      if (!toUsername || isCreatingConversation) return;

      console.log('🔍 Looking for conversation with:', toUsername);
      setIsCreatingConversation(true);

      try {
        const token = localStorage.getItem('token');

        // First, get the user by username
        const userResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/users/profile/${toUsername}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!userResponse.ok) {
          console.error('❌ User not found');
          setIsCreatingConversation(false);
          return;
        }

        const userData = await userResponse.json();
        const targetUserId = userData.profile.id;
        console.log('✅ Found user:', targetUserId);

        // Check if conversation already exists
        const conversationsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/messages/conversations`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json();
          const existingConversation = conversationsData.conversations?.find(conv =>
            conv.participants?.some(p => p._id === targetUserId || p === targetUserId)
          );

          if (existingConversation) {
            console.log('✅ Found existing conversation:', existingConversation._id);
            setConversationId(existingConversation._id);
            // Remove the 'to' parameter from URL
            router.replace('/messages');
            setIsCreatingConversation(false);
            return;
          }
        }

        console.log('📝 Creating/getting direct conversation with:', targetUserId);

        // Get or create direct conversation
        const createResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050'}/api/messages/conversations/direct`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ recipientId: targetUserId }),
          }
        );

        if (createResponse.ok) {
          const data = await createResponse.json();
          console.log('✅ Created new conversation:', data.conversation._id);
          setConversationId(data.conversation._id);
          // Remove the 'to' parameter from URL
          router.replace('/messages');
        } else {
          const errorData = await createResponse.json();
          console.error('❌ Failed to create conversation:', errorData);
        }
      } catch (error) {
        console.error('❌ Error creating/finding conversation:', error);
      } finally {
        setIsCreatingConversation(false);
      }
    };

    createOrFindConversation();
  }, [toUsername, router, isCreatingConversation]);

  if (isCreatingConversation) {
    return (
      <div className="flex w-full h-screen overflow-hidden pt-[60px] md:pt-0 bg-white dark:bg-slate-950 transition-colors">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600 dark:text-gray-400">Starting conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen overflow-hidden pt-[60px] md:pt-0 bg-white dark:bg-slate-950 transition-colors">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <Messenger compact={false} conversationId={conversationId} />
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex w-full h-screen items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}

import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { User } from '../models/User.js';

// Get or create a direct conversation between two users
export const getOrCreateDirectConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    if (userId === recipientId) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [userId, recipientId] },
    }).populate('participants', 'username profilePic');

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        type: 'direct',
        participants: [userId, recipientId],
      });
      await conversation.save();
      await conversation.populate('participants', 'username profilePic');
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({ message: 'Failed to get/create conversation' });
  }
};

// Get all conversations for the current user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId,
      isArchived: { $ne: true },
    })
      .populate('participants', 'username profilePic')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 })
      .lean();

    // Format conversation data for frontend
    const formattedConversations = conversations.map((conv) => ({
      _id: conv._id,
      type: conv.type,
      participantNames: conv.participants
        .filter((p) => p._id.toString() !== userId)
        .map((p) => p.username),
      participants: conv.participants.filter((p) => p._id.toString() !== userId),
      lastMessage: conv.lastMessage?.content || '',
      lastMessageAt: conv.lastMessageAt,
      name: conv.name,
      avatar: conv.avatar,
    }));

    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

// Get messages for a specific conversation
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Verify user is a participant in the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: { $ne: true },
    })
      .populate('sender', 'username profilePic')
      .populate('replyTo')
      .populate({
        path: 'sharedPost',
        populate: { path: 'user', select: 'username profilePic' }
      })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    // Reverse to get chronological order
    messages.reverse();

    // Mark messages as read
    await Message.updateMany(
      { conversation: conversationId, 'readBy.user': { $ne: userId } },
      { $addToSet: { readBy: { user: userId, readAt: new Date() } } }
    );

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { content, type = 'text', attachment, replyTo, sharedPost } = req.body;

    // Validate conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
    }

    // Validate content (required unless sharing a post)
    if (!sharedPost && (!content || !content.trim())) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: userId,
      content: content ? content.trim() : (sharedPost ? 'Shared a post' : ''),
      type,
      attachment,
      replyTo,
      sharedPost,
    });

    await message.save();
    await message.populate('sender', 'username profilePic');

    // Populate shared post if present
    if (sharedPost) {
      await message.populate({
        path: 'sharedPost',
        populate: { path: 'user', select: 'username profilePic' }
      });
    }

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await Message.updateMany(
      { conversation: conversationId, 'readBy.user': { $ne: userId } },
      { $addToSet: { readBy: { user: userId, readAt: new Date() } } }
    );

    res.json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};

// Add reaction to a message
export const addMessageReaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user already reacted with this emoji
    let reaction = message.reactions.find((r) => r.emoji === emoji);

    if (reaction) {
      // Add user to existing reaction
      if (!reaction.users.includes(userId)) {
        reaction.users.push(userId);
      }
    } else {
      // Create new reaction
      message.reactions.push({ emoji, users: [userId] });
    }

    await message.save();
    await message.populate('sender', 'username profilePic');

    res.json({ message });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ message: 'Failed to add reaction' });
  }
};

// Remove reaction from a message
export const removeMessageReaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const reactionIndex = message.reactions.findIndex((r) => r.emoji === emoji);
    if (reactionIndex !== -1) {
      const reaction = message.reactions[reactionIndex];
      reaction.users = reaction.users.filter((id) => id.toString() !== userId);

      // Remove reaction if no users left
      if (reaction.users.length === 0) {
        message.reactions.splice(reactionIndex, 1);
      }
    }

    await message.save();
    await message.populate('sender', 'username profilePic');

    res.json({ message });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ message: 'Failed to remove reaction' });
  }
};

// Delete a message (soft delete)
export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only the sender can delete their own message
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = '[Message deleted]';

    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
};

// Create a group chat
export const createGroupChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, participantIds, description, avatar } = req.body;

    if (!name || !participantIds || participantIds.length === 0) {
      return res.status(400).json({ message: 'Group name and participants are required' });
    }

    // Ensure creator is included
    const allParticipants = [...new Set([userId, ...participantIds])];

    const conversation = new Conversation({
      type: 'group',
      name,
      description,
      avatar,
      participants: allParticipants,
      admin: userId,
    });

    await conversation.save();
    await conversation.populate('participants', 'username profilePic');

    res.status(201).json({ conversation });
  } catch (error) {
    console.error('Error creating group chat:', error);
    res.status(500).json({ message: 'Failed to create group chat' });
  }
};

// Update a group chat
export const updateGroupChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { name, description, avatar } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (conversation.admin.toString() !== userId) {
      return res.status(403).json({ message: 'Only group admin can update the group' });
    }

    if (name) conversation.name = name;
    if (description !== undefined) conversation.description = description;
    if (avatar !== undefined) conversation.avatar = avatar;

    await conversation.save();
    await conversation.populate('participants', 'username profilePic');

    res.json({ conversation });
  } catch (error) {
    console.error('Error updating group chat:', error);
    res.status(500).json({ message: 'Failed to update group chat' });
  }
};

// Add participant to group chat
export const addGroupParticipant = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { participantId } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (conversation.admin.toString() !== userId) {
      return res.status(403).json({ message: 'Only group admin can add participants' });
    }

    if (!conversation.participants.includes(participantId)) {
      conversation.participants.push(participantId);
      await conversation.save();
    }

    await conversation.populate('participants', 'username profilePic');
    res.json({ conversation });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ message: 'Failed to add participant' });
  }
};

// Remove participant from group chat
export const removeGroupParticipant = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, userId: participantId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (conversation.admin.toString() !== userId && userId !== participantId) {
      return res.status(403).json({ message: 'Not authorized to remove participants' });
    }

    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== participantId
    );
    await conversation.save();

    await conversation.populate('participants', 'username profilePic');
    res.json({ conversation });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ message: 'Failed to remove participant' });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.countDocuments({
      conversation: { $in: (await Conversation.find({ participants: userId }).select('_id')).map((c) => c._id) },
      'readBy.user': { $ne: userId },
      isDeleted: { $ne: true },
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};

// Toggle mute conversation
export const muteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.participants.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    const isMuted = conversation.mutedBy.includes(userId);
    if (isMuted) {
      conversation.mutedBy = conversation.mutedBy.filter(id => String(id) !== userId);
    } else {
      conversation.mutedBy.push(userId);
    }

    await conversation.save();
    res.json({ message: isMuted ? 'Unmuted' : 'Muted', isMuted: !isMuted });
  } catch (error) {
    console.error('Error muting conversation:', error);
    res.status(500).json({ message: 'Failed to mute conversation' });
  }
};

// Delete conversation
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.participants.includes(userId)) return res.status(403).json({ message: 'Not authorized' });

    // For now, we'll just remove the conversation completely if it's a direct chat or if admin deletes group
    // A better approach for the future would be "hiding" it for the user, but for this task hard delete or archived is fine.
    // Let's implement actual delete for now as per "Instagram" often implies leaving/deleting.

    await Conversation.findByIdAndDelete(conversationId);
    await Message.deleteMany({ conversation: conversationId });

    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Failed to delete conversation' });
  }
};

import Notification from '../models/Notification.js';

// Get all notifications for the current user
export async function getNotifications(req, res) {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'username profilePic displayName')
      .populate('post', 'media caption')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
}

// Mark notification as read
export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
}

// Mark all notifications as read
export async function markAllAsRead(req, res) {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
}

// Delete a notification
export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
}

// Create a notification (helper function)
export async function createNotification(data) {
  try {
    const { recipient, sender, type, post, comment, message } = data;

    // Don't create notification if sender is the recipient
    if (String(recipient) === String(sender)) {
      return null;
    }

    // Check if similar notification already exists (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingNotification = await Notification.findOne({
      recipient,
      sender,
      type,
      post: post || null,
      createdAt: { $gte: fiveMinutesAgo },
    });

    if (existingNotification) {
      // Update the existing notification timestamp
      existingNotification.createdAt = new Date();
      existingNotification.read = false;
      await existingNotification.save();
      return existingNotification;
    }

    // Create new notification
    const notification = new Notification({
      recipient,
      sender,
      type,
      post,
      comment,
      message,
    });

    await notification.save();
    
    // Populate sender info for real-time emission
    await notification.populate('sender', 'username profilePic displayName');
    if (post) await notification.populate('post', 'media caption');

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

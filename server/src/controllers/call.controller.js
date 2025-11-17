import Call from '../models/Call.js';

// Create a new call record
export const createCall = async (req, res) => {
  try {
    const { receiver, callType } = req.body;
    const caller = req.user._id;

    if (!receiver || !callType) {
      return res.status(400).json({ error: 'Receiver and call type are required' });
    }

    const call = await Call.create({
      caller,
      receiver,
      callType,
      status: 'pending',
    });

    await call.populate('caller receiver', 'username fullName profilePic');

    res.status(201).json({ 
      success: true,
      call 
    });
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({ error: 'Failed to create call record' });
  }
};

// Update call status (answered, rejected, missed, ended)
export const updateCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;
    const { status, duration } = req.body;

    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Verify user is part of the call
    if (
      call.caller.toString() !== req.user._id.toString() &&
      call.receiver.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    call.status = status;

    if (status === 'answered' && !call.startedAt) {
      call.startedAt = new Date();
    }

    if (status === 'ended' && duration !== undefined) {
      call.duration = duration;
      call.endedAt = new Date();
    }

    if (status === 'rejected' || status === 'missed') {
      call.endedAt = new Date();
    }

    await call.save();

    res.json({ 
      success: true,
      call 
    });
  } catch (error) {
    console.error('Error updating call status:', error);
    res.status(500).json({ error: 'Failed to update call status' });
  }
};

// Get call history for the authenticated user
export const getCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 50, page = 1 } = req.query;

    const calls = await Call.find({
      $or: [{ caller: userId }, { receiver: userId }],
    })
      .populate('caller receiver', 'username fullName profilePic')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Call.countDocuments({
      $or: [{ caller: userId }, { receiver: userId }],
    });

    res.json({
      success: true,
      calls,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
};

// Get call statistics
export const getCallStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalCalls = await Call.countDocuments({
      $or: [{ caller: userId }, { receiver: userId }],
    });

    const missedCalls = await Call.countDocuments({
      receiver: userId,
      status: 'missed',
    });

    const answeredCalls = await Call.countDocuments({
      $or: [{ caller: userId }, { receiver: userId }],
      status: 'answered',
    });

    const totalDuration = await Call.aggregate([
      {
        $match: {
          $or: [{ caller: userId }, { receiver: userId }],
          status: 'ended',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$duration' },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        totalCalls,
        missedCalls,
        answeredCalls,
        totalDuration: totalDuration[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching call stats:', error);
    res.status(500).json({ error: 'Failed to fetch call statistics' });
  }
};

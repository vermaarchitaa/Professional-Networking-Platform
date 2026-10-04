import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const getNotifications = async (req, res) => {
  const token = req.body.token || req.query.token;

  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const notifications = await Notification.find({
      recipientId: user._id,
      type: { $ne: "new_post" },
    })
      .populate("senderId", "name username profilePicture")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ notifications });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  const token = req.body.token || req.query.token;

  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const count = await Notification.countDocuments({
      recipientId: user._id,
      read: false,
      type: { $ne: "new_post" },
    });
    return res.json({ count });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const markNotificationsRead = async (req, res) => {
  const { token, notificationId } = req.body;

  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (notificationId) {
      await Notification.updateOne(
        { _id: notificationId, recipientId: user._id },
        { read: true }
      );
    } else {
      await Notification.updateMany(
        { recipientId: user._id, read: false, type: { $ne: "new_post" } },
        { read: true }
      );
    }

    return res.json({ message: "Notifications marked as read" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getNewPostCount = async (req, res) => {
  const token = req.body.token || req.query.token;

  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const count = await Notification.countDocuments({
      recipientId: user._id,
      type: "new_post",
      read: false,
    });
    return res.json({ count });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const markNewPostsSeen = async (req, res) => {
  const token = req.body.token || req.query.token;

  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    await Notification.updateMany(
      { recipientId: user._id, type: "new_post", read: false },
      { $set: { read: true } }
    );
    return res.json({ message: "New post notifications marked as seen", count: 0 });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

import Notification from "../models/notification.model.js";
import ConnectionRequest from "../models/connections.model.js";

export const createNotification = async ({ recipientId, senderId, type, message, referenceId = "" }) => {
  if (String(recipientId) === String(senderId)) return;

  if (type === "new_post" && referenceId) {
    const existing = await Notification.exists({
      recipientId,
      type: "new_post",
      referenceId: String(referenceId),
    });
    if (existing) return;
  }

  const notification = new Notification({
    recipientId,
    senderId,
    type,
    message,
    referenceId,
  });

  await notification.save();
};

export const notifyAcceptedConnectionsOfPost = async (senderId, postId, senderName) => {
  try {
    const rows = await ConnectionRequest.find({
      status_accepted: true,
      $or: [{ userId: senderId }, { connectionId: senderId }],
    }).select("userId connectionId");

    const recipientIds = new Set();
    const senderKey = String(senderId);
    rows.forEach((row) => {
      const a = String(row.userId);
      const b = String(row.connectionId);
      const peer = a === senderKey ? b : a;
      if (peer && peer !== senderKey) recipientIds.add(peer);
    });

    await Promise.all([...recipientIds].map((recipientId) => (
      createNotification({
        recipientId,
        senderId,
        type: "new_post",
        message: `${senderName} posted`,
        referenceId: String(postId),
      }).catch(() => {})
    )));
  } catch {
    // Post creation must still succeed if notification fan-out fails.
  }
};

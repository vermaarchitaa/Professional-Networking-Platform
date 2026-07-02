import Notification from "../models/notification.model.js";

export const createNotification = async ({ recipientId, senderId, type, message, referenceId = "" }) => {
  if (String(recipientId) === String(senderId)) return;

  const notification = new Notification({
    recipientId,
    senderId,
    type,
    message,
    referenceId,
  });

  await notification.save();
};

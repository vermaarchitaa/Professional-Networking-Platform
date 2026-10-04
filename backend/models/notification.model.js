import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["like", "comment", "connection_request", "connection_accept", "new_post"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  referenceId: {
    type: String,
    default: "",
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.index(
  { recipientId: 1, type: 1, referenceId: 1 },
  { unique: true, partialFilterExpression: { type: "new_post" } }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;

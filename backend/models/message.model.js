import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    conversationId: {
        type: String,
        required: true,
        index: true,
    },
    text: {
        type: String,
        default: "",
        trim: true,
        maxlength: 2000,
    },
    messageType: {
        type: String,
        enum: ["text", "media", "document", "gif", "gift", "sticker", "profile"],
        default: "text",
    },
    attachment: {
        filename: { type: String, default: "" },
        originalName: { type: String, default: "" },
        mimeType: { type: String, default: "" },
        size: { type: Number, default: 0 },
        kind: { type: String, default: "" },
        giftId: { type: String, default: "" },
        giftEmoji: { type: String, default: "" },
        stickerId: { type: String, default: "" },
        gifUrl: { type: String, default: "" },
        profileUserId: { type: String, default: "" },
        username: { type: String, default: "" },
    },
    read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, read: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;

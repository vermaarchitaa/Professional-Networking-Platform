import path from "path";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import ConnectionRequest from "../models/connections.model.js";
import { findGift, isAllowedSticker } from "../utils/messageAttachments.js";
import {
    allowedMessageExtension,
    isMessageDocumentType,
    isMessageMediaType,
    removeUploadedFile,
} from "../utils/uploads.js";

const PUBLIC_USER_FIELDS = "name username profilePicture";
const MESSAGE_MAX = 2000;

const isAllowedGifUrl = (url) => {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        return parsed.protocol === "https:" && (
            host === "giphy.com" ||
            host.endsWith(".giphy.com") ||
            host.endsWith("giphy.net")
        );
    } catch {
        return false;
    }
};

const safeOriginalName = (name) => {
    const base = path.basename(String(name || "file")).replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 120);
    return base || "file";
};

const publicAttachment = (attachment) => {
    if (!attachment) return null;
    const filename = String(attachment.filename || "");
    const giftId = String(attachment.giftId || "");
    const stickerId = String(attachment.stickerId || "");
    const gifUrl = String(attachment.gifUrl || "");
    const profileUserId = String(attachment.profileUserId || "");
    const username = String(attachment.username || "");
    const kind = String(attachment.kind || "");
    if (!filename && !giftId && !stickerId && !gifUrl && !profileUserId) return null;
    return {
        filename,
        originalName: String(attachment.originalName || ""),
        mimeType: String(attachment.mimeType || ""),
        size: Number(attachment.size || 0),
        kind,
        giftId,
        giftEmoji: String(attachment.giftEmoji || ""),
        stickerId,
        gifUrl,
        profileUserId,
        username,
    };
};

const normalizeType = (value) => {
    const type = String(value || "").trim();
    return ["text", "media", "document", "gif", "gift", "sticker", "profile"].includes(type) ? type : "text";
};

export const conversationIdFor = (firstId, secondId) => {
    const [left, right] = [String(firstId), String(secondId)].sort();
    return `${left}_${right}`;
};

const findUserByToken = async (token) => {
    if (!token || typeof token !== "string") return null;
    return User.findOne({ token });
};

export const areAcceptedConnections = async (firstId, secondId) => Boolean(await ConnectionRequest.exists({
    status_accepted: true,
    $or: [
        { userId: firstId, connectionId: secondId },
        { userId: secondId, connectionId: firstId },
    ],
}));

const peerFromConversation = (conversationId, viewerId) => {
    const [left, right] = String(conversationId || "").split("_");
    if (!left || !right) return "";
    return String(left) === String(viewerId) ? right : left;
};

const isParticipant = (conversationId, userId) => {
    const [left, right] = String(conversationId || "").split("_");
    return String(left) === String(userId) || String(right) === String(userId);
};

const publicUser = (user) => {
    if (!user) return null;
    return {
        _id: user._id,
        name: user.name,
        username: user.username,
        profilePicture: user.profilePicture,
    };
};

const publicMessage = (message) => ({
    _id: message._id,
    conversationId: message.conversationId,
    text: message.text || "",
    messageType: normalizeType(message.messageType),
    attachment: publicAttachment(message.attachment),
    read: message.read,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    senderId: publicUser(message.senderId?._id ? message.senderId : { _id: message.senderId }),
    receiverId: publicUser(message.receiverId?._id ? message.receiverId : { _id: message.receiverId }),
});

const resolveShareUser = async (key) => {
    const value = String(key || "").trim();
    if (!value) return null;
    if (/^[a-f0-9]{24}$/i.test(value)) {
        const byId = await User.findById(value).select(PUBLIC_USER_FIELDS);
        if (byId) return byId;
    }
    return User.findOne({ username: value }).select(PUBLIC_USER_FIELDS);
};

const decorateMessage = async (message) => {
    const pub = publicMessage(message);
    if (pub.messageType === "profile" && pub.attachment?.profileUserId) {
        pub.attachment.profile = await loadPeerCard(pub.attachment.profileUserId);
    }
    return pub;
};

const loadPeerCard = async (userId) => {
    const user = await User.findById(userId).select(PUBLIC_USER_FIELDS);
    if (!user) return null;
    const profile = await Profile.findOne({ userId }).select("currentPost location intro");
    const location = [profile?.intro?.city, profile?.intro?.country].filter(Boolean).join(", ") || String(profile?.location || "").trim();
    return {
        ...publicUser(user),
        headline: String(profile?.currentPost || "").trim(),
        location,
    };
};

export const sendMessage = async (req, res) => {
    const uploadedName = req.file?.filename;
    const discardUpload = () => {
        if (uploadedName) removeUploadedFile(uploadedName);
    };

    try {
        const { token, receiverId, text, giftId, stickerId, gifUrl, profileUserId, shareUsername } = req.body;
        const sender = await findUserByToken(token);
        if (!sender) {
            discardUpload();
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!receiverId) {
            discardUpload();
            return res.status(400).json({ message: "Receiver is required" });
        }
        if (String(sender._id) === String(receiverId)) {
            discardUpload();
            return res.status(400).json({ message: "Cannot message yourself" });
        }

        const receiver = await User.findById(receiverId).select(PUBLIC_USER_FIELDS);
        if (!receiver) {
            discardUpload();
            return res.status(404).json({ message: "User not found" });
        }

        const body = String(text || "").trim();
        if (body.length > MESSAGE_MAX) {
            discardUpload();
            return res.status(400).json({ message: `Messages must be under ${MESSAGE_MAX} characters` });
        }

        const connected = await areAcceptedConnections(sender._id, receiver._id);
        if (!connected) {
            discardUpload();
            return res.status(403).json({ message: "You can only message accepted connections" });
        }

        let messageType = "text";
        let attachment = undefined;

        if (req.file) {
            const mime = req.file.mimetype;
            const originalExt = path.extname(req.file.originalname || "").toLowerCase();
            if (originalExt && !allowedMessageExtension(req.file.originalname)) {
                discardUpload();
                return res.status(400).json({ message: "Unsupported file type" });
            }
            if (!allowedMessageExtension(req.file.filename)) {
                discardUpload();
                return res.status(400).json({ message: "Unsupported file type" });
            }
            if (isMessageMediaType(mime)) {
                messageType = "media";
                attachment = {
                    filename: req.file.filename,
                    originalName: safeOriginalName(req.file.originalname),
                    mimeType: mime,
                    size: req.file.size,
                    kind: mime.startsWith("video/") ? "video" : "image",
                };
            } else if (isMessageDocumentType(mime)) {
                messageType = "document";
                attachment = {
                    filename: req.file.filename,
                    originalName: safeOriginalName(req.file.originalname),
                    mimeType: mime,
                    size: req.file.size,
                    kind: "document",
                };
            } else {
                discardUpload();
                return res.status(400).json({ message: "Unsupported file type" });
            }
        } else if (gifUrl) {
            const url = String(gifUrl).trim();
            if (!isAllowedGifUrl(url)) {
                return res.status(400).json({ message: "Invalid GIF URL" });
            }
            messageType = "gif";
            attachment = { gifUrl: url, kind: "gif" };
        } else if (giftId) {
            const gift = findGift(String(giftId));
            if (!gift) {
                return res.status(400).json({ message: "Unsupported gift" });
            }
            messageType = "gift";
            attachment = { giftId: gift.id, giftEmoji: gift.emoji, kind: "gift" };
        } else if (stickerId) {
            if (!isAllowedSticker(stickerId)) {
                return res.status(400).json({ message: "Unsupported sticker" });
            }
            messageType = "sticker";
            attachment = { stickerId: String(stickerId), kind: "sticker" };
        } else if (profileUserId || shareUsername) {
            const sharedUser = await resolveShareUser(profileUserId || shareUsername);
            if (!sharedUser) {
                return res.status(404).json({ message: "Profile not found" });
            }
            messageType = "profile";
            attachment = {
                profileUserId: String(sharedUser._id),
                username: String(sharedUser.username || ""),
                kind: "profile",
            };
        }

        if (!body && messageType === "text") {
            return res.status(400).json({ message: "Message cannot be empty" });
        }

        const conversationId = conversationIdFor(sender._id, receiver._id);
        const created = await Message.create({
            senderId: sender._id,
            receiverId: receiver._id,
            conversationId,
            text: body,
            messageType,
            ...(attachment ? { attachment } : {}),
            read: false,
        });

        const message = await Message.findById(created._id)
            .populate("senderId", PUBLIC_USER_FIELDS)
            .populate("receiverId", PUBLIC_USER_FIELDS);

        return res.json({
            message: await decorateMessage(message),
            conversationId,
        });
    } catch (error) {
        discardUpload();
        return res.status(500).json({ message: error.message });
    }
};

export const getConversations = async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        const viewer = await findUserByToken(token);
        if (!viewer) return res.status(401).json({ message: "Unauthorized" });

        const grouped = await Message.aggregate([
            {
                $match: {
                    $or: [{ senderId: viewer._id }, { receiverId: viewer._id }],
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$conversationId",
                    lastMessage: { $first: "$$ROOT" },
                },
            },
            { $sort: { "lastMessage.createdAt": -1 } },
        ]);

        const conversations = [];
        for (const row of grouped) {
            const conversationId = row._id;
            if (!isParticipant(conversationId, viewer._id)) continue;
            const peerId = peerFromConversation(conversationId, viewer._id);
            const connected = await areAcceptedConnections(viewer._id, peerId);
            if (!connected) continue;

            const peer = await loadPeerCard(peerId);
            if (!peer) continue;

            const unreadCount = await Message.countDocuments({
                conversationId,
                receiverId: viewer._id,
                read: false,
            });

            const lastAttachment = publicAttachment(row.lastMessage.attachment);
            if (normalizeType(row.lastMessage.messageType) === "profile" && lastAttachment?.profileUserId) {
                lastAttachment.profile = await loadPeerCard(lastAttachment.profileUserId);
            }

            conversations.push({
                conversationId,
                peer,
                lastMessage: {
                    _id: row.lastMessage._id,
                    text: row.lastMessage.text || "",
                    messageType: normalizeType(row.lastMessage.messageType),
                    attachment: lastAttachment,
                    createdAt: row.lastMessage.createdAt,
                    senderId: row.lastMessage.senderId,
                    read: row.lastMessage.read,
                },
                unreadCount,
            });
        }

        return res.json({ conversations });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getConversationMessages = async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        const { conversationId } = req.params;
        const viewer = await findUserByToken(token);
        if (!viewer) return res.status(401).json({ message: "Unauthorized" });
        if (!isParticipant(conversationId, viewer._id)) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const peerId = peerFromConversation(conversationId, viewer._id);
        const connected = await areAcceptedConnections(viewer._id, peerId);
        if (!connected) {
            return res.status(403).json({ message: "You can only message accepted connections" });
        }

        const messages = await Message.find({ conversationId })
            .populate("senderId", PUBLIC_USER_FIELDS)
            .populate("receiverId", PUBLIC_USER_FIELDS)
            .sort({ createdAt: 1 });

        const peer = await loadPeerCard(peerId);
        return res.json({
            conversationId,
            peer,
            messages: await Promise.all(messages.map(decorateMessage)),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const markConversationRead = async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        const { conversationId } = req.params;
        const viewer = await findUserByToken(token);
        if (!viewer) return res.status(401).json({ message: "Unauthorized" });
        if (!isParticipant(conversationId, viewer._id)) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await Message.updateMany(
            { conversationId, receiverId: viewer._id, read: false },
            { $set: { read: true } }
        );

        return res.json({ message: "Conversation marked as read", conversationId });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getMessageUnreadCount = async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        const viewer = await findUserByToken(token);
        if (!viewer) return res.status(401).json({ message: "Unauthorized" });

        const unread = await Message.find({ receiverId: viewer._id, read: false }).select("senderId");
        let count = 0;
        const checked = new Set();
        for (const row of unread) {
            const peerId = String(row.senderId);
            if (checked.has(peerId)) {
                count += 1;
                continue;
            }
            checked.add(peerId);
            if (await areAcceptedConnections(viewer._id, peerId)) count += 1;
        }

        return res.json({ count });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getMessagingPeer = async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        const { userId } = req.params;
        const viewer = await findUserByToken(token);
        if (!viewer) return res.status(401).json({ message: "Unauthorized" });
        if (!userId || String(userId) === String(viewer._id)) {
            return res.status(400).json({ message: "Invalid user" });
        }

        const connected = await areAcceptedConnections(viewer._id, userId);
        if (!connected) {
            return res.status(403).json({ message: "You can only message accepted connections" });
        }

        const peer = await loadPeerCard(userId);
        if (!peer) return res.status(404).json({ message: "User not found" });

        const conversationId = conversationIdFor(viewer._id, userId);
        const existing = await Message.exists({ conversationId });

        return res.json({
            peer,
            conversationId,
            hasMessages: Boolean(existing),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getShareProfile = async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        const viewer = await findUserByToken(token);
        if (!viewer) return res.status(401).json({ message: "Unauthorized" });

        const sharedUser = await resolveShareUser(req.params.userKey);
        if (!sharedUser) return res.status(404).json({ message: "Profile not found" });

        const profile = await loadPeerCard(sharedUser._id);
        if (!profile) return res.status(404).json({ message: "Profile not found" });

        return res.json({ profile });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getMessageRecipients = async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        const viewer = await findUserByToken(token);
        if (!viewer) return res.status(401).json({ message: "Unauthorized" });

        const rows = await ConnectionRequest.find({
            status_accepted: true,
            $or: [{ userId: viewer._id }, { connectionId: viewer._id }],
        }).select("userId connectionId");

        const peerIds = [...new Set(rows.map((row) => (
            String(row.userId) === String(viewer._id) ? String(row.connectionId) : String(row.userId)
        )))].filter((id) => id && id !== String(viewer._id));

        const recipients = [];
        for (const peerId of peerIds) {
            const peer = await loadPeerCard(peerId);
            if (peer) recipients.push(peer);
        }

        return res.json({ recipients });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

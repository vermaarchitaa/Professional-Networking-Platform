import { Router } from "express";
import {
    sendMessage,
    getConversations,
    getConversationMessages,
    markConversationRead,
    getMessageUnreadCount,
    getMessagingPeer,
    getShareProfile,
    getMessageRecipients,
} from "../controllers/message.controller.js";
import { messageAttachmentUpload } from "../utils/uploads.js";

const router = Router();

router.route("/messages/send").post(messageAttachmentUpload.single("file"), sendMessage);
router.route("/messages/conversations").get(getConversations);
router.route("/messages/unread_count").get(getMessageUnreadCount);
router.route("/messages/recipients").get(getMessageRecipients);
router.route("/messages/share_profile/:userKey").get(getShareProfile);
router.route("/messages/peer/:userId").get(getMessagingPeer);
router.route("/messages/:conversationId/read").patch(markConversationRead);
router.route("/messages/:conversationId").get(getConversationMessages);

export default router;

import { Router } from "express";
import {
  getNotifications,
  getUnreadCount,
  markNotificationsRead,
  getNewPostCount,
  markNewPostsSeen,
} from "../controllers/notification.controller.js";

const router = Router();

router.route("/notifications").get(getNotifications);
router.route("/notifications/unread_count").get(getUnreadCount);
router.route("/notifications/new_post_count").get(getNewPostCount);
router.route("/notifications/new_post_seen").post(markNewPostsSeen);
router.route("/notifications/mark_read").post(markNotificationsRead);

export default router;

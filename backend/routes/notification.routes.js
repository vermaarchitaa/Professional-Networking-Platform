import { Router } from "express";
import {
  getNotifications,
  getUnreadCount,
  markNotificationsRead,
} from "../controllers/notification.controller.js";

const router = Router();

router.route("/notifications").get(getNotifications);
router.route("/notifications/unread_count").get(getUnreadCount);
router.route("/notifications/mark_read").post(markNotificationsRead);

export default router;

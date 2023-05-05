import express, { Router } from "express";

const router: Router = express.Router();
import {
  GetAllNotification,
  GetUnreadNotification,
  MarkAsReadNotification,
  MarkAllAsReadNotification,
} from "../controllers/Notification";

router.get("/find/:id", GetAllNotification);
router.get("/find/unread/:id", GetUnreadNotification);
router.put("/read/:id", MarkAsReadNotification);
router.put("/read-all/:id", MarkAllAsReadNotification);
export default router;

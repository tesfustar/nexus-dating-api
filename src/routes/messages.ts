import express, { Router } from "express";

const router: Router = express.Router();

import {
  CreateMessages,
  GetMyMessages,
  GetAllMyMessages,
  GroupMessagesByDay,
} from "../controllers/Messages";

router.post("/create", CreateMessages);
router.get("/find/:conversationId", GetMyMessages);
router.get("/all/:id", GetAllMyMessages);
router.get("/all-by-day/:id", GroupMessagesByDay);

export default router;

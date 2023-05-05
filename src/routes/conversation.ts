import express,{Router} from "express";

const router: Router = express.Router();

import {
  CreateConversation,
//   GetMyConversation,
  DeleteAllConversation,
  DeleteConversation,
} from "../controllers/Conversation";

router.post("/create", CreateConversation);
// router.get("/find/:userId", GetMyConversation);
router.delete("/delete/all", DeleteAllConversation);
router.delete("/delete/:id", DeleteConversation); //means un match

export default router;

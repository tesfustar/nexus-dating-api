import express, { Router } from "express";

const router: Router = express.Router();
import {
  SendMatchRequest,
  AcceptMatchRequest,
  RejectMatchRequest,
  GetAllMyMatchRequest,
  GetSingleMatchRequest,
} from "../controllers/MatchRequest";

router.post("/send", SendMatchRequest);
router.get("/accept/:id", AcceptMatchRequest);
router.get("/reject/:id", RejectMatchRequest);
router.get("/all/:userId", GetAllMyMatchRequest);
router.get("/find/:id", GetSingleMatchRequest);

export default router;

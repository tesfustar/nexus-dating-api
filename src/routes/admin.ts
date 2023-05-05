import express from "express";

const router = express.Router();

import {
  DashboardData,
  UserDetailInfo,
  GetSingleUser,
  DeleteAllUsers,
  DeleteUser,
  GetAllUsers,
} from "../controllers/Admin";
// verifyOtp,registerUser
// import { verifyTokenAndAdmin } from "../Middleware/authorization.js";
router.post("/dashboard",  DashboardData);
router.post("/users-list",  UserDetailInfo);
router.get("/user/find/:id", GetSingleUser);
router.delete("/user/delete", DeleteAllUsers);
router.delete("/user/remove/:id", DeleteUser);
router.get("/user/all", GetAllUsers);

export default router;

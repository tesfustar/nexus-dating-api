import express,{Router} from "express";
const router: Router = express.Router();

import {
  UpdateUserInfo,
  GetMyMatches,
  UserProfile,
  ChangePassword,
  BlockUser,
  UnBlockUser,
  GetBlockedUsers,
  FilterUser,
  DeleteMyAccount,
  UpdateProfileImages,
  DeleteProfileImage
} from "../controllers/User";



router.put("/profile/update/:id", UpdateUserInfo);
router.put("/images/update/:id", UpdateProfileImages); // update profile images images
router.delete("/profile/remove/:userId", DeleteProfileImage); // delete profile image
router.post("/filter/:id", FilterUser);
router.get("/my-matches/:id", GetMyMatches);
router.get("/profile/:id", UserProfile);
router.put("/change-password/:id", ChangePassword);
router.put("/block/:id", BlockUser);
router.put("/unblock/:id", UnBlockUser);
router.get("/blocked-users/:id", GetBlockedUsers);
router.delete("/account/delete/:id", DeleteMyAccount);
export default router;

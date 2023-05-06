import express, { Router } from "express";
import { SignIn,SignUp,VerifyOtp  ,RegisterUser,ForgotPassword,ForgotPasswordOtpVerify,SetNewPassword} from "../controllers/AuthController";

const router: Router = express.Router();

router.post("/sign-in", SignIn);
router.post("/sign-up", SignUp); //initial phone verification
router.post("/verify-otp", VerifyOtp); //verify otp for registration
router.put("/register", RegisterUser); //finish registration
router.post("/forgot-password", ForgotPassword); //send otp for set password
router.post("/forgot-password/verify-otp", ForgotPasswordOtpVerify); //
router.put("/forgot-password/new-password", SetNewPassword);
export default router;

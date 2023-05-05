import express, { Router } from "express";
import { SignIn,SignUp,VerifyOtp  ,RegisterUser} from "../controllers/AuthController";

const router: Router = express.Router();

router.post("/sign-in", SignIn);
router.post("/sign-up", SignUp); //initial phone verification
router.post("/verify-otp", VerifyOtp); //verify otp for registration
router.put("/register", RegisterUser); //finish registration
export default router;

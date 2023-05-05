import mongoose from "mongoose";
import { IOtp } from "../interfaces/Otp";
const otpSchema = new mongoose.Schema<IOtp>(
  {
    phone: { type: Number },
    code: { type: String },
    isUsed: { type: Boolean, default: false },
    isForForget: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const Otp = mongoose.model<IOtp>("Otp", otpSchema);

export default Otp;

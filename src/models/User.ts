import mongoose from "mongoose";
import paginate from "mongoose-paginate-v2";
import { IUser } from "../interfaces/User";


const ProfileSchema  = new mongoose.Schema({
  filename:{ type: String }
})
const userSchema = new mongoose.Schema<IUser>(
  {
    phone: { type: Number, unique: true },
    password: { type: String },
    fullName: { type: String },
    displayName: { type: String },
    gender: { type: String },
    birthDate: { type: Date },
    bio: { type: String },
    profile: { type: [ProfileSchema] },
    location: { type: [Number] },
    address: { type: String },
    interest: { type: [String] },
    pets: { type: String },
    lookingFor: { type: String },
    education: { type: String },
    communication: { type: String },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isAdmin: { type: Boolean, default: false },
    otpVerified: { type: Boolean, default: false },
    hasFullInfo: { type: Boolean, default: false },
  },
  { timestamps: true }
);
userSchema.index({ location: "2dsphere" });

userSchema.plugin(paginate);
const User = mongoose.model<IUser>("User", userSchema);

export default User;
